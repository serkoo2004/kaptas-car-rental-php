/* oxlint-disable react/only-export-components */
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { languages, translations } from './translations';

const storageKey = 'kaptas-language';
const currencyStorageKey = 'kaptas-currency';
const currencies = ['TRY', 'USD', 'EUR'];
const I18nContext = createContext(null);

function getInitialLanguage() {
  const saved = window.localStorage.getItem(storageKey);
  if (translations[saved]) return saved;

  const browserLanguage = window.navigator.language?.slice(0, 2).toLowerCase();
  return translations[browserLanguage] ? browserLanguage : 'tr';
}

function getInitialCurrency() {
  const saved = window.localStorage.getItem(currencyStorageKey);
  return currencies.includes(saved) ? saved : 'TRY';
}

function resolvePath(source, path) {
  return path.split('.').reduce((value, key) => value?.[key], source);
}

export function I18nProvider({ children }) {
  const [language, setLanguage] = useState(getInitialLanguage);
  const [currency, setCurrency] = useState(getInitialCurrency);

  useEffect(() => {
    const direction = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    document.documentElement.dir = direction;
    document.body.dir = direction;
    window.localStorage.setItem(storageKey, language);
  }, [language]);

  useEffect(() => {
    window.localStorage.setItem(currencyStorageKey, currency);
  }, [currency]);

  const value = useMemo(() => ({
    currencies,
    currency,
    direction: language === 'ar' ? 'rtl' : 'ltr',
    language,
    languages,
    setLanguage,
    setCurrency,
    t(path, fallback = path) {
      return resolvePath(translations[language], path)
        ?? resolvePath(translations.tr, path)
        ?? fallback;
    },
  }), [currency, language]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const value = useContext(I18nContext);
  if (!value) throw new Error('useI18n must be used within I18nProvider');
  return value;
}
