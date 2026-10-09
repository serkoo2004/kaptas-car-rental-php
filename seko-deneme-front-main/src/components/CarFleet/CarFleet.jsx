import React, { useEffect, useState } from 'react';
import { useI18n } from '../../i18n/I18nContext';
import './CarFleet.css';

const CarFleet = () => {
  const { currency, language, t } = useI18n();
  const [cars, setCars] = useState([]);
  const [selectedCar, setSelectedCar] = useState(null);
  const [featureCar, setFeatureCar] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [availabilityFiltered, setAvailabilityFiltered] = useState(false);

  const fitVehicleImage = (event) => {
    const image = event.currentTarget;
    const aspectRatio = image.naturalHeight ? image.naturalWidth / image.naturalHeight : 0;
    image.classList.toggle('vehicle-image-zoom', aspectRatio > 0 && aspectRatio < 1.9);
  };

  useEffect(() => {
    const controller = new AbortController();
    const query = new URLSearchParams(window.location.search);
    query.set('currency', currency);
    setIsLoading(true);
    setLoadError('');

    fetch(`/api/public/vehicles?${query.toString()}`, {
      cache: 'no-store',
      signal: controller.signal,
    })
      .then(async (response) => {
        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(payload?.error || t('fleet.unavailable'));
        }

        return payload;
      })
      .then((payload) => {
        if (!payload || !Array.isArray(payload.data)) {
          throw new Error(t('fleet.unavailable'));
        }
        setCars(payload.data);
        setAvailabilityFiltered(Boolean(payload.availability?.filtered));
      })
      .catch((error) => {
        if (error.name !== 'AbortError') {
          console.warn(error.message);
          setLoadError(error.message || t('fleet.unavailable'));
        }
      })
      .finally(() => {
        setIsLoading(false);
      });

    return () => controller.abort();
  }, [currency, t]);

  const openModal = (car) => {
    if (!car?.canBook) {
      return;
    }

    setSelectedCar(car);
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setSelectedCar(null);
    document.body.style.overflow = 'auto';
  };

  const openFeatures = (car) => {
    setFeatureCar(car);
    document.body.style.overflow = 'hidden';
  };

  const closeFeatures = () => {
    setFeatureCar(null);
    document.body.style.overflow = 'auto';
  };

  const handleRentalSubmit = async (event) => {
    event.preventDefault();

    if (!selectedCar) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    const payload = {
      contactEmail: String(formData.get('email') || '').trim(),
      contactName: String(formData.get('fullName') || '').trim(),
      contactPhone: String(formData.get('phone') || '').trim(),
      dropoffDate: new URLSearchParams(window.location.search).get('endDate') || '',
      dropoffLocation: new URLSearchParams(window.location.search).get('dropLocation') || '',
      dropoffTime: new URLSearchParams(window.location.search).get('endTime') || '',
      pickupDate: new URLSearchParams(window.location.search).get('startDate') || '',
      pickupLocationId: new URLSearchParams(window.location.search).get('pickupLocationId') || '',
      pickupLocation: new URLSearchParams(window.location.search).get('pickupLocation') || '',
      pickupTime: new URLSearchParams(window.location.search).get('startTime') || '',
      privacyNoticeAccepted: formData.get('privacyNoticeAccepted') === 'on',
      currency,
      vehicleId: selectedCar.backendId || selectedCar.id,
    };

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/public/rental-intents', {
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      });
      const result = await response.json();

      if (!response.ok || !result.redirectUrl) {
        throw new Error(result.error || t('fleet.requestFailed'));
      }

      window.location.href = result.redirectUrl;
    } catch (error) {
      alert(error.message || t('fleet.requestFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="car-fleet-section container">
      <div className="fleet-header">
        <h2>{t('fleet.title')}</h2>
        <p>{t('fleet.intro')}</p>
      </div>

      {isLoading && (
        <div className="fleet-state-message">{t('fleet.loading')}</div>
      )}

      {!isLoading && cars.length === 0 && (
        <div className="fleet-state-message">
          {loadError || (availabilityFiltered
            ? t('fleet.noAvailability')
            : t('fleet.noVehicles'))}
        </div>
      )}

      <div className="car-grid">
        {cars.map((car) => (
          <div key={car.id} className="car-card">
            {car.specialOffer && <div className="offer-badge">{t('fleet.specialOffer')}</div>}
            
            <div className="car-card-header">
              <h3 className="car-name">
                {car.name.replace(' ve benzeri..', '')}
                <span className="similar-text">{t('fleet.similar')}</span>
              </h3>
            </div>

            <div className="car-image">
              <img src={car.image} alt={car.name} onLoad={fitVehicleImage} />
            </div>

            <div className="car-price-row">
              <div className="car-price-copy">
                <span>{t('fleet.dailyPrice')}</span>
                <strong>{formatMoney(car.dailyPriceAmount, currency, language) || t('fleet.priceUnavailable')}</strong>
              </div>
              <div className="car-stock-count">
                <i className='bx bx-car'></i>
                <span>{availabilityLabel(car.availableCount, availabilityFiltered, t)}</span>
              </div>
            </div>

            <div className="car-details">
              <div className="features-grid">
                <div className="feature-item"><i className='bx bx-gas-pump'></i> {translateValue(car.fuel, t)}</div>
                <div className="feature-item"><i className='bx bx-git-merge'></i> {translateValue(car.gear, t)}</div>
                <div className="feature-item"><i className='bx bx-user'></i> {numericLabel(car.capacity, t('fleet.person'))}</div>
                <div className="feature-item"><i className='bx bx-door-open'></i> {numericLabel(car.doors, t('fleet.door'))}</div>
                <div className="feature-item"><i className='bx bx-wind'></i> A/C</div>
                {car.driveType && <div className="feature-item"><i className='bx bx-transfer-alt'></i> {t(`fleet.driveMap.${car.driveType}`, car.driveType)}</div>}
              </div>

              <div className="conditions-section">
                <h4>{t('fleet.conditions')}</h4>
                <ul>
                  <li><i className='bx bx-id-card'></i> {t('fleet.minAge')}: {car.age} - {t('fleet.license')}: {yearLabel(car.license, language, t)}</li>
                </ul>
              </div>
            </div>

            <div className="car-actions">
              <button className="btn-features" onClick={() => openFeatures(car)} type="button">{t('fleet.features')}</button>
              <button className="btn-rent" disabled={!car.canBook} onClick={() => openModal(car)} type="button">
                {car.canBook ? t('fleet.rentNow') : t('fleet.priceUnavailable')}
              </button>
            </div>
          </div>
        ))}
      </div>

      {featureCar && (
        <div className="rent-modal-overlay" onClick={closeFeatures}>
          <div className="feature-modal-content" onClick={(event) => event.stopPropagation()}>
            <button aria-label={t('common.close')} className="close-modal" onClick={closeFeatures} type="button">
              <i className='bx bx-x'></i>
            </button>
            <div className="feature-modal-heading">
              <div className="feature-modal-image-frame">
                <img src={featureCar.image} alt={featureCar.name} onLoad={fitVehicleImage} />
              </div>
              <div>
                <h3>{featureCar.name.replace(' ve benzeri..', '')}</h3>
              </div>
            </div>
            <div className="feature-modal-summary">
              <div><i className='bx bx-gas-pump'></i><span>{t('fleet.fuel')}<strong>{translateValue(featureCar.fuel, t)}</strong></span></div>
              <div><i className='bx bx-git-merge'></i><span>{t('fleet.gear')}<strong>{translateValue(featureCar.gear, t)}</strong></span></div>
              <div><i className='bx bx-user'></i><span>{t('fleet.capacity')}<strong>{numericLabel(featureCar.capacity, t('fleet.person'))}</strong></span></div>
              {featureCar.driveType && <div><i className='bx bx-transfer-alt'></i><span>{t('fleet.drive')}<strong>{t(`fleet.driveMap.${featureCar.driveType}`, featureCar.driveType)}</strong></span></div>}
            </div>
            <h4 className="feature-list-title">{t('fleet.equipment')}</h4>
            <div className="feature-detail-list">
              {(featureCar.features || []).map((feature, index) => (
                <div className="feature-detail-item" key={`${feature.label}-${index}`}>
                  <i className='bx bx-check'></i>
                  <span>{translateFeature(feature.label, t)}</span>
                  <strong>{translateValue(feature.value, t)}</strong>
                </div>
              ))}
              {!featureCar.features?.length && (
                <div className="feature-detail-item">{t('fleet.noFeatures')}</div>
              )}
            </div>
            <button className="feature-rent-button" disabled={!featureCar.canBook} onClick={() => { closeFeatures(); openModal(featureCar); }} type="button">
              {featureCar.canBook ? t('fleet.rentThis') : t('fleet.priceUnavailable')}
            </button>
          </div>
        </div>
      )}

      {/* Hemen Kirala Modal */}
      {selectedCar && (
        <div className="rent-modal-overlay" onClick={closeModal}>
          <div className="rent-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={closeModal}><i className='bx bx-x'></i></button>
            
            <h3 className="modal-title">{t('fleet.rentNow')}</h3>
            
            <div className="modal-car-info">
              <div className="modal-car-image-frame">
                <img src={selectedCar.image} alt={selectedCar.name} className="modal-car-image" onLoad={fitVehicleImage} />
              </div>
              <div className="modal-car-details">
                <h4>{selectedCar.name.replace(' ve benzeri..', '')}</h4>
                <p className="daily-price">{t('fleet.dailyPrice')}: <strong>{formatMoney(selectedCar.dailyPriceAmount, currency, language) || t('fleet.priceUnavailable')}</strong></p>
                <div className="mini-features">
                  <span><i className='bx bx-gas-pump'></i> {translateValue(selectedCar.fuel, t)}</span>
                  <span><i className='bx bx-git-merge'></i> {translateValue(selectedCar.gear, t)}</span>
                </div>
              </div>
            </div>

            <form className="rent-modal-form" onSubmit={handleRentalSubmit}>
              <div className="modal-form-group">
                <label>{t('fleet.fullName')}</label>
                <input name="fullName" type="text" placeholder={t('fleet.fullNamePlaceholder')} required />
              </div>
              <div className="modal-form-group">
                <label>{t('fleet.email')}</label>
                <input name="email" type="email" placeholder={t('fleet.emailPlaceholder')} required />
              </div>
              <div className="modal-form-group">
                <label>{t('fleet.phone')}</label>
                <input name="phone" type="tel" placeholder="05XX XXX XX XX" required />
              </div>
              <label className="rent-privacy-consent">
                <input name="privacyNoticeAccepted" required type="checkbox" />
                <span>
                  {t('privacy.noticePrefix')}
                  <a href="/kvkk-aydinlatma-metni" rel="noreferrer" target="_blank">{t('privacy.noticeLink')}</a>
                  {t('privacy.noticeSuffix')}
                </span>
              </label>
              <button type="submit" className="modal-submit-btn" disabled={isSubmitting}>
                {isSubmitting ? t('fleet.redirecting') : t('fleet.continuePayment')}
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};

function numericLabel(value, label) {
  const number = String(value ?? '').match(/\d+/)?.[0];
  return number ? `${number} ${label}` : value;
}

function yearLabel(value, language, t) {
  const number = String(value ?? '').match(/\d+/)?.[0];
  if (!number) return value;
  const unit = Number(number) === 1 && language !== 'tr' ? t('fleet.year') : t('fleet.years');
  return `${number} ${unit}`;
}

function translateValue(value, t) {
  return t(`fleet.valueMap.${value}`, value);
}

function translateFeature(value, t) {
  const known = ['Klima', 'Yol bilgisayarı', 'Bluetooth', 'ABS ve hava yastıkları'];
  const index = known.indexOf(value);
  return index === -1 ? value : t('fleet.defaults')[index];
}

function availabilityLabel(count, filtered, t) {
  const template = t(filtered ? 'fleet.availableForDates' : 'fleet.available');
  return template.replace('{count}', String(count ?? 0));
}

function formatMoney(amount, currency, language) {
  if (amount === null || amount === undefined || Number.isNaN(Number(amount))) {
    return null;
  }

  const locale = language === 'ar' ? 'ar' : language === 'en' ? 'en-US' : 'tr-TR';
  return new Intl.NumberFormat(locale, {
    currency,
    maximumFractionDigits: currency === 'TRY' ? 0 : 2,
    minimumFractionDigits: currency === 'TRY' ? 0 : 2,
    style: 'currency',
  }).format(Number(amount));
}

export default CarFleet;
