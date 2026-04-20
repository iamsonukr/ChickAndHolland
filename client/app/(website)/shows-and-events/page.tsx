"use client";

import React, { useEffect, useRef, useState } from 'react';

export default function ShowsAndEvents() {
  const modalRef = useRef(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    // Touch device handling for flip cards
    if (typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints)) {
      const containers = document.querySelectorAll('.flip-container');
      containers.forEach(container => {
        container.addEventListener('click', () => {
          const card = container.querySelector('.flip-card');
          if (card) {
            card.style.transform = card.style.transform === 'rotateY(180deg)' ? 'rotateY(0deg)' : 'rotateY(180deg)';
          }
        });
      });
    }
  }, []);

  // Modal open/close handlers using State (React standard)
  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  return (
    <div className="bg-white text-gray-800 min-h-screen">
      <style>{`
        /* Global Font */
        @font-face { 
          // font-family: 'Adorn Story Serif'; 
          src: url('assets/fonts/AdornStorySerif-Regular.woff2') format('woff2'), url('assets/fonts/AdornStorySerif-Regular.woff') format('woff'); 
          font-weight: normal; 
          font-style: normal; 
          font-display: swap; 
        }
        .font-adornstoryserif { font-family: 'Adorn Story Serif', 'Playfair Display', serif; }

        /* Flip Card Styles */
        .flip-container { perspective: 1000px; }
        .flip-card { transition: transform 0.8s; transform-style: preserve-3d; position: relative; cursor: pointer; }
        .flip-card-front, .flip-card-back { backface-visibility: hidden; position: absolute; width: 100%; height: 100%; border-radius: 8px; overflow: hidden; }
        .flip-card-back { transform: rotateY(180deg); }
        .flip-container:hover .flip-card { transform: rotateY(180deg); }

        /* Fade in animation */
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in-up { animation: fadeInUp 0.5s ease-out forwards; }
      `}</style>

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mt-3 md:mt-0 text-black mb-4 font-adornstoryserif">Shows & Events</h1>
        <p className="text-center text-xl font-mysi text-black max-w-2xl mx-auto mb-12">
          Discover our upcoming fashion shows and events around the world. Hover over the cards to see preview images.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 ">

          {/* Germany */}
          <div className="flip-container animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <div className="flip-card h-64 md:h-80 lg:h-96 border border-gray-300 shadow-sm">
              <div className="flip-card-front bg-gray-100 flex flex-col items-center justify-center p-4">
                <i className="fas fa-landmark text-4xl mb-3 text-black" />
                <p className="text-xl font-adornstoryserif text-black font-bold uppercase tracking-wider">Germany</p>
              </div>
              <div className="flip-card-back p-14 relative bg-white">
                <img src="https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/shows-and-events/germany.jpg" alt="Germany Fashion Show" className="w-full h-full object-contain" />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 text-white text-left">
                  <h3 className="font-bold text-lg">European Fashion Week</h3>
                  <p className="text-sm">January 30 - February 2, 2026</p>
                </div>
              </div>
            </div>
          </div>

          {/* Barcelona */}
          <div className="flip-container animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="flip-card h-64 md:h-80 lg:h-96 border border-gray-300 shadow-sm">
              <div className="flip-card-front bg-gray-100 flex flex-col items-center justify-center p-4">
                <i className="fas fa-umbrella-beach text-4xl mb-3 text-black" />
                <p className="text-xl font-adornstoryserif text-black font-bold uppercase tracking-wider">Barcelona</p>
              </div>
              <div className="flip-card-back relative bg-white">
                <img src="https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/shows-and-events/image4.webp" alt="Barcelona Fashion Show" className="w-full h-full object-contain" />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 text-white text-left">
                  <h3 className="font-bold text-lg">Barcelona Bridal Fashion Week</h3>
                  <p className="text-sm">June 2-5, 2026</p>
                </div>
              </div>
            </div>
          </div>

          {/* USA */}
          <div className="flip-container animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <div className="flip-card h-64 md:h-80 lg:h-96 border border-gray-300 shadow-sm">
              <div className="flip-card-front bg-gray-100 flex flex-col items-center justify-center p-4">
                <i className="fas fa-flag-usa text-4xl mb-3 text-black" />
                <p className="text-xl font-adornstoryserif text-black font-bold uppercase tracking-wider">USA</p>
              </div>
              <div className="flip-card-back relative bg-white">
                <img src="https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/shows-and-events/image%20(1).png" alt="USA Fashion Show" className="w-full h-full object-contain" />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 text-white text-left">
                  <h3 className="font-bold text-lg">Atlanta Formal Market</h3>
                  <p className="text-sm">February 11-17, 2026</p>
                </div>
              </div>
            </div>
          </div>

          {/* Italy */}
          <div className="flip-container animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            <div className="flip-card h-64 md:h-80 lg:h-96 border border-gray-300 shadow-sm">
              <div className="flip-card-front bg-gray-100 flex flex-col items-center justify-center p-4">
                <i className="fa fa-solid fa-house text-4xl mb-3 text-black" />
                <p className="text-xl font-adornstoryserif text-black font-bold uppercase tracking-wider">Italy</p>
              </div>
              <div className="flip-card-back relative bg-white">
                <img src="https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/shows-and-events/image%20(2).png" alt="Italy Fashion Show" className="w-full h-full object-contain" />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 text-white text-left">
                  <h3 className="font-bold text-lg">Milan Fashion Week</h3>
                  <p className="text-sm">February 24 - March 2, 2026</p>
                </div>
              </div>
            </div>
          </div>

          {/* Harrogate */}
          <div className="flip-container animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
            <div className="flip-card h-64 md:h-80 lg:h-96 border border-gray-300 shadow-sm">
              <div className="flip-card-front bg-gray-100 flex flex-col items-center justify-center p-4">
                <i className="fas fa-crown text-4xl mb-3 text-black" />
                <p className="text-xl font-adornstoryserif text-black font-bold uppercase tracking-wider">Harrogate UK</p>
              </div>
              <div className="flip-card-back relative bg-white">
                <img src="https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/shows-and-events/image1.webp" alt="Harrogate Fashion Show" className="w-full h-full object-contain" />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 text-white text-left">
                  <h3 className="font-bold text-lg">Harrogate Fashion Week</h3>
                  <p className="text-sm">February 1-3, 2026</p>
                </div>
              </div>
            </div>
          </div>

          {/* Chicago */}
          <div className="flip-container animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
            <div className="flip-card h-64 md:h-80 lg:h-96 border border-gray-300 shadow-sm">
              <div className="flip-card-front bg-gray-100 flex flex-col items-center justify-center p-4">
                <i className="fas fa-city text-4xl mb-3 text-black" />
                <p className="text-xl font-adornstoryserif text-black font-bold uppercase tracking-wider">Chicago</p>
              </div>
              <div className="flip-card-back py-11 relative bg-white">
                <img src="https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/shows-and-events/image7.jpg" alt="Chicago Fashion Show" className="w-full h-full object-contain" />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 text-white text-left">
                  <h3 className="font-bold text-lg">National Bridal Market</h3>
                  <p className="text-sm">May 1-3, 2026</p>
                </div>
              </div>
            </div>
          </div>

        </div>

        <div className="text-center mt-12">
          <h2 className="text-2xl font-bold text-black mb-2 font-adornstoryserif">Join Us at Our Next Event</h2>
          <p className="text-black font-mysi text-[18px] max-w-2xl mx-auto mb-6">Experience the latest collections from Chic & Holland at fashion events around the world.</p>
          <button 
            onClick={openModal}
            className="bg-black text-white px-6 py-3 rounded-md hover:bg-gray-700 transition-colors uppercase tracking-widest text-sm"
          >
            Request an Invitation
          </button>
        </div>
      </div>

      {/* Invitation Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md animate-fade-in-up relative">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold font-adornstoryserif">Request an Invitation</h2>
              <button 
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-800 text-3xl leading-none"
              >
                &times;
              </button>
            </div>
            <form onSubmit={(e) => e.preventDefault()}>
              <div className="mb-4">
                <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input type="text" id="full_name" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 text-black" required />
              </div>
              <div className="mb-4">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input type="email" id="email" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 text-black" required />
              </div>
              <div className="mb-6">
                <label htmlFor="event" className="block text-sm font-medium text-gray-700 mb-1">Event of Interest</label>
                <select id="event" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 text-black" required>
                  <option value="">Please select an event...</option>
                  <option value="berlin">Berlin Fashion Week</option>
                  <option value="barcelona">080 Barcelona Fashion</option>
                  <option value="ny">New York Fashion Week</option>
                  <option value="milan">Milan Fashion Week</option>
                  <option value="harrogate">Harrogate Fashion Week</option>
                  <option value="chicago">Chicago Fashion Week</option>
                  <option value="all">All Events</option>
                </select>
              </div>
              <div>
                <button type="submit" className="w-full bg-black text-white px-6 py-3 rounded-md hover:bg-gray-700 transition-colors uppercase tracking-widest text-sm">
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}