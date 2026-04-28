import { useLocation } from 'react-router-dom';
import Seo from './seo';
import { absoluteUrl } from './seo-utils';
import { siteConfig } from '../../config/site-config';

const publicPages = {
  '/': {
    title: siteConfig.defaultSeoTitle,
    description: siteConfig.defaultSeoDescription,
  },
  '/about': {
    title: 'About PARSOM ATTIRES | Online Fashion Brand',
    description:
      'Learn about PARSOM ATTIRES, established in March 2026 as an online fashion brand with a women\'s collection, account tools, support access, and upcoming custom clothing services.',
  },
  '/collection': {
    title: 'Shop the PARSOM ATTIRE Collection | Luxury Streetwear',
    description:
      'Explore the PARSOM ATTIRE collection of limited-run luxury streetwear, minimal essentials, statement silhouettes, and premium fashion pieces.',
  },
  '/stitch-your-cloth': {
    title: 'Stitch Your Cloth Coming Soon | PARSOM ATTIRE',
    description:
      'Discover the upcoming PARSOM ATTIRE custom clothing experience and explore the current luxury streetwear collection while it is prepared.',
  },
  '/contact': {
    title: 'Contact PARSOM ATTIRE | Client Services and Order Support',
    description:
      'Contact PARSOM ATTIRE for styling advice, order support, collaboration inquiries, and archive collection assistance.',
  },
  '/size-chart': {
    title: 'Size Chart | PARSOM ATTIRE',
    description:
      'Find the right PARSOM ATTIRE fit with size guidance for luxury streetwear, shirts, trousers, outerwear, and limited-run pieces.',
  },
  '/terms': {
    title: 'Terms and Conditions | PARSOM ATTIRE',
    description:
      'Read the PARSOM ATTIRE terms and conditions for using the website, ordering products, payments, shipping, and customer accounts.',
  },
  '/privacy': {
    title: 'Privacy Policy | PARSOM ATTIRE',
    description:
      'Read how PARSOM ATTIRE collects, uses, protects, and stores customer information across orders, accounts, and support requests.',
  },
  '/returns': {
    title: 'Returns and Exchanges | PARSOM ATTIRE',
    description:
      'Review the PARSOM ATTIRE returns and exchanges policy for eligible orders, timelines, product condition, and customer support.',
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
  '@type': 'Organization',
  name: siteConfig.brandName,
  url: siteConfig.siteUrl,
  logo: absoluteUrl('/favicon.svg'),
  email: siteConfig.contactEmail,
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

  if (pathname.startsWith('/products/') || pathname.startsWith('/product/')) {
    return (
      <Seo
        title={`Product Details | ${siteConfig.brandName}`}
        description="View product details, available sizes, pricing, reviews, and WhatsApp ordering options from PARSOM ATTIRE."
      />
    );
  }

  const page = publicPages[pathname] || publicPages['/'];
  const noindex = noindexPages.has(pathname);
  const jsonLd = pathname === '/' ? [organizationJsonLd, websiteJsonLd] : null;

  return (
    <Seo
      title={page.title}
      description={page.description}
      path={pathname}
      noindex={noindex}
      jsonLd={jsonLd}
    />
  );
}
