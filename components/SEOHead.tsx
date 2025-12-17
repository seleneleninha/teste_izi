import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface SEOHeadProps {
    title?: string;
    description?: string;
    image?: string;
    type?: 'website' | 'article' | 'product' | 'profile';
    author?: string;
    publishedTime?: string;
    modifiedTime?: string;
    tags?: string[];
    price?: number;
    currency?: string;
    locale?: string;
}

export const SEOHead: React.FC<SEOHeadProps> = ({
    title = 'iziBrokerz - Plataforma Imobiliária Digital',
    description = 'Encontre o imóvel ideal com a iziBrokerz. Conectamos você aos melhores corretores parceiros para compra, venda, locação e temporada. Experiência imobiliária simplificada e transparente.',
    image = '/logos/izibrokerz-share.png',
    type = 'website',
    author,
    publishedTime,
    modifiedTime,
    tags = [],
    price,
    currency = 'BRL',
    locale = 'pt_BR',
}) => {
    const location = useLocation();
    const canonicalUrl = `https://izibrokerz.com${location.pathname}`;
    const siteName = 'iziBrokerz';

    useEffect(() => {
        // ✅ Basic Meta Tags
        document.title = title;
        updateMetaTag('description', description);
        updateMetaTag('author', author || 'iziBrokerz');
        updateMetaTag('keywords', tags.join(', ') || 'imóveis, corretores, compra, venda, locação, imobiliária');

        // ✅ OpenGraph Tags (Facebook, LinkedIn, WhatsApp)
        updateMetaTag('og:site_name', siteName, 'property');
        updateMetaTag('og:title', title, 'property');
        updateMetaTag('og:description', description, 'property');
        updateMetaTag('og:image', image.startsWith('http') ? image : `https://izibrokerz.com${image}`, 'property');
        updateMetaTag('og:url', canonicalUrl, 'property');
        updateMetaTag('og:type', type, 'property');
        updateMetaTag('og:locale', locale, 'property');

        // ✅ Twitter Card Tags
        updateMetaTag('twitter:card', 'summary_large_image');
        updateMetaTag('twitter:title', title);
        updateMetaTag('twitter:description', description);
        updateMetaTag('twitter:image', image.startsWith('http') ? image : `https://izibrokerz.com${image}`);
        updateMetaTag('twitter:creator', '@izibrokerz');
        updateMetaTag('twitter:site', '@izibrokerz');

        // ✅ Article-specific tags
        if (type === 'article') {
            if (publishedTime) {
                updateMetaTag('article:published_time', publishedTime, 'property');
            }
            if (modifiedTime) {
                updateMetaTag('article:modified_time', modifiedTime, 'property');
            }
            if (author) {
                updateMetaTag('article:author', author, 'property');
            }
            tags.forEach((tag, index) => {
                updateMetaTag(`article:tag`, tag, 'property', index);
            });
        }

        // ✅ Product-specific tags (for property listings)
        if (type === 'product' && price) {
            updateMetaTag('product:price:amount', price.toString(), 'property');
            updateMetaTag('product:price:currency', currency, 'property');
        }

        // ✅ Canonical URL
        updateLinkTag('canonical', canonicalUrl);

        // ✅ Mobile optimization
        updateMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=5');
        updateMetaTag('theme-color', '#10b981'); // emerald-500

        // ✅ Additional SEO tags
        updateMetaTag('robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
        updateMetaTag('googlebot', 'index, follow');

        // Clean up function to prevent memory leaks
        return () => {
            // Optional: cleanup if needed
        };
    }, [title, description, image, type, author, publishedTime, modifiedTime, tags, price, currency, locale, canonicalUrl]);

    return null; // This component doesn't render anything
};

// ✅ Helper function to update or create meta tags
function updateMetaTag(name: string, content: string, attribute: 'name' | 'property' = 'name', index?: number) {
    if (!content) return;

    const selector = `meta[${attribute}="${name}"]`;
    let element = index !== undefined
        ? document.querySelectorAll(selector)[index] as HTMLMetaElement
        : document.querySelector(selector) as HTMLMetaElement;

    if (element) {
        element.setAttribute('content', content);
    } else {
        element = document.createElement('meta');
        element.setAttribute(attribute, name);
        element.setAttribute('content', content);
        document.head.appendChild(element);
    }
}

// ✅ Helper function to update or create link tags
function updateLinkTag(rel: string, href: string) {
    if (!href) return;

    let element = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement;

    if (element) {
        element.setAttribute('href', href);
    } else {
        element = document.createElement('link');
        element.setAttribute('rel', rel);
        element.setAttribute('href', href);
        document.head.appendChild(element);
    }
}

// ✅ Schema.org JSON-LD Generator
export const generateSchemaOrg = (data: {
    type: 'RealEstateAgent' | 'Product' | 'WebSite' | 'Organization';
    name: string;
    description?: string;
    image?: string;
    url?: string;
    address?: {
        streetAddress?: string;
        addressLocality?: string;
        addressRegion?: string;
        postalCode?: string;
        addressCountry?: string;
    };
    telephone?: string;
    email?: string;
    priceRange?: string;
    offers?: {
        price: number;
        priceCurrency: string;
        availability?: string;
    };
    aggregateRating?: {
        ratingValue: number;
        reviewCount: number;
    };
}) => {
    const schema: any = {
        '@context': 'https://schema.org',
        '@type': data.type,
        name: data.name,
    };

    if (data.description) schema.description = data.description;
    if (data.image) schema.image = data.image;
    if (data.url) schema.url = data.url;
    if (data.address) schema.address = { '@type': 'PostalAddress', ...data.address };
    if (data.telephone) schema.telephone = data.telephone;
    if (data.email) schema.email = data.email;
    if (data.priceRange) schema.priceRange = data.priceRange;
    if (data.offers) schema.offers = { '@type': 'Offer', ...data.offers };
    if (data.aggregateRating) schema.aggregateRating = { '@type': 'AggregateRating', ...data.aggregateRating };

    return (
        <script type="application/ld+json">
            {JSON.stringify(schema)}
        </script>
    );
};
