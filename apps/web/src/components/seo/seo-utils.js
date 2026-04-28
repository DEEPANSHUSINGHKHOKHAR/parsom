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

export { absoluteUrl, cleanText };
