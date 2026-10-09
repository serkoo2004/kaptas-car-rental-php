export function translateLocationName(name, t) {
  const value = String(name || '').trim();
  const normalized = value.toLocaleLowerCase('tr-TR');

  if (normalized.includes('havaliman') || normalized.includes('airport') || normalized.includes('المطار')) {
    return t('search.locationNames.airport');
  }

  if (['merkez ofis', 'main office', 'المكتب الرئيسي'].includes(normalized)) {
    return t('search.locationNames.mainOffice');
  }

  return value;
}
