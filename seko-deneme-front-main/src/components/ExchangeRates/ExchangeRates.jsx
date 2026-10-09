import React, { useEffect, useMemo, useState } from 'react';
import { useI18n } from '../../i18n/I18nContext';
import './ExchangeRates.css';

const refreshInterval = 30 * 60 * 1000;

const ExchangeRates = ({ mobile = false }) => {
  const { language, t } = useI18n();
  const [payload, setPayload] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;

    const loadRates = async () => {
      try {
        const response = await fetch('/api/public/exchange-rates', {
          headers: { Accept: 'application/json' },
        });
        const result = await response.json();
        if (!response.ok || !Array.isArray(result.rates)) throw new Error('rate request failed');
        if (active) {
          setPayload(result);
          setFailed(false);
        }
      } catch {
        if (active) setFailed(true);
      }
    };

    loadRates();
    const interval = window.setInterval(loadRates, refreshInterval);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  const formatter = useMemo(() => new Intl.NumberFormat(
    language === 'ar' ? 'ar' : language === 'en' ? 'en-US' : 'tr-TR',
    { maximumFractionDigits: 4, minimumFractionDigits: 2 },
  ), [language]);

  const tooltip = payload
    ? `${t('rates.source')}: ${payload.provider} · ${t('rates.updated')}: ${payload.asOf}`
    : t(failed ? 'rates.unavailable' : 'rates.loading');

  return (
    <div className={`exchange-rates ${mobile ? 'exchange-rates-mobile' : ''}`} title={tooltip}>
      <span className="exchange-title"><i className="bx bx-line-chart" />{t('rates.title')}</span>
      {payload?.rates?.map((rate) => (
        <span className="exchange-rate" key={rate.code}>
          <strong>{rate.code}</strong>
          <b>₺{formatter.format(rate.selling)}</b>
        </span>
      ))}
      {!payload ? <span className="exchange-status">{t(failed ? 'rates.unavailable' : 'rates.loading')}</span> : null}
    </div>
  );
};

export default ExchangeRates;
