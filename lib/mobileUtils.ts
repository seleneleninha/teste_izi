/**
 * Touch-Safe Utilities for Mobile UX
 * 
 * Apple and Google recommend MINIMUM 44x44px touch targets
 * These utilities ensure accessible and user-friendly mobile interactions
 */

// ✅ Touch-safe container (44x44px minimum)
export const touchSafeButton = "min-w-[44px] min-h-[44px] inline-flex items-center justify-center";

// ✅ Touch-safe with padding (for text buttons)
export const touchSafeTextButton = "min-h-[44px] px-4 inline-flex items-center justify-center";

// ✅ Icon size inside touch-safe container
export const touchSafeIcon = "w-5 h-5"; // 20px icon in 44px container = 12px padding each side

// ✅ Large touch target for primary actions
export const touchSafePrimary = "min-h-[48px] px-6 inline-flex items-center justify-center";

// ✅ Active state feedback (visual)
export const activeStateFeedback = "active:scale-95 transition-transform duration-100";

// ✅ Full tap feedback with ripple effect style
export const tapFeedback = "active:scale-95 active:bg-opacity-80 transition-all duration-150";

// ✅ Combined touch-safe + feedback
export const touchButton = `${touchSafeButton} ${activeStateFeedback}`;

// ✅ Mobile-optimized spacing
export const mobileSpacing = {
    tight: "gap-2",      // 8px
    normal: "gap-3",     // 12px  
    relaxed: "gap-4",    // 16px
    loose: "gap-6",      // 24px
};

// ✅ Responsive font sizes
export const mobileFontSizes = {
    xs: "text-xs sm:text-sm",      // 12px → 14px
    sm: "text-sm sm:text-base",    // 14px → 16px
    base: "text-base sm:text-lg",  // 16px → 18px
    lg: "text-lg sm:text-xl",      // 18px → 20px
    xl: "text-xl sm:text-2xl",     // 20px → 24px
};

// ✅ Mobile-safe modal close button
export const modalCloseButton = `
  ${touchSafeButton}
  rounded-full
  hover:bg-slate-800
  transition-colors
  ${activeStateFeedback}
`;

// ✅ Mobile-safe icon button (navigation, actions, etc)
export const iconButton = `
  ${touchSafeButton}
  rounded-lg
  hover:bg-slate-800
  transition-colors
  ${activeStateFeedback}
`;

// ✅ Mobile-safe chip/tag (removable)
export const mobileChip = `
  min-h-[36px]
  px-3
  inline-flex
  items-center
  gap-2
  rounded-full
  ${activeStateFeedback}
`;

// ✅ Bottom sheet safe area (iOS notch)
export const bottomSheetSafeArea = "pb-safe"; // Requires env(safe-area-inset-bottom)

// ✅ Sticky mobile header
export const stickyMobileHeader = `
  sticky
  top-0
  z-50
  bg-midnight-900
  border-b
  border-slate-800
`;

// ✅ Mobile-optimized input
export const mobileInput = `
  min-h-[48px]
  px-4
  text-base
  rounded-xl
`;

// ✅ FAB (Floating Action Button) positioning
export const fab = `
  fixed
  bottom-6
  right-6
  ${touchSafePrimary}
  rounded-full
  shadow-lg
  z-40
`;

/**
 * Helper function to check if device is mobile
 */
export const isMobileDevice = (): boolean => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 768;
};

/**
 * Helper function to add haptic feedback (vibration)
 * Only works on mobile devices
 */
export const hapticFeedback = (type: 'light' | 'medium' | 'heavy' = 'light') => {
    if ('vibrate' in navigator) {
        const patterns = {
            light: 10,
            medium: 20,
            heavy: 30,
        };
        navigator.vibrate(patterns[type]);
    }
};

/**
 * Debounce helper for search inputs
 */
export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

/**
 * Throttle helper for scroll handlers
 */
export function throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => (inThrottle = false), limit);
        }
    };
}
