import React from 'react';
import { useI18n } from '../../i18n/I18nContext';
import '../FleetSales/FleetSales.css';

const RentalConditions = () => {
  const { t } = useI18n();
  const sections = t('rental.sections');

  return (
    <div className="fleet-sales-wrapper">
      <div className="container breadcrumb-container">
        <ul className="breadcrumb">
          <li><a href="/" title={t('common.home')}>{t('common.home')}</a></li>
          <li><span className="separator">/</span></li>
          <li className="active">{t('rental.title')}</li>
        </ul>
      </div>

      <section className="container sub_page rental-terms-page">
        <header><h1>{t('rental.title')}</h1></header>
        <div className="sub_page_content rental-terms-list">
          {sections.map(([title, body], index) => (
            <article className="rental-term-row" key={title}>
              <span className="rental-term-number">{String(index + 1).padStart(2, '0')}</span>
              <div>
                <h2>{title}</h2>
                <p>{body}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};

export default RentalConditions;
