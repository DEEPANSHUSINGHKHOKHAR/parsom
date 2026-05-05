import { siteConfig } from '../../config/site-config';

const absoluteUrl = (path = '/') => {
  if (/^https?:\/\//i.test(path)) return path;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${siteConfig.siteUrl}${normalizedPath}`;
};

const cleanText = (value = '') =>
  String(value)
    .replace(/\s+/g, ' ')
    .trim();

const stripUndefined = (value) => {
  if (Array.isArray(value)) {
    return value
      .map(stripUndefined)
      .filter((item) => item !== undefined && item !== null && item !== '');
  }

  if (value && typeof value === 'object') {
    return Object.entries(value).reduce((acc, [key, entry]) => {
      const cleaned = stripUndefined(entry);

      if (cleaned !== undefined && cleaned !== null && cleaned !== '') {
        acc[key] = cleaned;
      }

      return acc;
    }, {});
  }

  return value;
};

const buildBreadcrumbJsonLd = (items) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: absoluteUrl(item.path),
  })),
});

export { absoluteUrl, buildBreadcrumbJsonLd, cleanText, stripUndefined };
