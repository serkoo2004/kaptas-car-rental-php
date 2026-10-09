import React, { useState, useEffect } from 'react';
import './HeroSlider.css';

const slides = [
  {
    id: 1,
    image: 'https://www.windycar.com.tr/dosya/800/manset/104-1-hopililer-windycarda-tum-arac-gruplarinda-20-indirim-ve-15-paracik’la-kazaniyor_645.webp',
    alt: 'Hopililer WindyCar\'da Tüm Araç Gruplarında %20 İndirim',
    link: 'https://www.windycar.com.tr/haberler/hopililer-windycarda-20-indirim'
  },
  {
    id: 2,
    image: 'https://www.windycar.com.tr/dosya/800/manset/101-1-turk-hava-yollari-milessmiles_571.webp',
    alt: 'Türk Hava Yolları Miles&Smiles',
    link: 'https://www.windycar.com.tr/haberler/windycar-milesandsmiles'
  },
  {
    id: 3,
    image: 'https://www.windycar.com.tr/dosya/800/manset/106-1-kuveyt-turk-musterilerine-ozel-windycarda-30-indirim-firsati-_539.webp',
    alt: 'Kuveyt Türk Müşterilerine Özel %30 İndirim Fırsatı!',
    link: 'https://www.windycar.com.tr/haberler/kuveyt-turk-musterilerine-ozel'
  }
];

const HeroSlider = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const stopExternalRedirect = (event) => {
    event.preventDefault();
  };

  return (
    <div className="hero-slider">
      <div 
        className="slides-container" 
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {slides.map((slide) => (
          <div key={slide.id} className="slide">
            <a href="#kampanya" onClick={stopExternalRedirect}>
              <img src={slide.image} alt={slide.alt} />
            </a>
          </div>
        ))}
      </div>

      <div className="slider-indicators-rect">
        {slides.map((_, index) => (
          <button
            key={index}
            className={`rect-indicator ${index === currentSlide ? 'active' : ''}`}
            onClick={() => setCurrentSlide(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroSlider;
