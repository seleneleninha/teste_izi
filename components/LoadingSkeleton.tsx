// Loading Skeleton Components for iziBrokerz
// Provides consistent loading states across the platform

import React from 'react';

/**
 * Skeleton for Property Cards
 */
export const PropertyCardSkeleton: React.FC = () => (
    <div className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-md animate-pulse">
        {/* Image skeleton */}
        <div className="h-48 bg-gray-200 dark:bg-slate-700" />

        {/* Content skeleton */}
        <div className="p-4 space-y-3">
            {/* Title */}
            <div className="h-5 bg-gray-200 dark:bg-slate-700 rounded w-3/4" />

            {/* Location */}
            <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-1/2" />

            {/* Features */}
            <div className="flex gap-4">
                <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-16" />
                <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-16" />
                <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-16" />
            </div>

            {/* Price */}
            <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded w-2/3 mt-4" />
        </div>
    </div>
);

/**
 * Skeleton for Broker Profile Header
 */
export const BrokerProfileSkeleton: React.FC = () => (
    <div className="animate-pulse space-y-6">
        {/* Hero section */}
        <div className="h-64 bg-gray-800 rounded-3xl" />

        {/* Profile info */}
        <div className="flex items-center gap-4">
            <div className="w-24 h-24 bg-gray-700 rounded-full" />
            <div className="flex-1 space-y-3">
                <div className="h-8 bg-gray-700 rounded w-1/2" />
                <div className="h-4 bg-gray-700 rounded w-1/3" />
            </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
            <div className="h-20 bg-gray-800 rounded-xl" />
            <div className="h-20 bg-gray-800 rounded-xl" />
            <div className="h-20 bg-gray-800 rounded-xl" />
        </div>
    </div>
);

/**
 * Skeleton for Property Details Page
 */
export const PropertyDetailsSkeleton: React.FC = () => (
    <div className="animate-pulse space-y-6">
        {/* Gallery */}
        <div className="h-96 bg-gray-200 dark:bg-slate-800 rounded-2xl" />

        {/* Title */}
        <div className="h-10 bg-gray-200 dark:bg-slate-800 rounded w-3/4" />

        {/* Price */}
        <div className="h-12 bg-gray-200 dark:bg-slate-800 rounded w-1/2" />

        {/* Details grid */}
        <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 bg-gray-200 dark:bg-slate-800 rounded-xl" />
            ))}
        </div>

        {/* Description */}
        <div className="space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-full" />
            <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-full" />
            <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-3/4" />
        </div>
    </div>
);

/**
 * Skeleton for Dashboard Stats
 */
export const DashboardStatsSkeleton: React.FC = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="h-10 w-10 bg-gray-200 dark:bg-slate-700 rounded-full" />
                    <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded w-12" />
                </div>
                <div className="h-8 bg-gray-200 dark:bg-slate-700 rounded w-1/2" />
                <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-3/4" />
            </div>
        ))}
    </div>
);

/**
 * Skeleton for Table Rows
 */
export const TableRowSkeleton: React.FC<{ columns?: number }> = ({ columns = 4 }) => (
    <tr className="animate-pulse">
        {Array.from({ length: columns }).map((_, i) => (
            <td key={i} className="px-6 py-4">
                <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-full" />
            </td>
        ))}
    </tr>
);

/**
 * Skeleton for List Items
 */
export const ListItemSkeleton: React.FC = () => (
    <div className="flex items-center gap-4 p-4 animate-pulse">
        <div className="w-12 h-12 bg-gray-200 dark:bg-slate-700 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-3/4" />
            <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-1/2" />
        </div>
    </div>
);

/**
 * Skeleton for City Cards (BrokerPage)
 */
export const CityCardSkeleton: React.FC = () => (
    <div className="flex-none w-[280px] animate-pulse">
        <div className="h-[400px] bg-gray-800 rounded-3xl flex flex-col justify-end p-8">
            <div className="space-y-3">
                <div className="h-6 bg-gray-700 rounded w-2/3" />
                <div className="h-1 bg-gray-700 rounded w-12" />
            </div>
        </div>
    </div>
);

/**
 * Skeleton for Search Filter
 */
export const SearchFilterSkeleton: React.FC = () => (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-12 bg-gray-200 dark:bg-slate-700 rounded-lg" />
            ))}
        </div>
    </div>
);

/**
 * Generic Skeleton with custom dimensions
 */
export const Skeleton: React.FC<{
    width?: string;
    height?: string;
    className?: string;
    rounded?: 'sm' | 'md' | 'lg' | 'full';
}> = ({ width = 'w-full', height = 'h-4', className = '', rounded = 'md' }) => {
    const roundedClass = {
        sm: 'rounded-sm',
        md: 'rounded',
        lg: 'rounded-lg',
        full: 'rounded-full'
    }[rounded];

    return (
        <div
            className={`bg-gray-200 dark:bg-slate-700 animate-pulse ${width} ${height} ${roundedClass} ${className}`}
        />
    );
};

/**
 * Skeleton Grid for property listings
 */
export const PropertyGridSkeleton: React.FC<{ count?: number }> = ({ count = 8 }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: count }).map((_, i) => (
            <PropertyCardSkeleton key={i} />
        ))}
    </div>
);
