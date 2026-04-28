import { useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { siteConfig } from '../../config/site-config';
import { absoluteUrl, cleanText } from './seo-utils';

const upsertMeta = (selector, createAttributes, updateAttributes) => {
  let element = document.head.querySelector(selector);

  if (!element) {
    element = document.createElement('meta');
    Object.entries(createAttributes).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });
    document.head.appendChild(element);
  }

  Object.entries(updateAttributes).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      element.removeAttribute(key);
    } else {
      element.setAttribute(key, value);
    }
  });
};

const upsertLink = (rel, href) => {
  let element = document.head.querySelector(`link[rel="${rel}"]`);

  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', rel);
    document.head.appendChild(element);
  }

  element.setAttribute('href', href);
};

const upsertJsonLd = (id, payload) => {
  let element = document.getElementById(id);

  if (!payload) {
    element?.remove();
    return;
  }

  if (!element) {
    element = document.createElement('script');
    element.id = id;
    element.type = 'application/ld+json';
    document.head.appendChild(element);
  }

  element.textContent = JSON.stringify(payload);
};

function Seo({
  title,
  description,
  path,
  image,
  type = 'website',
  noindex = false,
  jsonLd,
}) {
  const location = useLocation();

  const seo = useMemo(() => {
    const pathname = path || location.pathname || '/';
    const canonical = absoluteUrl(pathname);
    const resolvedTitle = cleanText(title || siteConfig.defaultSeoTitle);
    const resolvedDescription = cleanText(
      description || siteConfig.defaultSeoDescription
    );
    const resolvedImage = absoluteUrl(image || siteConfig.defaultSeoImage);

    return {
      canonical,
      title: resolvedTitle,
      description: resolvedDescription,
      image: resolvedImage,
      robots: noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large',
      jsonLd,
    };
  }, [description, image, jsonLd, location.pathname, noindex, path, title]);

  useEffect(() => {
    document.title = seo.title;
    document.documentElement.lang = 'en-IN';

    upsertMeta('meta[name="description"]', { name: 'description' }, { content: seo.description });
    upsertMeta('meta[name="robots"]', { name: 'robots' }, { content: seo.robots });
    upsertMeta('meta[name="theme-color"]', { name: 'theme-color' }, { content: '#171412' });

    upsertMeta('meta[property="og:site_name"]', { property: 'og:site_name' }, { content: siteConfig.brandName });
    upsertMeta('meta[property="og:title"]', { property: 'og:title' }, { content: seo.title });
    upsertMeta('meta[property="og:description"]', { property: 'og:description' }, { content: seo.description });
    upsertMeta('meta[property="og:type"]', { property: 'og:type' }, { content: type });
    upsertMeta('meta[property="og:url"]', { property: 'og:url' }, { content: seo.canonical });
    upsertMeta('meta[property="og:image"]', { property: 'og:image' }, { content: seo.image });
    upsertMeta('meta[property="og:locale"]', { property: 'og:locale' }, { content: 'en_IN' });

    upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card' }, { content: 'summary_large_image' });
    upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title' }, { content: seo.title });
    upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description' }, { content: seo.description });
    upsertMeta('meta[name="twitter:image"]', { name: 'twitter:image' }, { content: seo.image });

    upsertLink('canonical', seo.canonical);
    upsertJsonLd('page-json-ld', seo.jsonLd);
  }, [seo, type]);

  return null;
}

export default Seo;
