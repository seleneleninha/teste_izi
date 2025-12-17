import React from 'react';

/**
 * Enhanced skeleton loader for forms
 * Mobile-optimized with proper spacing
 */
export const FormSkeleton: React.FC<{ fields?: number }> = ({ fields = 3 }) => {
    return (
        <div className="space-y-4 animate-pulse">
            {Array.from({ length: fields }).map((_, index) => (
                <div key={index} className="space-y-2">
                    {/* Label skeleton */}
                    <div className="h-4 bg-slate-700 rounded w-24"></div>

                    {/* Input skeleton - mobile optimized height */}
                    <div className="h-12 bg-slate-700 rounded-xl"></div>
                </div>
            ))}

            {/* Button skeleton */}
            <div className="h-12 bg-slate-600 rounded-xl w-full mt-6"></div>
        </div>
    );
};

/**
 * Gallery skeleton for PropertyDetails
 * Shows main image + thumbnails
 */
export const GallerySkeleton: React.FC = () => {
    return (
        <div className="space-y-4 animate-pulse">
            {/* Main image */}
            <div className="aspect-video bg-slate-700 rounded-2xl"></div>

            {/* Thumbnails */}
            <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="aspect-video bg-slate-700 rounded-lg"></div>
                ))}
            </div>
        </div>
    );
};

/**
 * Navbar skeleton for initial load
 */
export const NavbarSkeleton: React.FC = () => {
    return (
        <div className="h-16 bg-midnight-900 border-b border-slate-800 animate-pulse">
            <div className="container mx-auto px-4 h-full flex items-center justify-between">
                {/* Logo skeleton */}
                <div className="h-8 w-32 bg-slate-700 rounded"></div>

                {/* Menu items skeleton */}
                <div className="hidden md:flex gap-4">
                    <div className="h-4 w-16 bg-slate-700 rounded"></div>
                    <div className="h-4 w-20 bg-slate-700 rounded"></div>
                    <div className="h-4 w-16 bg-slate-700 rounded"></div>
                </div>

                {/* Profile skeleton */}
                <div className="h-10 w-10 bg-slate-700 rounded-full"></div>
            </div>
        </div>
    );
};

/**
 * Generic card skeleton
 * Reusable for dashboards, lists, etc
 */
export const CardSkeleton: React.FC<{ lines?: number }> = ({ lines = 3 }) => {
    return (
        <div className="bg-slate-800 rounded-2xl p-6 animate-pulse space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="h-6 bg-slate-700 rounded w-32"></div>
                <div className="h-8 w-8 bg-slate-700 rounded-full"></div>
            </div>

            {/* Content lines */}
            <div className="space-y-3">
                {Array.from({ length: lines }).map((_, i) => (
                    <div
                        key={i}
                        className="h-4 bg-slate-700 rounded"
                        style={{ width: `${100 - i * 15}%` }}
                    ></div>
                ))}
            </div>

            {/* Footer */}
            <div className="flex gap-2 pt-2">
                <div className="h-9 bg-slate-700 rounded-lg flex-1"></div>
                <div className="h-9 bg-slate-700 rounded-lg flex-1"></div>
            </div>
        </div>
    );
};

/**
 * Table skeleton for data tables
 */
export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({
    rows = 5,
    cols = 4
}) => {
    return (
        <div className="bg-slate-800 rounded-2xl overflow-hidden animate-pulse">
            {/* Header */}
            <div className="bg-slate-900 p-4 flex gap-4">
                {Array.from({ length: cols }).map((_, i) => (
                    <div key={i} className="h-5 bg-slate-700 rounded flex-1"></div>
                ))}
            </div>

            {/* Rows */}
            <div className="divide-y divide-slate-700">
                {Array.from({ length: rows }).map((_, rowIndex) => (
                    <div key={rowIndex} className="p-4 flex gap-4">
                        {Array.from({ length: cols }).map((_, colIndex) => (
                            <div
                                key={colIndex}
                                className="h-4 bg-slate-700 rounded flex-1"
                            ></div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
};

/**
 * Modal skeleton for loading modal content
 */
export const ModalSkeleton: React.FC = () => {
    return (
        <div className="bg-midnight-900 rounded-3xl p-8 max-w-2xl w-full animate-pulse space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="h-8 bg-slate-700 rounded w-48"></div>
                <div className="h-10 w-10 bg-slate-700 rounded-full"></div>
            </div>

            {/* Content */}
            <div className="space-y-4">
                <div className="h-4 bg-slate-700 rounded w-full"></div>
                <div className="h-4 bg-slate-700 rounded w-5/6"></div>
                <div className="h-4 bg-slate-700 rounded w-4/6"></div>
            </div>

            {/* Footer buttons */}
            <div className="flex gap-3 pt-4">
                <div className="h-12 bg-slate-700 rounded-xl flex-1"></div>
                <div className="h-12 bg-slate-600 rounded-xl flex-1"></div>
            </div>
        </div>
    );
};
