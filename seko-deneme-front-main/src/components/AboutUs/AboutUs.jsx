import React from 'react';
import { useI18n } from '../../i18n/I18nContext';
import './AboutUs.css';

const AboutUs = () => {
  const { t } = useI18n();
  const paragraphs = t('about.paragraphs');
  const principles = t('about.principles');
  const process = t('about.process');

  return (
    <div className="about-page">
      <div className="container about-breadcrumb">
        <ul>
          <li><a href="/" title={t('common.home')}>{t('common.home')}</a></li>
          <li><span className="separator">/</span></li>
          <li className="active">{t('about.title')}</li>
        </ul>
      </div>

      <section className="container about-intro">
        <header className="about-heading">
          <span>{t('about.eyebrow')}</span>
          <h1>{t('about.title')}</h1>
          <p>{t('about.subtitle')}</p>
        </header>
        <div className="about-copy">
          {paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        </div>
      </section>

      <section className="about-principles">
        <div className="container">
          {principles.map((item, index) => (
            <article key={item.title}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <h2>{item.title}</h2>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="container about-process">
        <header>
          <span>{t('about.processEyebrow')}</span>
          <h2>{t('about.processTitle')}</h2>
        </header>
        <ol>
          {process.map((item, index) => (
            <li key={item.title}>
              <b>{String(index + 1).padStart(2, '0')}</b>
              <div><h3>{item.title}</h3><p>{item.text}</p></div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
};

export default AboutUs;
