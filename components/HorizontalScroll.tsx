// Horizontal Scroll with Smooth CSS Transform Animation
// Drag/Swipe: 1 card por vez | Botões: 3 cards por vez

import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface HorizontalScrollProps {
    children: React.ReactNode;
    itemWidth?: number;
    gap?: number;
    itemsPerPage?: number; // Quantos itens pular por clique nos botões (default: 3)
}

export const HorizontalScroll: React.FC<HorizontalScrollProps> = ({
    children,
    itemWidth = 320,
    gap = 24,
    itemsPerPage = 3
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [maxIndex, setMaxIndex] = useState(0);
    const [containerWidth, setContainerWidth] = useState(0);

    const childrenArray = React.Children.toArray(children);
    const totalItems = childrenArray.length;

    // Calculate dimensions on mount and resize
    useEffect(() => {
        const calculateDimensions = () => {
            if (containerRef.current) {
                const width = containerRef.current.offsetWidth;
                setContainerWidth(width);

                // Calculate how many items fit in view
                const visibleItems = Math.floor(width / (itemWidth + gap));
                const maxScrollIndex = Math.max(0, totalItems - visibleItems);
                setMaxIndex(maxScrollIndex);
            }
        };

        calculateDimensions();
        window.addEventListener('resize', calculateDimensions);
        return () => window.removeEventListener('resize', calculateDimensions);
    }, [totalItems, itemWidth, gap]);

    // Button navigation: skip by itemsPerPage (3 cards)
    const goToPrevious = () => {
        setCurrentIndex(prev => Math.max(0, prev - itemsPerPage));
    };

    const goToNext = () => {
        setCurrentIndex(prev => Math.min(maxIndex, prev + itemsPerPage));
    };

    // Calculate translateX based on current index
    const translateX = -(currentIndex * (itemWidth + gap));

    if (totalItems === 0) return <>{children}</>;

    // Touch/Drag support - moves 1 card at a time based on user gesture
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [dragOffset, setDragOffset] = useState(0);

    const handleDragStart = (clientX: number) => {
        setIsDragging(true);
        setStartX(clientX);
        setDragOffset(0);
    };

    const handleDragMove = (clientX: number) => {
        if (!isDragging) return;
        const delta = clientX - startX;
        setDragOffset(delta);
    };

    const handleDragEnd = () => {
        if (!isDragging) return;
        setIsDragging(false);

        // Snap to next/prev based on drag distance - moves 1 CARD at a time
        const threshold = (itemWidth + gap) / 4; // 25% of card width to trigger

        if (dragOffset > threshold) {
            // Dragged right = go to previous card (1 at a time)
            setCurrentIndex(prev => Math.max(0, prev - 1));
        } else if (dragOffset < -threshold) {
            // Dragged left = go to next card (1 at a time)
            setCurrentIndex(prev => Math.min(maxIndex, prev + 1));
        }
        setDragOffset(0);
    };

    return (
        <div className="space-y-6">
            {/* Container de Scroll */}
            <div
                ref={containerRef}
                className="relative overflow-hidden cursor-grab active:cursor-grabbing"
                onMouseDown={(e) => handleDragStart(e.clientX)}
                onMouseMove={(e) => handleDragMove(e.clientX)}
                onMouseUp={handleDragEnd}
                onMouseLeave={handleDragEnd}
                onTouchStart={(e) => handleDragStart(e.touches[0].clientX)}
                onTouchMove={(e) => handleDragMove(e.touches[0].clientX)}
                onTouchEnd={handleDragEnd}
            >
                {/* Container interno com transform animation */}
                <motion.div
                    className="flex select-none"
                    style={{ gap: `${gap}px` }}
                    animate={{
                        x: translateX + dragOffset
                    }}
                    transition={isDragging ? {
                        type: "tween",
                        duration: 0 // Immediate response while dragging
                    } : {
                        type: "spring",
                        stiffness: 400,
                        damping: 35,
                        mass: 0.8
                    }}
                >
                    {childrenArray.map((child, index) => (
                        <div
                            key={index}
                            className="flex-none"
                            style={{ width: `${itemWidth}px` }}
                        >
                            {child}
                        </div>
                    ))}
                </motion.div>
            </div>

            {/* Navigation Arrows - Skip 3 cards at a time */}
            {maxIndex > 0 && (
                <div className="flex items-center justify-center gap-4">
                    {/* Seta Esquerda */}
                    <motion.button
                        onClick={goToPrevious}
                        disabled={currentIndex === 0}
                        className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center border border-emerald-500/30"
                        aria-label="Anterior"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <ChevronLeft size={24} />
                    </motion.button>

                    {/* Progress dots */}
                    <div className="flex gap-1.5">
                        {Array.from({ length: Math.ceil(totalItems / itemsPerPage) }).map((_, idx) => {
                            const isActive = Math.floor(currentIndex / itemsPerPage) === idx;
                            return (
                                <div
                                    key={idx}
                                    className={`h-1.5 rounded-full transition-all duration-300 ${isActive
                                            ? 'w-6 bg-emerald-400'
                                            : 'w-1.5 bg-white/20'
                                        }`}
                                />
                            );
                        })}
                    </div>

                    {/* Seta Direita */}
                    <motion.button
                        onClick={goToNext}
                        disabled={currentIndex >= maxIndex}
                        className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center border border-emerald-500/30"
                        aria-label="Próximo"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <ChevronRight size={24} />
                    </motion.button>
                </div>
            )}
        </div>
    );
};
