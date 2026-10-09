import React, { useEffect, useRef, useState } from 'react';
import { useI18n } from '../../i18n/I18nContext';
import './AuthModal.css';

const initialLogin = { email: '', password: '' };
const initialRegister = {
  commercialConsent: false,
  email: '',
  privacyNoticeAccepted: false,
  name: '',
  password: '',
  passwordConfirm: '',
};

const AuthModal = ({ initialMode = 'login', afterLoginTab = 'overview', onClose }) => {
  const loginDestination = afterLoginTab === 'rentals' ? '/?account=rentals' : '/?account=overview';
  const { t } = useI18n();
  const [mode, setMode] = useState(initialMode);
  const [loginForm, setLoginForm] = useState(initialLogin);
  const [registerForm, setRegisterForm] = useState(initialRegister);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dialogRef = useRef(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const changeMode = (nextMode) => {
    setMode(nextMode);
    setError('');
  };

  const handleLoginChange = (event) => {
    setLoginForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleRegisterChange = (event) => {
    const { checked, name, type, value } = event.target;
    setRegisterForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const signIn = async (email, password) => {
    const csrfResponse = await fetch('/api/auth/csrf', {
      credentials: 'same-origin',
      headers: { Accept: 'application/json' },
    });

    if (!csrfResponse.ok) throw new Error(t('auth.serviceUnavailable'));
    const { csrfToken } = await csrfResponse.json();
    const response = await fetch('/api/auth/callback/credentials', {
      body: new URLSearchParams({
        callbackUrl: loginDestination,
        csrfToken,
        email,
        json: 'true',
        password,
      }),
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      method: 'POST',
    });
    const result = await response.json().catch(() => null);

    if (!response.ok || !result?.url || result.url.includes('error=')) {
      throw new Error(t('auth.invalidCredentials'));
    }

    window.location.assign(loginDestination);
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await signIn(loginForm.email.trim().toLowerCase(), loginForm.password);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : t('auth.loginFailed'));
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    setError('');

    if (registerForm.password !== registerForm.passwordConfirm) {
      setError(t('auth.mismatch'));
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/public/register', {
        body: JSON.stringify({
          commercialConsent: registerForm.commercialConsent,
          email: registerForm.email.trim().toLowerCase(),
          privacyNoticeAccepted: registerForm.privacyNoticeAccepted,
          name: registerForm.name.trim(),
          password: registerForm.password,
        }),
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(response.status === 409 ? result?.error : t('auth.registerFailed'));
      }

      await signIn(registerForm.email.trim().toLowerCase(), registerForm.password);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : t('auth.registerFailed'));
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-modal-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section
        aria-labelledby="auth-modal-title"
        aria-modal="true"
        className="auth-modal"
        ref={dialogRef}
        role="dialog"
        tabIndex="-1"
      >
        <button aria-label={t('auth.close')} className="auth-modal-close" onClick={onClose} type="button">
          <i className="bx bx-x" />
        </button>

        <div className="auth-modal-brand">
          <img src="/logo.png" alt="KAPTAŞ Car Rental" />
        </div>

        <div className="auth-modal-tabs" role="tablist">
          <button
            aria-selected={mode === 'login'}
            className={mode === 'login' ? 'active' : ''}
            onClick={() => changeMode('login')}
            role="tab"
            type="button"
          >
            {t('common.login')}
          </button>
          <button
            aria-selected={mode === 'register'}
            className={mode === 'register' ? 'active' : ''}
            onClick={() => changeMode('register')}
            role="tab"
            type="button"
          >
            {t('common.register')}
          </button>
        </div>

        <header className="auth-modal-heading">
          <h2 id="auth-modal-title">{mode === 'login' ? t('auth.welcome') : t('auth.create')}</h2>
          <p>
            {mode === 'login'
              ? t('auth.loginIntro')
              : t('auth.registerIntro')}
          </p>
        </header>

        {error ? <div className="auth-modal-error" role="alert">{error}</div> : null}

        {mode === 'login' ? (
          <form className="auth-modal-form" onSubmit={handleLogin}>
            <label>
              <span>{t('auth.email')}</span>
              <input
                autoComplete="email"
                name="email"
                onChange={handleLoginChange}
                placeholder="ornek@email.com"
                required
                type="email"
                value={loginForm.email}
              />
            </label>
            <label>
              <span>{t('auth.password')}</span>
              <input
                autoComplete="current-password"
                minLength="8"
                name="password"
                onChange={handleLoginChange}
                placeholder={t('auth.passwordPlaceholder')}
                required
                type="password"
                value={loginForm.password}
              />
            </label>
            <a className="auth-forgot-link" href="/forgot-password">{t('auth.forgot')}</a>
            <button className="auth-submit-button" disabled={isSubmitting} type="submit">
              {isSubmitting ? t('auth.loggingIn') : t('common.login')}
            </button>
          </form>
        ) : (
          <form className="auth-modal-form" onSubmit={handleRegister}>
            <label>
              <span>{t('auth.fullName')}</span>
              <input
                autoComplete="name"
                minLength="2"
                name="name"
                onChange={handleRegisterChange}
                placeholder={t('auth.fullNamePlaceholder')}
                required
                value={registerForm.name}
              />
            </label>
            <label>
              <span>{t('auth.email')}</span>
              <input
                autoComplete="email"
                name="email"
                onChange={handleRegisterChange}
                placeholder="ornek@email.com"
                required
                type="email"
                value={registerForm.email}
              />
            </label>
            <div className="auth-password-grid">
              <label>
                <span>{t('auth.password')}</span>
                <input
                  autoComplete="new-password"
                  minLength="10"
                  name="password"
                  onChange={handleRegisterChange}
                  pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{10,128}"
                  placeholder={t('auth.newPasswordPlaceholder')}
                  required
                  title={t('auth.passwordRule')}
                  type="password"
                  value={registerForm.password}
                />
              </label>
              <label>
                <span>{t('auth.passwordAgain')}</span>
                <input
                  autoComplete="new-password"
                  minLength="10"
                  name="passwordConfirm"
                  onChange={handleRegisterChange}
                  pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{10,128}"
                  placeholder={t('auth.repeatPasswordPlaceholder')}
                  required
                  title={t('auth.passwordRule')}
                  type="password"
                  value={registerForm.passwordConfirm}
                />
              </label>
            </div>
            <label className="auth-consent">
              <input
                checked={registerForm.privacyNoticeAccepted}
                name="privacyNoticeAccepted"
                onChange={handleRegisterChange}
                required
                type="checkbox"
              />
              <span>
                {t('privacy.noticePrefix')}
                <a href="/kvkk-aydinlatma-metni" rel="noreferrer" target="_blank">{t('privacy.noticeLink')}</a>
                {t('privacy.noticeSuffix')}
              </span>
            </label>
            <label className="auth-consent">
              <input
                checked={registerForm.commercialConsent}
                name="commercialConsent"
                onChange={handleRegisterChange}
                type="checkbox"
              />
              <span>{t('auth.commercial')}</span>
            </label>
            <button className="auth-submit-button" disabled={isSubmitting} type="submit">
              {isSubmitting ? t('auth.creating') : t('common.register')}
            </button>
          </form>
        )}

        <p className="auth-modal-switch">
          {mode === 'login' ? t('auth.noAccount') : t('auth.alreadyAccount')}{' '}
          <button onClick={() => changeMode(mode === 'login' ? 'register' : 'login')} type="button">
            {mode === 'login' ? t('auth.registerAction') : t('auth.loginAction')}
          </button>
        </p>
      </section>
    </div>
  );
};

export default AuthModal;
