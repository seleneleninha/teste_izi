/**
 * Utility to generate optimized image URLs.
 * NOTE: Supabase Image Transformation is a paid feature. 
 * We revert to original URLs for Supabase storage to ensure visibility on all plans.
 */

interface OptimizationOptions {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'avif' | 'origin';
    resize?: 'cover' | 'contain' | 'fill';
}

/**
 * Returns the image URL. In the future, this can be hooked into a CDN or 
 * Supabase Transformation API (if on a paid plan).
 */
export function getOptimizedImageUrl(
    url: string | null | undefined,
    options: OptimizationOptions = {}
): string {
    if (!url) return '';

    // If it's a Supabase URL, we currently return it as is to avoid 
    // "Image Transformation not enabled" errors on free/pro tiers 
    // where the feature isn't active.

    // You can also append height/width if using a service like Cloudinary or Uniq
    return url;
}
