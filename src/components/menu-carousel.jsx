'use client';

import { useState, useRef, useEffect } from 'react';

export default function MenuCarousel({ activeTab, onTabChange, isDark }) {
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const carouselRef = useRef(null);

  const tabs = [
    { id: 'messages', label: '💬 Chat', color: 'from-blue-500 to-blue-600' },
    { id: 'financial', label: '💰 Financial', color: 'from-green-500 to-green-600' },
    { id: 'planning', label: '✈️ Planning', color: 'from-purple-500 to-purple-600' },
  ];

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX - carouselRef.current.offsetLeft);
    setScrollLeft(carouselRef.current.scrollLeft);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;

    e.preventDefault();
    const x = e.pageX - carouselRef.current.offsetLeft;
    const walk = (x - startX) * 1; // Scroll-fast
    carouselRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleTouchStart = (e) => {
    setIsDragging(true);
    setStartX(e.touches[0].pageX - carouselRef.current.offsetLeft);
    setScrollLeft(carouselRef.current.scrollLeft);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;

    const x = e.touches[0].pageX - carouselRef.current.offsetLeft;
    const walk = (x - startX) * 1;
    carouselRef.current.scrollLeft = scrollLeft - walk;
  };

  useEffect(() => {
    const carousel = carouselRef.current;
    if (carousel) {
      carousel.addEventListener('mousemove', handleMouseMove);
      carousel.addEventListener('mouseup', handleMouseUp);
      carousel.addEventListener('mouseleave', handleMouseUp);
      carousel.addEventListener('touchmove', handleTouchMove);
      carousel.addEventListener('touchend', handleMouseUp);

      return () => {
        carousel.removeEventListener('mousemove', handleMouseMove);
        carousel.removeEventListener('mouseup', handleMouseUp);
        carousel.removeEventListener('mouseleave', handleMouseUp);
        carousel.removeEventListener('touchmove', handleTouchMove);
        carousel.removeEventListener('touchend', handleMouseUp);
      };
    }
  }, [isDragging, startX, scrollLeft]);

  return (
    <div className={`w-full ${isDark ? 'bg-gray-900' : 'bg-white'} rounded-lg p-4 mb-4`}>
      <div
        ref={carouselRef}
        onMouseDown={handleMouseDown}
        className={`
          flex gap-3 overflow-x-auto scroll-smooth select-none cursor-grab active:cursor-grabbing
          ${isDark ? 'scrollbar-dark' : 'scrollbar-light'}
        `}
        style={{
          scrollBehavior: 'smooth',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {tabs.map((tab) => (
          <div
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              flex-shrink-0 min-w-max px-6 py-3 rounded-full font-semibold
              transition-all duration-300 cursor-pointer
              ${
                activeTab === tab.id
                  ? `bg-gradient-to-r ${tab.color} text-white shadow-lg scale-105`
                  : `${isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-200 text-gray-700'}
                    hover:${isDark ? 'bg-gray-700' : 'bg-gray-300'} shadow-md`
              }
            `}
          >
            {tab.label}
          </div>
        ))}
      </div>

      {/* Scroll Indicators */}
      <div className="flex justify-center gap-2 mt-3">
        {tabs.map((tab) => (
          <div
            key={`indicator-${tab.id}`}
            className={`
              h-2 rounded-full transition-all duration-300
              ${
                activeTab === tab.id
                  ? `w-6 ${isDark ? 'bg-blue-500' : 'bg-blue-600'}`
                  : `w-2 ${isDark ? 'bg-gray-600' : 'bg-gray-400'}`
              }
            `}
          />
        ))}
      </div>

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .scrollbar-light::-webkit-scrollbar {
          height: 6px;
        }
        .scrollbar-light::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .scrollbar-light::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 10px;
        }
        .scrollbar-light::-webkit-scrollbar-thumb:hover {
          background: #555;
        }

        .scrollbar-dark::-webkit-scrollbar {
          height: 6px;
        }
        .scrollbar-dark::-webkit-scrollbar-track {
          background: #1f2937;
          border-radius: 10px;
        }
        .scrollbar-dark::-webkit-scrollbar-thumb {
          background: #6b7280;
          border-radius: 10px;
        }
        .scrollbar-dark::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
      `}</style>
    </div>
  );
}
