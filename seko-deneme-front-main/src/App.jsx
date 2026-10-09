import React, { useState, useEffect } from 'react'
import Header from './components/Header/Header'
import SearchPanel from './components/SearchPanel/SearchPanel'
import CarFleet from './components/CarFleet/CarFleet'
import AboutUs from './components/AboutUs/AboutUs'
import RentalConditions from './components/RentalConditions/RentalConditions'
import Contact from './components/Contact/Contact'
import FloatingContact from './components/FloatingContact/FloatingContact'
import Footer from './components/Footer/Footer'
import LegalPage from './components/LegalPage/LegalPage'
import './App.css'

function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const onLocationChange = () => setCurrentPath(window.location.pathname);
    window.addEventListener('popstate', onLocationChange);
    return () => window.removeEventListener('popstate', onLocationChange);
  }, []);

  const renderContent = () => {
    if (currentPath === '/' || currentPath === '/index.html') {
      return (
        <>
          <div className="search-section">
            <SearchPanel />
          </div>
          <CarFleet />
        </>
      );
    }

    if (currentPath === '/arac-filosu') {
      return (
        <>
          <div className="search-section sub-page-search">
            <SearchPanel />
          </div>
          <CarFleet />
        </>
      );
    }

    if (currentPath === '/hakkimizda') {
      return (
        <>
          <div className="search-section sub-page-search">
            <SearchPanel />
          </div>
          <AboutUs />
        </>
      );
    }

    if (currentPath === '/kiralama-kosullari') {
      return (
        <>
          <div className="search-section sub-page-search">
            <SearchPanel />
          </div>
          <RentalConditions />
        </>
      );
    }

    if (currentPath === '/iletisim') {
      return (
        <>
          <div className="search-section sub-page-search">
            <SearchPanel />
          </div>
          <Contact />
        </>
      );
    }

    const legalPaths = [
      '/kvkk-aydinlatma-metni',
      '/gizlilik-politikasi',
      '/cerez-politikasi',
      '/teslimat-ve-iade-sartlari',
      '/on-bilgilendirme-formu',
      '/mesafeli-satis-sozlesmesi',
      '/kvkk-basvuru',
    ];

    if (legalPaths.includes(currentPath)) {
      return <LegalPage path={currentPath} />;
    }

    window.location.replace('/');
    return null;
  };

  return (
    <div className="app-container">
      <Header />
      <main className="main-content">
        {renderContent()}
      </main>
      <FloatingContact />
      <Footer />
    </div>
  )
}

export default App
