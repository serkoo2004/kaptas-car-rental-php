import React, { useCallback, useEffect, useState } from 'react';
import AuthModal from '../AuthModal/AuthModal';
import AccountModal from '../AccountModal/AccountModal';
import ExchangeRates from '../ExchangeRates/ExchangeRates';
import { useI18n } from '../../i18n/I18nContext';
import './Header.css';

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [authMode, setAuthMode] = useState(null);
  const [afterLoginTab, setAfterLoginTab] = useState('overview');
  const [accountTab, setAccountTab] = useState(null);
  const [session, setSession] = useState(null);
  const { currency, currencies, language, languages, setCurrency, setLanguage, t } = useI18n();

  useEffect(() => {
    fetch('/api/auth/session', {
      credentials: 'same-origin',
      headers: { Accept: 'application/json' },
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        const nextSession = payload?.user ? payload : null;
        setSession(nextSession);

        const params = new URLSearchParams(window.location.search);
        const requestedAccount = params.get('account');

        if (requestedAccount) {
          if (nextSession) {
            setAccountTab(requestedAccount === 'rentals' ? 'rentals' : 'profile');
          } else {
            setAfterLoginTab(requestedAccount === 'rentals' ? 'rentals' : 'overview');
            setAuthMode('login');
          }
          params.delete('account');
          const nextQuery = params.toString();
          window.history.replaceState({}, '', `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ''}${window.location.hash}`);
        }
      })
      .catch(() => setSession(null));
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const openAuth = (mode) => {
    setIsMobileMenuOpen(false);
    setAuthMode(mode);
  };

  const closeAuth = useCallback(() => setAuthMode(null), []);
  const closeAccount = useCallback(() => setAccountTab(null), []);

  const openAccount = (tab = 'profile') => {
    setIsMobileMenuOpen(false);
    setAccountTab(tab);
  };

  const handleSignOut = async () => {
    const csrfResponse = await fetch('/api/auth/csrf', { credentials: 'same-origin' });
    const { csrfToken } = await csrfResponse.json();
    await fetch('/api/auth/signout', {
      body: new URLSearchParams({ callbackUrl: '/', csrfToken, json: 'true' }),
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      method: 'POST',
    });
    window.location.href = '/';
  };

  return (
    <header className="header">
      {/* Top White Bar */}
      <div className="header-top">
        <div className="container header-top-inner">
          <a href="/" className="logo">
            <img src="/logo.png" alt="KAPTAŞ Car Rental" />
          </a>

          <div className="header-utility">
            <ExchangeRates />
            <label className="language-select currency-select" aria-label={t('header.currency')}>
              <i className="bx bx-money" />
              <select value={currency} onChange={(event) => setCurrency(event.target.value)}>
                {currencies.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            <label className="language-select" aria-label={t('header.language')}>
              <i className="bx bx-globe" />
              <select value={language} onChange={(event) => setLanguage(event.target.value)}>
                {languages.map((item) => <option key={item.code} value={item.code}>{item.label}</option>)}
              </select>
            </label>
          </div>

          <div className="mobile-header-actions">
            <label className="language-select currency-select currency-select-mobile" aria-label={t('header.currency')}>
              <i className="bx bx-money" />
              <select value={currency} onChange={(event) => setCurrency(event.target.value)}>
                {currencies.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            <label className="language-select language-select-mobile" aria-label={t('header.language')}>
              <i className="bx bx-globe" />
              <select value={language} onChange={(event) => setLanguage(event.target.value)}>
                {languages.map((item) => <option key={item.code} value={item.code}>{item.shortLabel}</option>)}
              </select>
            </label>
            <button
              aria-label={t(isMobileMenuOpen ? 'header.closeMenu' : 'header.openMenu')}
              className="mobile-menu-btn"
              onClick={toggleMobileMenu}
              type="button"
            >
              <i className={`bx ${isMobileMenuOpen ? 'bx-x' : 'bx-menu'}`}></i>
            </button>
          </div>

          <div className="header-auth-actions">
            {session?.user ? (
              <>
                <button className="auth-link auth-login" onClick={() => openAccount('profile')} type="button">
                  <i className='bx bx-user-circle'></i>
                  {t('common.account')}
                </button>
              </>
            ) : (
              <>
                <button className="auth-link auth-login" onClick={() => openAuth('login')} type="button">
                  <i className='bx bx-log-in'></i>
                  {t('common.login')}
                </button>
                <button className="auth-link auth-register" onClick={() => openAuth('register')} type="button">
                  <i className='bx bx-user-plus'></i>
                  {t('common.register')}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Dark Gray Nav Bar */}
      <div className={`header-main ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="container">
          <nav className="main-nav">
            <ul>
              <li><a href="/">{t('common.home')}</a></li>
              <li><a href="/arac-filosu">{t('common.fleet')}</a></li>
              <li><a href="/hakkimizda">{t('common.about')}</a></li>
              <li><a href="/iletisim">{t('common.contact')}</a></li>
              <li><a href="/kiralama-kosullari">{t('common.conditions')}</a></li>
              {session?.user ? (
                <li className="mobile-auth-link"><button onClick={() => openAccount('profile')} type="button"><i className='bx bx-user-circle'></i> {t('common.account')}</button></li>
              ) : (
                <>
                  <li className="mobile-auth-link"><button onClick={() => openAuth('login')} type="button"><i className='bx bx-log-in'></i> {t('common.login')}</button></li>
                  <li className="mobile-auth-link"><button onClick={() => openAuth('register')} type="button"><i className='bx bx-user-plus'></i> {t('common.register')}</button></li>
                </>
              )}
            </ul>
            <ExchangeRates mobile />
          </nav>
        </div>
      </div>
      {authMode ? <AuthModal initialMode={authMode} afterLoginTab={afterLoginTab} onClose={closeAuth} /> : null}
      {accountTab && session?.user ? (
        <AccountModal initialTab={accountTab} onClose={closeAccount} onSignOut={handleSignOut} />
      ) : null}
    </header>
  );
};

export default Header;
