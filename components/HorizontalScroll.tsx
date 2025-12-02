// Horizontal Scroll with Pagination
// Componente reutilizável para scroll horizontal com paginação numérica

import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface HorizontalScrollProps {
    children: React.ReactNode;
    itemWidth?: number;
    gap?: number;
    itemsPerPage?: number; // Quantos itens mostrar por vez
}

export const HorizontalScroll: React.FC<HorizontalScrollProps> = ({
    children,
    itemWidth = 288,
    gap = 24,
    itemsPerPage = 4
}) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const childrenArray = React.Children.toArray(children);
    const totalItems = childrenArray.length;

    useEffect(() => {
        const pages = Math.ceil(totalItems / itemsPerPage);
        setTotalPages(pages);
    }, [totalItems, itemsPerPage]);

    const scrollToPage = (page: number) => {
        if (!scrollRef.current || page < 1 || page > totalPages) return;

        const scrollAmount = (itemWidth + gap) * itemsPerPage * (page - 1);
        scrollRef.current.scrollTo({
            left: scrollAmount,
            behavior: 'smooth'
        });
        setCurrentPage(page);
    };

    const goToPrevious = () => {
        if (currentPage > 1) {
            scrollToPage(currentPage - 1);
        }
    };

    const goToNext = () => {
        if (currentPage < totalPages) {
            scrollToPage(currentPage + 1);
        }
    };

    // Renderizar números de página (máximo 5 visíveis)
    const renderPageNumbers = () => {
        const pages = [];
        let startPage = Math.max(1, currentPage - 2);
        let endPage = Math.min(totalPages, startPage + 4);

        // Ajustar se estiver no final
        if (endPage - startPage < 4) {
            startPage = Math.max(1, endPage - 4);
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(
                <button
                    key={i}
                    onClick={() => scrollToPage(i)}
                    className={`w-10 h-10 rounded-lg font-semibold transition-all ${i === currentPage
                        ? 'bg-emerald-500 text-white shadow-md'
                        : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                        }`}
                >
                    {i}
                </button>
            );
        }

        return pages;
    };

    if (totalItems === 0) return <>{children}</>;

    // Drag to scroll logic
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!scrollRef.current) return;
        setIsDragging(true);
        setStartX(e.pageX - scrollRef.current.offsetLeft);
        setScrollLeft(scrollRef.current.scrollLeft);
    };

    const handleMouseLeave = () => {
        setIsDragging(false);
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || !scrollRef.current) return;
        e.preventDefault();
        const x = e.pageX - scrollRef.current.offsetLeft;
        const walk = (x - startX) * 2; // Scroll speed multiplier
        scrollRef.current.scrollLeft = scrollLeft - walk;
    };

    return (
        <div className="space-y-6">
            {/* Container de Scroll */}
            <div
                ref={scrollRef}
                className="overflow-hidden cursor-grab active:cursor-grabbing"
                onMouseDown={handleMouseDown}
                onMouseLeave={handleMouseLeave}
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMove}
            >
                <div className="flex gap-6 select-none" style={{ scrollSnapType: isDragging ? 'none' : 'x mandatory' }}>
                    {children}
                </div>
            </div>

            {/* Paginação */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    {/* Seta Esquerda */}
                    <button
                        onClick={goToPrevious}
                        disabled={currentPage === 1}
                        className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        aria-label="Página anterior"
                    >
                        <ChevronLeft size={20} className="mx-auto" />
                    </button>

                    {/* Números de Página */}
                    {renderPageNumbers()}

                    {/* Seta Direita */}
                    <button
                        onClick={goToNext}
                        disabled={currentPage === totalPages}
                        className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        aria-label="Próxima página"
                    >
                        <ChevronRight size={20} className="mx-auto" />
                    </button>
                </div>
            )}
        </div>
    );
};

