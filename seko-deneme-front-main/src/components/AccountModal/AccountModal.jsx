import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useI18n } from '../../i18n/I18nContext';
import { translateLocationName } from '../../i18n/locationNames';
import './AccountModal.css';

const emptyProfile = { address: '', city: '', district: '', email: '', name: '', phone: '' };
const emptyVerification = { challengeId: '', code: '', isSending: false, isVerifying: false, maskedTarget: '' };

const csrfHeaders = async () => {
  const response = await fetch('/api/auth/csrf', { credentials: 'same-origin' });
  if (!response.ok) throw new Error('Güvenlik doğrulaması başlatılamadı.');
  const result = await response.json();
  return { 'Content-Type': 'application/json', 'X-CSRF-Token': result.csrfToken };
};

const AccountModal = ({ initialTab = 'profile', onClose, onSignOut }) => {
  const { language, t } = useI18n();
  const [activeTab, setActiveTab] = useState(initialTab === 'rentals' ? 'rentals' : 'profile');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState(emptyProfile);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [verifications, setVerifications] = useState({ EMAIL: emptyVerification });
  const dialogRef = useRef(null);

  const loadAccount = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/account', {
        credentials: 'same-origin',
        headers: { Accept: 'application/json' },
      });
      const result = await response.json().catch(() => null);

      if (!response.ok) throw new Error(result?.error || t('account.loadFailed'));

      setData(result);
      setForm({
        address: result.user.address || '',
        city: result.user.city || '',
        district: result.user.district || '',
        email: result.user.email || '',
        name: result.user.name || '',
        phone: result.user.phone || '',
      });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : t('account.loadFailed'));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.body.classList.add('account-modal-open');
    dialogRef.current?.focus();
    loadAccount();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.classList.remove('account-modal-open');
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [loadAccount, onClose]);

  const saveProfile = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setIsSaving(true);

    try {
      const headers = await csrfHeaders();
      const response = await fetch('/api/account', {
        body: JSON.stringify({ address: form.address, city: form.city, district: form.district, name: form.name, phone: form.phone }),
        credentials: 'same-origin',
        headers,
        method: 'PATCH',
      });
      const result = await response.json().catch(() => null);

      if (!response.ok) throw new Error(result?.error || t('account.saveFailed'));

      setData((current) => ({ ...current, user: result.user }));
      setMessage(t('account.saved'));
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : t('account.saveFailed'));
    } finally {
      setIsSaving(false);
    }
  };

  const requestVerification = async (channel) => {
    const target = form.email;
    setError('');
    setMessage('');
    setVerifications((current) => ({
      ...current,
      [channel]: { ...current[channel], isSending: true },
    }));

    try {
      const headers = await csrfHeaders();
      const response = await fetch('/api/account/verifications/request', {
        body: JSON.stringify({ channel, target }),
        credentials: 'same-origin',
        headers,
        method: 'POST',
      });
      const result = await response.json().catch(() => null);

      if (!response.ok) throw new Error(result?.error || t('account.codeSendFailed'));

      setVerifications((current) => ({
        ...current,
        [channel]: {
          ...emptyVerification,
          challengeId: result.challengeId,
          maskedTarget: result.maskedTarget,
        },
      }));
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : t('account.codeSendFailed'));
    } finally {
      setVerifications((current) => ({
        ...current,
        [channel]: { ...current[channel], isSending: false },
      }));
    }
  };

  const confirmVerification = async (channel) => {
    const verification = verifications[channel];
    setError('');
    setMessage('');
    setVerifications((current) => ({
      ...current,
      [channel]: { ...current[channel], isVerifying: true },
    }));

    try {
      const headers = await csrfHeaders();
      const response = await fetch('/api/account/verifications/confirm', {
        body: JSON.stringify({ challengeId: verification.challengeId, code: verification.code }),
        credentials: 'same-origin',
        headers,
        method: 'POST',
      });
      const result = await response.json().catch(() => null);

      if (!response.ok) throw new Error(result?.error || t('account.codeVerifyFailed'));

      const verifiedValue = result.user.email;
      const field = 'email';
      setData((current) => ({ ...current, user: { ...current.user, ...result.user } }));
      setForm((current) => ({ ...current, [field]: verifiedValue || '' }));
      setVerifications((current) => ({ ...current, [channel]: emptyVerification }));
      setMessage(t('account.emailVerified'));
    } catch (verifyError) {
      setError(verifyError instanceof Error ? verifyError.message : t('account.codeVerifyFailed'));
    } finally {
      setVerifications((current) => ({
        ...current,
        [channel]: { ...current[channel], isVerifying: false },
      }));
    }
  };

  const verificationPanel = (channel) => {
    const verification = verifications[channel];
    if (!verification.challengeId) return null;

    return (
      <div className="account-verification-panel">
        <p><i className="bx bx-check-shield" /> {t('account.codeSent')} <strong>{verification.maskedTarget}</strong></p>
        <div className="account-verification-row">
          <input
            aria-label={t('account.verificationCode')}
            autoComplete="one-time-code"
            inputMode="numeric"
            maxLength="6"
            onChange={(event) => {
              const code = event.target.value.replace(/\D/g, '').slice(0, 6);
              setVerifications((current) => ({
                ...current,
                [channel]: { ...current[channel], code },
              }));
            }}
            placeholder={t('account.verificationCode')}
            value={verification.code}
          />
          <button
            disabled={verification.code.length !== 6 || verification.isVerifying}
            onClick={() => confirmVerification(channel)}
            type="button"
          >
            {verification.isVerifying ? t('account.verifying') : t('account.verifyCode')}
          </button>
        </div>
        <button className="account-resend-code" disabled={verification.isSending} onClick={() => requestVerification(channel)} type="button">
          {verification.isSending ? t('account.sendingCode') : t('account.resendCode')}
        </button>
      </div>
    );
  };

  const locale = language === 'ar' ? 'ar-SA' : language === 'en' ? 'en-GB' : 'tr-TR';
  const dateTime = (value) => new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Europe/Istanbul',
  }).format(new Date(value));
  const money = (amount, currency) => new Intl.NumberFormat(locale, {
    currency: currency || 'TRY',
    style: 'currency',
  }).format(amount || 0);

  return (
    <div className="account-modal-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section
        aria-labelledby="account-modal-title"
        aria-modal="true"
        className="account-modal"
        ref={dialogRef}
        role="dialog"
        tabIndex="-1"
      >
        <div className="account-modal-header">
          <div className="account-modal-brand">
            <img src="/logo.png" alt="KAPTAŞ Car Rental" />
          </div>
          <h2 className="account-modal-accessible-title" id="account-modal-title">{t('account.title')}</h2>
          <button aria-label={t('common.close')} className="account-modal-close" onClick={onClose} type="button">
            <i className="bx bx-x" />
          </button>
        </div>

        <div className="account-modal-tabs" role="tablist">
          <button
            aria-selected={activeTab === 'profile'}
            className={activeTab === 'profile' ? 'active' : ''}
            onClick={() => setActiveTab('profile')}
            role="tab"
            type="button"
          >
            <i className="bx bx-id-card" /> {t('account.profile')}
          </button>
          <button
            aria-selected={activeTab === 'rentals'}
            className={activeTab === 'rentals' ? 'active' : ''}
            onClick={() => setActiveTab('rentals')}
            role="tab"
            type="button"
          >
            <i className="bx bx-calendar-check" /> {t('account.rentals')}
            {data?.rentals?.length ? <span>{data.rentals.length}</span> : null}
          </button>
        </div>

        <div className="account-modal-body">
          {isLoading ? (
            <div className="account-state"><i className="bx bx-loader-alt bx-spin" /> {t('common.loading')}</div>
          ) : error && !data ? (
            <div className="account-state account-state-error">
              <i className="bx bx-error-circle" />
              <p>{error}</p>
              <button onClick={loadAccount} type="button">{t('account.retry')}</button>
            </div>
          ) : activeTab === 'profile' ? (
            <form className="account-profile-form" onSubmit={saveProfile}>
              <div className="account-profile-intro">
                <h3>{t('account.profileTitle')}</h3>
                <p>{t('account.profileIntro')}</p>
              </div>
              {error ? <div className="account-alert error" role="alert">{error}</div> : null}
              {message ? <div className="account-alert success" role="status">{message}</div> : null}
              <label>
                <span>{t('account.fullName')}</span>
                <input
                  autoComplete="name"
                  minLength="2"
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  required
                  value={form.name}
                />
              </label>
              <label>
                <span className="account-contact-label">
                  {t('account.email')}
                  <VerificationBadge verified={Boolean(data.user.emailVerified)} t={t} />
                </span>
                <div className="account-contact-row">
                  <input
                    autoComplete="email"
                    onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                    type="email"
                    value={form.email}
                  />
                  <button
                    className="account-send-code-button"
                    disabled={
                      !form.email.trim() ||
                      !data.verificationServices?.email ||
                      (form.email.trim().toLowerCase() === data.user.email.toLowerCase() && data.user.emailVerified) ||
                      verifications.EMAIL.isSending
                    }
                    onClick={() => requestVerification('EMAIL')}
                    type="button"
                  >
                    <i className={verifications.EMAIL.isSending ? 'bx bx-loader-alt bx-spin' : 'bx bx-envelope'} />
                    {verifications.EMAIL.isSending ? t('account.sendingCode') : t('account.sendCode')}
                  </button>
                </div>
                <small>{data.verificationServices?.email ? t('account.emailHint') : t('account.emailServiceUnavailable')}</small>
                {verificationPanel('EMAIL')}
              </label>
              <label>
                <span>{t('account.phone')}</span>
                <input
                  autoComplete="tel"
                  inputMode="tel"
                  maxLength="20"
                  onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                  placeholder="05xx xxx xx xx"
                  type="tel"
                  value={form.phone}
                />
                <small>{t('account.phoneHint')}</small>
              </label>
              <div className="account-address-grid">
                <label>
                  <span>{t('account.city')}</span>
                  <input autoComplete="address-level1" maxLength="100" onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))} value={form.city} />
                </label>
                <label>
                  <span>{t('account.district')}</span>
                  <input autoComplete="address-level2" maxLength="100" onChange={(event) => setForm((current) => ({ ...current, district: event.target.value }))} value={form.district} />
                </label>
              </div>
              <label>
                <span>{t('account.address')}</span>
                <input autoComplete="street-address" maxLength="500" onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))} value={form.address} />
              </label>
              <div className="account-profile-actions">
                <button className="account-save-button" disabled={isSaving} type="submit">
                  <i className={isSaving ? 'bx bx-loader-alt bx-spin' : 'bx bx-save'} />
                  {isSaving ? t('account.saving') : t('account.save')}
                </button>
              </div>
            </form>
          ) : data?.rentals?.length ? (
            <div className="account-rental-list">
              {data.rentals.map((rental) => (
                <details className="account-rental" key={rental.id}>
                  <summary>
                    {rental.vehicle.coverImage ? (
                      <img alt={rental.vehicle.title} src={rental.vehicle.coverImage} />
                    ) : (
                      <span className="account-rental-placeholder"><i className="bx bx-car" /></span>
                    )}
                    <span className="account-rental-summary">
                      <strong>{rental.vehicle.title}</strong>
                      <small>{dateTime(rental.pickupAt)} · {translateLocationName(rental.pickupLocation, t) || t('account.location')}</small>
                    </span>
                    <span className={`account-rental-status status-${rental.status.toLowerCase()}`}>
                      {t(`account.status.${rental.status}`, rental.status)}
                    </span>
                    <i className="bx bx-chevron-down account-rental-chevron" />
                  </summary>
                  <div className="account-rental-details">
                    <div><span>{t('account.reservationNo')}</span><strong style={{ overflowWrap: 'anywhere' }}>{rental.reference || rental.id.toUpperCase()}</strong></div>
                    <div><span>{t('account.vehicle')}</span><strong>{rental.vehicle.brand} {rental.vehicle.model}</strong></div>
                    <div><span>{t('account.pickup')}</span><strong>{dateTime(rental.pickupAt)}</strong><small>{translateLocationName(rental.pickupLocation, t) || '-'}</small></div>
                    <div><span>{t('account.dropoff')}</span><strong>{dateTime(rental.dropoffAt)}</strong><small>{translateLocationName(rental.dropoffLocation, t) || '-'}</small></div>
                    <div><span>{t('account.payment')}</span><strong>{rental.payment ? t(`account.paymentStatus.${rental.payment.status}`, rental.payment.status) : t('account.noPayment')}</strong></div>
                    <div><span>{t('account.amount')}</span><strong>{rental.payment ? money(rental.payment.amount, rental.payment.currency) : '-'}</strong></div>
                    {rental.rentalDays ? <div><span>{t('account.rentalDays')}</span><strong>{rental.rentalDays}</strong></div> : null}
                    <div><span>{t('account.createdAt')}</span><strong>{dateTime(rental.createdAt)}</strong></div>
                    {rental.cancellationNote ? <div className="account-rental-note"><span>{t('account.note')}</span><strong>{rental.cancellationNote}</strong></div> : null}
                  </div>
                </details>
              ))}
            </div>
          ) : (
            <div className="account-empty-state">
              <i className="bx bx-calendar-x" />
              <h3>{t('account.noRentals')}</h3>
              <p>{t('account.noRentalsIntro')}</p>
              <a href="/arac-filosu">{t('account.viewFleet')}</a>
            </div>
          )}
        </div>

        <div className="account-modal-footer">
          <button className="account-signout-button" onClick={onSignOut} type="button">
            <i className="bx bx-log-out" /> {t('common.signOut')}
          </button>
          <button className="account-done-button" onClick={onClose} type="button">{t('account.done')}</button>
        </div>
      </section>
    </div>
  );
};

function VerificationBadge({ t, verified }) {
  return (
    <small className={verified ? 'account-verification-badge verified' : 'account-verification-badge pending'}>
      <i className={verified ? 'bx bx-check-shield' : 'bx bx-error-circle'} />
      {verified ? t('account.verified') : t('account.notVerified')}
    </small>
  );
}

export default AccountModal;
