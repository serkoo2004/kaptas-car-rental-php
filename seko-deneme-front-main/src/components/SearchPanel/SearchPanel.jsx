import React, { useEffect, useRef, useState } from 'react';
import { useI18n } from '../../i18n/I18nContext';
import { translateLocationName } from '../../i18n/locationNames';
import './SearchPanel.css';

const fallbackLocation = {
  id: 'fallback-trabzon-airport',
  name: 'Havalimanı',
  type: 'airport',
};

const SearchPanel = () => {
  const { language, t } = useI18n();
  const today = new Date();
  const endDate = new Date(today);
  endDate.setDate(today.getDate() + 3);
  const dateFormat = new Intl.DateTimeFormat('en-CA');
  const [formData, setFormData] = useState({
    pickupLocation: fallbackLocation.name,
    startDate: dateFormat.format(today),
    startTime: '09:00',
    endDate: dateFormat.format(endDate),
    endTime: '09:00'
  });
  const [locations, setLocations] = useState([fallbackLocation]);
  const [selectedLocation, setSelectedLocation] = useState(fallbackLocation);
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const locationPickerRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    fetch(`/api/public/locations?lang=${encodeURIComponent(language)}`, {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (!isMounted || !payload?.locations?.length) {
          return;
        }

        const availableLocations = payload.locations;
        const query = new URLSearchParams(window.location.search);
        const requestedId = query.get('pickupLocationId');
        const requestedName = query.get('pickupLocation');
        const primaryLocation = availableLocations.find((location) => location.id === requestedId)
          || availableLocations.find((location) => location.name === requestedName)
          || availableLocations[0];

        setLocations(availableLocations);
        setSelectedLocation(primaryLocation);
        setFormData((prev) => ({
          ...prev,
          pickupLocation: primaryLocation.name,
        }));
      })
      .catch(() => null);

    return () => {
      isMounted = false;
    };
  }, [language]);

  useEffect(() => {
    if (!isLocationOpen) {
      return undefined;
    }

    const closeOnOutsideClick = (event) => {
      if (!locationPickerRef.current?.contains(event.target)) {
        setIsLocationOpen(false);
      }
    };
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') {
        setIsLocationOpen(false);
      }
    };

    document.addEventListener('pointerdown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);

    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [isLocationOpen]);

  const times = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
    '20:00', '20:30', '21:00', '21:30', '22:00', '22:30', '23:00', '23:30'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const pickupAt = new Date(`${formData.startDate}T${formData.startTime}:00`);
    const dropoffAt = new Date(`${formData.endDate}T${formData.endTime}:00`);

    if (!formData.pickupLocation) {
      alert(t('search.selectLocation'));
      return;
    }

    if (Number.isNaN(pickupAt.getTime()) || Number.isNaN(dropoffAt.getTime())) {
      alert(t('search.invalidDates'));
      return;
    }

    if (pickupAt < new Date()) {
      alert(t('search.pastPickup'));
      return;
    }

    if (dropoffAt <= pickupAt) {
      alert(t('search.invalidDropoff'));
      return;
    }

    const params = new URLSearchParams();

    Object.entries(formData).forEach(([key, value]) => {
      params.set(key, String(value));
    });

    if (selectedLocation.id && !selectedLocation.id.startsWith('fallback-')) {
      params.set('pickupLocationId', selectedLocation.id);
      params.set('dropLocationId', selectedLocation.id);
    }
    params.set('dropLocation', formData.pickupLocation);

    window.location.href = `/arac-filosu?${params.toString()}`;
  };

  const selectLocation = (location) => {
    setSelectedLocation(location);
    setFormData((prev) => ({
      ...prev,
      pickupLocation: location.name,
    }));
    setIsLocationOpen(false);
  };

  return (
    <div className="search-panel container">
      <form onSubmit={handleSubmit} className="search-form">
        
        {/* Alış Lokasyonu */}
        <div className="form-group location-group" ref={locationPickerRef}>
          <label className="top-label">{t('search.location')}</label>
          <button
            aria-expanded={isLocationOpen}
            aria-haspopup="listbox"
            className="pill-wrapper location-pill"
            onClick={() => setIsLocationOpen((open) => !open)}
            type="button"
          >
            <i className='bx bx-map-pin'></i>
            <span className="fixed-location-name">
              {translateLocationName(selectedLocation.name, t)}
            </span>
            <i className={`bx bx-chevron-down location-chevron${isLocationOpen ? ' open' : ''}`}></i>
          </button>
          {isLocationOpen && (
            <div className="location-popover" role="listbox" aria-label={t('search.location')}>
              {locations.map((location) => {
                const isSelected = location.id === selectedLocation.id;
                const locationDetail = location.subtitle
                  || [location.district, location.city].filter(Boolean).join(', ')
                  || location.address
                  || t('search.location');
                return (
                  <button
                    aria-selected={isSelected}
                    className={`location-option${isSelected ? ' selected' : ''}`}
                    key={location.id || location.name}
                    onClick={() => selectLocation(location)}
                    role="option"
                    type="button"
                  >
                    <span className="location-option-icon">
                      <i className={`bx ${location.type === 'airport' ? 'bxs-plane-alt' : 'bxs-building-house'}`}></i>
                    </span>
                    <span>
                      <strong>{translateLocationName(location.name, t)}</strong>
                      <small>{locationDetail}</small>
                    </span>
                    {isSelected && <i className='bx bx-check location-selected-icon'></i>}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Alış Tarihi ve Saati */}
        <div className="form-group date-time-group">
          <label className="top-label">{t('search.pickup')}</label>
          <div className="pill-wrapper date-time-pill">
            <div className="date-part" onClick={(e) => {
              const input = e.currentTarget.querySelector('input[type="date"]');
              if (input && input.showPicker) {
                try { input.showPicker(); } catch {}
              }
            }}>
              <i className='bx bx-calendar'></i>
              <input 
                type="date" 
                name="startDate" 
                min={dateFormat.format(today)}
                value={formData.startDate}
                onChange={handleInputChange}
                onClick={(e) => {
                  if (e.target.showPicker) {
                    try { e.target.showPicker(); } catch {}
                  }
                }}
              />
            </div>
            <div className="time-part">
              <select 
                name="startTime" 
                value={formData.startTime}
                onChange={handleInputChange}
              >
                {times.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Bırakış Tarihi ve Saati */}
        <div className="form-group date-time-group">
          <label className="top-label">{t('search.dropoff')}</label>
          <div className="pill-wrapper date-time-pill">
            <div className="date-part" onClick={(e) => {
              const input = e.currentTarget.querySelector('input[type="date"]');
              if (input && input.showPicker) {
                try { input.showPicker(); } catch {}
              }
            }}>
              <i className='bx bx-calendar'></i>
              <input 
                type="date" 
                name="endDate" 
                min={formData.startDate || dateFormat.format(today)}
                value={formData.endDate}
                onChange={handleInputChange}
                onClick={(e) => {
                  if (e.target.showPicker) {
                    try { e.target.showPicker(); } catch {}
                  }
                }}
              />
            </div>
            <div className="time-part">
              <select 
                name="endTime" 
                value={formData.endTime}
                onChange={handleInputChange}
              >
                {times.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Search Button */}
        <div className="form-group search-btn-group">
          <button type="submit" className="search-btn-pill">
            {t('search.submit')}
          </button>
        </div>

      </form>
    </div>
  );
};

export default SearchPanel;
