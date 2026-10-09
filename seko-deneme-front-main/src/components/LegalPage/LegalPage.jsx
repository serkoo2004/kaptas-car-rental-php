import React, { useEffect } from 'react';
import { useI18n } from '../../i18n/I18nContext';
import { legalContent } from './legalContent';
import { commerceLegalPages } from './commerceLegalContent';
import './LegalPage.css';

const legalLinks = [
  '/kvkk-aydinlatma-metni',
  '/gizlilik-politikasi',
  '/cerez-politikasi',
  '/teslimat-ve-iade-sartlari',
  '/on-bilgilendirme-formu',
  '/mesafeli-satis-sozlesmesi',
  '/kvkk-basvuru',
];

const LegalPage = ({ path }) => {
  const { language, t } = useI18n();
  const localized = legalContent[language] || legalContent.tr;
  const page = commerceLegalPages[language]?.[path]
    || localized.pages[path]
    || commerceLegalPages.tr[path]
    || legalContent.tr.pages[path];
  const authority = page.authority === 'consumer'
    ? { href: 'https://tuketici.ticaret.gov.tr/', label: t('privacy.consumerAuthorityLink') }
    : { href: 'https://www.kvkk.gov.tr/', label: t('privacy.authorityLink') };

  useEffect(() => {
    document.title = `${page.title} | KAPTAŞ Car Rental`;
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [page.title]);

  return (
    <div className="legal-page">
      <div className="container legal-breadcrumb">
        <a href="/">{t('common.home')}</a>
        <span>/</span>
        <span>{page.title}</span>
      </div>

      <div className="container legal-layout">
        <aside className="legal-navigation" aria-label={t('privacy.legalHeading')}>
          <strong>{t('privacy.legalHeading')}</strong>
          {legalLinks.map((link) => (
            <a className={link === path ? 'active' : ''} href={link} key={link}>
              {t(`privacy.links.${link.slice(1)}`)}
            </a>
          ))}
        </aside>

        <article className="legal-document">
          <header>
            <span>{page.eyebrow}</span>
            <h1>{page.title}</h1>
            <p>{page.intro}</p>
            <small>{localized.updated}</small>
          </header>

          <div className="legal-controller">
            <b>{localized.controller}</b>
            <div className="legal-controller-addresses">
              <address><small>{localized.controllerAddressLabel}</small>{localized.controllerAddress}</address>
              <address><small>{localized.operationAddressLabel}</small>{localized.operationAddress}</address>
            </div>
            <a href="mailto:kaptascarrental@gmail.com">kaptascarrental@gmail.com</a>
            <a dir="ltr" href="tel:+905550456261">0 (555) 045 62 61</a>
          </div>

          <div className="legal-sections">
            {page.sections.map(([heading, paragraphs]) => (
              <section key={heading}>
                <h2>{heading}</h2>
                {paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              </section>
            ))}
          </div>

          <div className="legal-official-link">
            <i className="bx bx-link-external" aria-hidden="true" />
            <a href={authority.href} rel="noreferrer" target="_blank">
              {authority.label}
            </a>
          </div>
        </article>
      </div>
    </div>
  );
};

export default LegalPage;
