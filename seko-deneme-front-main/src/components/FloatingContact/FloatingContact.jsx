import React, { useEffect, useState } from 'react';
import { useI18n } from '../../i18n/I18nContext';
import './FloatingContact.css';

const FloatingContact = () => {
  const { t } = useI18n();
  const [isFooterVisible, setIsFooterVisible] = useState(false);
  const whatsappUrl = `https://wa.me/905550456261?text=${encodeURIComponent('Merhaba, araç kiralama hakkında bilgi almak istiyorum.')}`;

  useEffect(() => {
    const footer = document.querySelector('.footer');
    if (!footer || !('IntersectionObserver' in window)) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => setIsFooterVisible(entry.isIntersecting),
      { threshold: 0.05 },
    );
    observer.observe(footer);

    return () => observer.disconnect();
  }, []);

  return (
    <div className={`floating-contact-container${isFooterVisible ? ' footer-visible' : ''}`}>
      <a
        href={whatsappUrl}
        className="floating-btn whatsapp"
        aria-label={t('footer.whatsapp')}
        rel="noreferrer"
        target="_blank"
      >
        <i className='bx bxl-whatsapp'></i>
      </a>
      <a href="tel:+905550456261" className="floating-btn phone" aria-label={t('footer.phone')}>
        <i className='bx bxs-phone'></i>
      </a>
    </div>
  );
};

export default FloatingContact;
