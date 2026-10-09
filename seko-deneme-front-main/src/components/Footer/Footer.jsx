import React from 'react';
import { useI18n } from '../../i18n/I18nContext';
import './Footer.css';

const Footer = () => {
  const { t } = useI18n();
  return (
    <footer className="footer">
      <div className="container footer-content">
        <div className="footer-brand">
          <a href="/" className="footer-logo"><img src="/logo.png" alt="KAPTAŞ Car Rental" /></a>
          <p>{t('footer.description')}</p>
          <p className="footer-company-name">Kaptaş Madencilik İnşaat Taşımacılık Gıda Ve İletişim Sanayi Limited Şirketi</p>
        </div>
        
        <div className="footer-links">
          <h4>{t('footer.pages')}</h4>
          <ul>
            <li><a href="/">{t('common.home')}</a></li>
            <li><a href="/arac-filosu">{t('common.fleet')}</a></li>
            <li><a href="/hakkimizda">{t('common.about')}</a></li>
            <li><a href="/iletisim">{t('common.contact')}</a></li>
            <li><a href="/kiralama-kosullari">{t('common.conditions')}</a></li>
          </ul>
        </div>

        <div className="footer-links footer-legal">
          <h4>{t('privacy.legalHeading')}</h4>
          <ul>
            <li><a href="/kvkk-aydinlatma-metni">{t('privacy.links.kvkk-aydinlatma-metni')}</a></li>
            <li><a href="/gizlilik-politikasi">{t('privacy.links.gizlilik-politikasi')}</a></li>
            <li><a href="/cerez-politikasi">{t('privacy.links.cerez-politikasi')}</a></li>
            <li><a href="/teslimat-ve-iade-sartlari">{t('privacy.links.teslimat-ve-iade-sartlari')}</a></li>
            <li><a href="/on-bilgilendirme-formu">{t('privacy.links.on-bilgilendirme-formu')}</a></li>
            <li><a href="/mesafeli-satis-sozlesmesi">{t('privacy.links.mesafeli-satis-sozlesmesi')}</a></li>
            <li><a href="/kvkk-basvuru">{t('privacy.links.kvkk-basvuru')}</a></li>
          </ul>
        </div>
        
        <div className="footer-contact">
          <h4>{t('footer.contact')}</h4>
          <ul>
            <li>
              <i className='bx bx-phone'></i>
              <a dir="ltr" href="tel:+905550456261">0 (555) 045 62 61</a>
            </li>
            <li>
              <i className='bx bx-envelope'></i>
              <a href="mailto:kaptascarrental@gmail.com">kaptascarrental@gmail.com</a>
            </li>
            <li className="footer-address">
              <i className='bx bx-map'></i>
              <address>Pelitli Mah. Şehit Murat Yıldız Sok. No:8/AB Ortahisar/Trabzon</address>
            </li>
          </ul>
        </div>
      </div>
      <div className="container footer-payment-wrap">
        <div className="footer-payment">
          <div className="footer-payment-copy">
            <strong>{t('footer.securePayment')}</strong>
            <span>{t('footer.paymentNote')}</span>
          </div>
          <div className="footer-payment-logos" aria-label={t('footer.securePayment')}>
            <img className="payment-logo visa-logo" src="/images/payments/visa.svg" alt="Visa" />
            <img className="payment-logo mastercard-logo" src="/images/payments/mastercard.svg" alt="Mastercard" />
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <div className="container">
          <p>&copy; {new Date().getFullYear()} KAPTAŞ Car Rental. {t('footer.rights')}</p>
          <p className="footer-privacy-note">{t('privacy.footerNote')}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
