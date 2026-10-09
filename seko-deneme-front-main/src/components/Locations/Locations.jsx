import React, { useEffect, useMemo, useState } from 'react';
import './Locations.css';

const fallbackLocations = [
  {
    id: 'fallback-merkez',
    name: 'Merkez Ofis',
    image: '/images/fleet-hero.png',
    rating: '5,0',
    subtitle: 'Rezervasyon ve teslim koordinasyon merkezi',
    address: 'Merkez lokasyon, teslim ve iade operasyon noktası',
    phone: '0',
    email: 'info@arackiralama.local',
    type: 'city'
  }
];

const renderStars = (rating) => {
  const stars = [];
  const ratingNum = parseFloat(String(rating || '5,0').replace(',', '.'));
  for (let i = 1; i <= 5; i++) {
    if (i <= ratingNum) {
      stars.push(<i key={i} className='bx bxs-star'></i>);
    } else if (i - 0.5 <= ratingNum) {
      stars.push(<i key={i} className='bx bxs-star-half'></i>);
    } else {
      stars.push(<i key={i} className='bx bx-star'></i>);
    }
  }
  return stars;
};

const Locations = () => {
  const [locations, setLocations] = useState(fallbackLocations);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let isMounted = true;

    fetch('/api/public/locations', { headers: { Accept: 'application/json' } })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (!isMounted || !payload?.locations?.length) {
          return;
        }

        setLocations(payload.locations);
      })
      .catch(() => {
        if (isMounted) {
          setLocations(fallbackLocations);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const visibleLocations = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase('tr-TR');

    if (!keyword) {
      return locations;
    }

    return locations.filter((loc) =>
      [loc.name, loc.subtitle, loc.address]
        .filter(Boolean)
        .some((value) => value.toLocaleLowerCase('tr-TR').includes(keyword))
    );
  }, [locations, search]);

  const stopExternalRedirect = (event) => {
    event.preventDefault();
  };

  return (
    <section className="locations-page-wrapper container">
      <div className="breadcrumb">
        <ul>
          <li><a href="/">Anasayfa</a><span>/</span></li>
          <li className="active">Şubelerimiz</li>
        </ul>
      </div>

      <header className="locations-page-header">
        <h1>Şubelerimiz</h1>
      </header>

      <div className="locations-search-area">
        <span className="count">Toplam <b>{visibleLocations.length}</b> şubemiz bulunmaktadır.</span>
        <input
          type="text"
          placeholder="Şube Ara"
          className="branch-search-input"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      <div className="locations-grid">
        {visibleLocations.map((loc) => (
          <div key={loc.id} className="location-card">
            <div className="location-image">
              <img src={loc.image} alt={loc.name} />
              <div className="location-type-badge">
                <i className={loc.type === 'airport' ? 'bx bxs-plane-alt' : 'bx bxs-city'}></i>
              </div>
            </div>
            
            <div className="location-content">
              <div className="location-title-row">
                <h3>{loc.name}</h3>
                <div className="location-rating">
                  <span className="rating-score">{loc.rating || '5,0'}</span>
                  <div className="rating-stars">
                    {renderStars(loc.rating)}
                  </div>
                </div>
              </div>
              
              <span className="location-subtitle">{loc.subtitle}</span>
              
              <ul className="location-contact">
                <li>
                  <i className='bx bx-map'></i>
                  <span>{loc.address}</span>
                </li>
                <li>
                  <i className='bx bx-phone-call'></i>
                  <a href="#telefon" onClick={stopExternalRedirect}>{loc.phone}</a>
                </li>
                <li>
                  <i className='bx bx-envelope'></i>
                  <a href="#mail" onClick={stopExternalRedirect}>{loc.email}</a>
                </li>
              </ul>
              
              <a href="#" className="location-detail-link">Lokasyon Detayı <i className='bx bx-right-arrow-alt'></i></a>
            </div>
          </div>
        ))}
      </div>

      {visibleLocations.length === 0 && (
        <div className="locations-empty-state">
          Aradığınız kriterlere uygun şube bulunamadı.
        </div>
      )}
    </section>
  );
};

export default Locations;
