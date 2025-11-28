'use client';

import { useState, useRef, useEffect } from 'react';

export default function SwipeMenu({ activeTab, onTabChange, isDark }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [translateX, setTranslateX] = useState(0);
  const containerRef = useRef(null);

  const tabs = [
    { id: 'messages', label: '💬 Chat', color: 'from-blue-400 to-blue-600', shortLabel: 'Chat' },
    { id: 'financial', label: '💰 Financial', color: 'from-green-400 to-green-600', shortLabel: 'Finance' },
    { id: 'planning', label: '✈️ Planning', color: 'from-purple-400 to-purple-600', shortLabel: 'Plan' },
  ];

  // Update index saat activeTab berubah
  useEffect(() => {
    const newIndex = tabs.findIndex(tab => tab.id === activeTab);
    setCurrentIndex(newIndex);
    setTranslateX(-newIndex * 100);
  }, [activeTab]);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.clientX);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const currentX = e.clientX;
    const diff = currentX - startX;
    const percentage = (diff / (containerRef.current?.offsetWidth || 1)) * 100;
    setTranslateX(-currentIndex * 100 + percentage);
  };

  const handleMouseUp = (e) => {
    if (!isDragging) return;
    setIsDragging(false);
    
    const currentX = e.clientX;
    const diff = currentX - startX;
    const threshold = 50;

    if (Math.abs(diff) > threshold) {
      if (diff > 0 && currentIndex > 0) {
        const newIndex = currentIndex - 1;
        setCurrentIndex(newIndex);
        onTabChange(tabs[newIndex].id);
        setTranslateX(-newIndex * 100);
      } else if (diff < 0 && currentIndex < tabs.length - 1) {
        const newIndex = currentIndex + 1;
        setCurrentIndex(newIndex);
        onTabChange(tabs[newIndex].id);
        setTranslateX(-newIndex * 100);
      } else {
        setTranslateX(-currentIndex * 100);
      }
    } else {
      setTranslateX(-currentIndex * 100);
    }
  };

  const handleTouchStart = (e) => {
    setIsDragging(true);
    setStartX(e.touches[0].clientX);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX;
    const percentage = (diff / (containerRef.current?.offsetWidth || 1)) * 100;
    setTranslateX(-currentIndex * 100 + percentage);
  };

  const handleTouchEnd = (e) => {
    if (!isDragging) return;
    setIsDragging(false);
    
    const currentX = e.changedTouches[0].clientX;
    const diff = currentX - startX;
    const threshold = 30;

    if (Math.abs(diff) > threshold) {
      if (diff > 0 && currentIndex > 0) {
        const newIndex = currentIndex - 1;
        setCurrentIndex(newIndex);
        onTabChange(tabs[newIndex].id);
        setTranslateX(-newIndex * 100);
      } else if (diff < 0 && currentIndex < tabs.length - 1) {
        const newIndex = currentIndex + 1;
        setCurrentIndex(newIndex);
        onTabChange(tabs[newIndex].id);
        setTranslateX(-newIndex * 100);
      } else {
        setTranslateX(-currentIndex * 100);
      }
    } else {
      setTranslateX(-currentIndex * 100);
    }
  };

  const handleNavigate = (direction) => {
    let newIndex = currentIndex;
    if (direction === 'left' && currentIndex > 0) {
      newIndex = currentIndex - 1;
    } else if (direction === 'right' && currentIndex < tabs.length - 1) {
      newIndex = currentIndex + 1;
    } else {
      return;
    }
    setCurrentIndex(newIndex);
    onTabChange(tabs[newIndex].id);
    setTranslateX(-newIndex * 100);
  };

  return (
    <div className={`w-full ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
      <div className="flex items-center justify-center gap-2 px-4 py-4 relative">
        {/* Left Arrow Button - Desktop Only */}
        <button
          onClick={() => handleNavigate('left')}
          disabled={currentIndex === 0}
          className={`hidden md:flex p-2 rounded-lg transition-all duration-300 absolute left-0 top-1/2 -translate-y-1/2 z-10 ${
            currentIndex === 0
              ? isDark ? 'bg-gray-800 text-gray-600 cursor-not-allowed' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : isDark ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-lg' : 'bg-blue-500 text-white hover:bg-blue-600 shadow-lg'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Menu Carousel */}
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="relative flex-1 overflow-hidden rounded-lg"
          style={{
            cursor: isDragging ? 'grabbing' : 'grab',
          }}
        >
          <div
            className="flex transition-transform"
            style={{
              transform: `translateX(${translateX}%)`,
              transitionDuration: isDragging ? '0ms' : '300ms',
              transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            {tabs.map((tab) => (
              <div
                key={tab.id}
                className="w-full flex-shrink-0 px-2 py-4 flex items-center justify-center pointer-events-none"
              >
                <div
                  className={`
                    w-full bg-gradient-to-r ${tab.color}
                    rounded-xl p-4 text-white shadow-lg
                    transform transition-transform duration-300
                    ${currentIndex === tabs.findIndex(t => t.id === tab.id) ? 'scale-100' : 'scale-95'}
                  `}
                >
                  <div className="text-center">
                    <div className="text-3xl mb-1">{tab.label.split(' ')[0]}</div>
                    <div className="text-sm font-semibold">{tab.shortLabel}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Arrow Button - Desktop Only */}
        <button
          onClick={() => handleNavigate('right')}
          disabled={currentIndex === tabs.length - 1}
          className={`hidden md:flex p-2 rounded-lg transition-all duration-300 absolute right-0 top-1/2 -translate-y-1/2 z-10 ${
            currentIndex === tabs.length - 1
              ? isDark ? 'bg-gray-800 text-gray-600 cursor-not-allowed' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : isDark ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-lg' : 'bg-blue-500 text-white hover:bg-blue-600 shadow-lg'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Indicators */}
      <div className="flex justify-center gap-2 pb-3">
        {tabs.map((tab, index) => (
          <button
            key={`indicator-${tab.id}`}
            onClick={() => {
              setCurrentIndex(index);
              onTabChange(tab.id);
              setTranslateX(-index * 100);
            }}
            className={`
              transition-all duration-300 rounded-full
              ${
                currentIndex === index
                  ? `w-3 h-3 ${isDark ? 'bg-blue-500' : 'bg-blue-600'}`
                  : `w-2 h-2 ${isDark ? 'bg-gray-600' : 'bg-gray-400'}`
              }
            `}
          />
        ))}
      </div>
    </div>
  );
}
