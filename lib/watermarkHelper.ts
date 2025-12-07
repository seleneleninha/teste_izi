/**
 * Watermark Helper
 * Applies broker's watermark to property photos
 */

/**
 * Load an image from a File or URL
 */
function loadImage(source: File | string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';

        img.onload = () => resolve(img);
        img.onerror = reject;

        if (typeof source === 'string') {
            img.src = source;
        } else {
            const reader = new FileReader();
            reader.onload = (e) => {
                img.src = e.target?.result as string;
            };
            reader.onerror = reject;
            reader.readAsDataURL(source);
        }
    });
}

/**
 * Apply watermark to an image
 * @param originalImage - The original property photo
 * @param watermarkUrl - URL of the broker's watermark
 * @returns Processed image as Blob
 */
export async function applyWatermark(
    originalImage: File,
    watermarkUrl: string
): Promise<Blob> {
    try {
        // Create canvas
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            throw new Error('Could not get canvas context');
        }

        // Load original image
        const img = await loadImage(originalImage);
        canvas.width = img.width;
        canvas.height = img.height;

        // Draw original image
        ctx.drawImage(img, 0, 0);

        // Load watermark
        const watermark = await loadImage(watermarkUrl);

        // Calculate watermark dimensions (20% of image width)
        const wmWidth = img.width * 0.20;
        const wmHeight = (watermark.height / watermark.width) * wmWidth;

        // Calculate centered position
        const x = (img.width - wmWidth) / 2;
        const y = (img.height - wmHeight) / 2;

        // Apply watermark with transparency
        ctx.globalAlpha = 0.20;
        ctx.drawImage(watermark, x, y, wmWidth, wmHeight);

        // Reset alpha
        ctx.globalAlpha = 1.0;

        // Convert to blob
        return new Promise((resolve, reject) => {
            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error('Failed to create blob'));
                    }
                },
                'image/jpeg',
                0.92 // High quality
            );
        });
    } catch (error) {
        console.error('Error applying watermark:', error);
        throw error;
    }
}

/**
 * Check if user has a watermark configured
 */
export async function getUserWatermark(userId: string): Promise<string | null> {
    const { supabase } = await import('../lib/supabaseClient');

    try {
        const { data, error } = await supabase
            .from('perfis')
            .select('marca_dagua')
            .eq('id', userId)
            .single();

        if (error) throw error;

        return data?.marca_dagua || null;
    } catch (error) {
        console.error('Error fetching watermark:', error);
        return null;
    }
}
