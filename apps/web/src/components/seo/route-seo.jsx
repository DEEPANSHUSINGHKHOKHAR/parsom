import { useLocation } from 'react-router-dom';
import Seo from './seo';
import { absoluteUrl, buildBreadcrumbJsonLd } from './seo-utils';
import { siteConfig } from '../../config/site-config';

const publicPages = {
  '/': {
    title: siteConfig.defaultSeoTitle,
    description: siteConfig.defaultSeoDescription,
    name: 'Home',
  },
  '/about': {
    title: 'About PARSOM ATTIRE | Online Fashion Brand',
    description:
      'Learn about PARSOM ATTIRE, established in March 2026 as an online fashion brand with a women\'s collection, account tools, support access, and upcoming custom clothing services.',
    name: 'About',
  },
  '/collection': {
    title: 'Shop the PARSOM ATTIRE Collection | Luxury Wardrobe',
    description:
      'Explore the PARSOM ATTIRE collection of limited-run luxury wardrobe pieces, minimal essentials, statement silhouettes, and premium fashion pieces.',
    name: 'Collection',
  },
  '/stitch-your-cloth': {
    title: 'Stitch Your Cloth Coming Soon | PARSOM ATTIRE',
    description:
      'Discover the upcoming PARSOM ATTIRE custom clothing experience and explore the current luxury wardrobe collection while it is prepared.',
    name: 'Stitch Your Cloth',
  },
  '/contact': {
    title: 'Contact PARSOM ATTIRE | Client Services and Order Support',
    description:
      'Contact PARSOM ATTIRE for styling advice, order support, collaboration inquiries, and archive collection assistance.',
    name: 'Contact',
  },
  '/size-chart': {
    title: 'Size Chart | PARSOM ATTIRE',
    description:
      'Find the right PARSOM ATTIRE fit with size guidance for luxury wardrobe pieces, shirts, trousers, outerwear, and limited-run pieces.',
    name: 'Size Chart',
  },
  '/terms': {
    title: 'Terms and Conditions | PARSOM ATTIRE',
    description:
      'Read the PARSOM ATTIRE terms and conditions for using the website, ordering products, payments, shipping, and customer accounts.',
    name: 'Terms and Conditions',
  },
  '/privacy': {
    title: 'Privacy Policy | PARSOM ATTIRE',
    description:
      'Read how PARSOM ATTIRE collects, uses, protects, and stores customer information across orders, accounts, and support requests.',
    name: 'Privacy Policy',
  },
  '/returns': {
    title: 'Returns and Exchanges | PARSOM ATTIRE',
    description:
      'Review the PARSOM ATTIRE returns and exchanges policy for eligible orders, timelines, product condition, and customer support.',
    name: 'Returns and Exchanges',
  },
};

const noindexPages = new Set([
  '/account',
  '/cart',
  '/checkout',
  '/forgot-password',
  '/login',
  '/register',
  '/thank-you',
]);

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ClothingStore',
  name: siteConfig.brandName,
  url: siteConfig.siteUrl,
  logo: absoluteUrl('/favicon.svg'),
  image: absoluteUrl(siteConfig.defaultSeoImage),
  email: siteConfig.contactEmail,
  areaServed: siteConfig.businessLocation,
  priceRange: 'INR',
  sameAs: Object.values(siteConfig.socialLinks),
};

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: siteConfig.brandName,
  url: siteConfig.siteUrl,
  potentialAction: {
    '@type': 'SearchAction',
    target: `${siteConfig.siteUrl}/collection?search={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
};

export default function RouteSeo() {
  const location = useLocation();
  const pathname = location.pathname.replace(/\/$/, '') || '/';
  const page = publicPages[pathname];

  if (pathname.startsWith('/products/') || pathname.startsWith('/product/')) {
    return (
      <Seo
        title={`Product Details | ${siteConfig.brandName}`}
        description="View product details, available sizes, pricing, and WhatsApp ordering options from PARSOM ATTIRE."
      />
    );
  }

  const resolvedPage = page || publicPages['/'];
  const noindex = noindexPages.has(pathname) || !page;
  const pageJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: resolvedPage.name,
    url: absoluteUrl(page ? pathname : '/'),
    description: resolvedPage.description,
    isPartOf: {
      '@type': 'WebSite',
      name: siteConfig.brandName,
      url: siteConfig.siteUrl,
    },
  };
  const jsonLd =
    pathname === '/'
      ? [organizationJsonLd, websiteJsonLd, pageJsonLd]
      : [
          pageJsonLd,
          buildBreadcrumbJsonLd([
            { name: 'Home', path: '/' },
            { name: resolvedPage.name, path: pathname },
          ]),
        ];

  return (
    <Seo
      title={resolvedPage.title}
      description={resolvedPage.description}
      path={page ? pathname : '/'}
      noindex={noindex}
      jsonLd={jsonLd}
    />
  );
}
