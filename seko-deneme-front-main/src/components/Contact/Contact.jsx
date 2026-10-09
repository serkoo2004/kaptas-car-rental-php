import React from 'react';
import { useI18n } from '../../i18n/I18nContext';
import './Contact.css'; 

const Contact = () => {
  const { t } = useI18n();
  const handleSubmit = async (event) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const payload = {
      companyName: String(formData.get('companyName') || '').trim(),
      contactEmail: String(formData.get('email') || '').trim(),
      contactName: String(formData.get('contactName') || '').trim(),
      contactPhone: String(formData.get('phone') || '').trim(),
      commercialConsent: formData.get('commercialConsent') === 'on',
      message: String(formData.get('message') || '').trim(),
      privacyNoticeAccepted: formData.get('privacyNoticeAccepted') === 'on',
    };

    try {
      const response = await fetch('/api/public/contact', {
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || t('contact.failed'));
      }

      event.currentTarget.reset();
      alert(t('contact.success'));
    } catch (error) {
      alert(error.message || t('contact.failed'));
    }
  };

  return (
    <>
      <div className="container-fluid breadcrumb">
        <div className="container">
          <ul>
            <li><a href="/" className="lbl" title={t('common.home')}>{t('common.home')}</a></li>
            <li className="active">{t('contact.title')}</li>
          </ul>
        </div>
      </div>

      <section className="contact-page-container">
        <div className="contact-form-card">
          <div className="contact-form-header">
            <h2>{t('contact.formTitle')}</h2>
          </div>
          <div className="contact-form-body">
            <h3 className="contact-form-subtitle">{t('contact.details')}</h3>
            
            <form onSubmit={handleSubmit}>
              <div className="contact-form-group">
                <label>{t('contact.fullName')}</label>
                <input name="contactName" type="text" required />
              </div>
              
              <div className="contact-form-group">
                <label>{t('contact.company')}</label>
                <input name="companyName" type="text" />
              </div>
              
              <div className="contact-form-group">
                <label>{t('contact.email')}</label>
                <input name="email" type="email" required />
              </div>
              
              <div className="contact-form-group">
                <label>{t('contact.phone')}</label>
                <input name="phone" type="text" required />
              </div>
              
              <div className="contact-form-group">
                <label>{t('contact.message')}</label>
                <textarea name="message" rows="4" required />
              </div>

              <label className="contact-consent">
                <input name="privacyNoticeAccepted" required type="checkbox" />
                <span>
                  {t('privacy.noticePrefix')}
                  <a href="/kvkk-aydinlatma-metni" rel="noreferrer" target="_blank">{t('privacy.noticeLink')}</a>
                  {t('privacy.noticeSuffix')}
                </span>
              </label>

              <label className="contact-consent">
                <input name="commercialConsent" type="checkbox" />
                <span>{t('contact.commercial')}</span>
              </label>

              <div className="contact-form-submit">
                <button type="submit">{t('contact.send')}</button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </>
  );
};

export default Contact;
