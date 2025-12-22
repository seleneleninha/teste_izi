/**
 * Utility to generate optimized image URLs using Supabase's Image Transformation API.
 * Documention: https://supabase.com/docs/guides/storage/image-transformations
 */

interface OptimizationOptions {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'avif' | 'origin';
    resize?: 'cover' | 'contain' | 'fill';
}

/**
 * Transforms a standard Supabase storage URL into an optimized version.
 * If the URL is not from Supabase or optimization fails, it returns the original URL.
 */
export function getOptimizedImageUrl(
    url: string | null | undefined,
    options: OptimizationOptions = {}
): string {
    if (!url) return '';

    // Only optimize Supabase storage URLs
    // Example: https://pqlvqlqypyqyqyx.supabase.co/storage/v1/object/public/property-photos/image.jpg
    if (!url.includes('supabase.co/storage/v1/object/public/')) {
        return url;
    }

    const {
        width,
        height,
        quality = 80,
        format = 'webp',
        resize = 'cover'
    } = options;

    try {
        // Supabase transformation URL format:
        // .../storage/v1/render/image/public/[bucket]/[path]?width=[w]&height=[h]&quality=[q]&format=[f]&resize=[r]

        // 1. Identify parts
        const baseUrl = url.split('/storage/v1/object/public/')[0];
        const pathAfterPublic = url.split('/storage/v1/object/public/')[1];

        if (!pathAfterPublic) return url;

        // 2. Build transformation query
        const params = new URLSearchParams();
        if (width) params.set('width', width.toString());
        if (height) params.set('height', height.toString());
        params.set('quality', quality.toString());
        if (format !== 'origin') params.set('format', format);
        params.set('resize', resize);

        // 3. Return the transformation URL
        return `${baseUrl}/storage/v1/render/image/public/${pathAfterPublic}?${params.toString()}`;
    } catch (error) {
        console.warn('Failed to optimize image URL:', error);
        return url;
    }
}
