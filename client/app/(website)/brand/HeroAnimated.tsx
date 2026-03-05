"use client";

import { useEffect, useRef } from "react";
import { CustomizedImage } from "@/components/custom/CustomizedImage";

export default function HeroAnimated() {
  const animatedRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTimeout(() => {
      animatedRef.current?.classList.add("animate-title");
      textRef.current?.classList.add("animate-text");
      imageRef.current?.classList.add("animate-image");
    }, 200);
  }, []);

  return (
    <section className="bg-black min-h-screen flex items-center justify-center py-10  overflow-hidden relative">
      {/* ✨ Floating Spark Particle Layer */}
      <div className="absolute inset-0 pointer-events-none particle-ambient"></div>

      <div
        ref={animatedRef}
        className="container mx-auto max-w-7xl grid md:grid-cols-2 gap-12 lg:gap-20 px-6"
      >
        {/* LEFT SIDE (Same as before) */}
        <div className="flex flex-col justify-center text-white space-y-4">
          <h1 className="font-adornstoryserif text-5xl md:text-5xl lg:text-5xl leading-[1.1] luxury-glow">
            FAIZA TALAT
          </h1>

          <div className="mt-2 h-[2px] w-[160px] bg-gradient-to-r from-transparent via-[#C9A39A] to-transparent opacity-90"></div>

          <p className="font-adornstoryserif text-lg md:text-2xl tracking-wide text-[#C9A39A]">
            FOUNDER & CREATIVE DIRECTOR
          </p>

          <div
            ref={textRef}
            className="opacity-0 translate-y-6 transition-all duration-700 ease-out"
          >
            <p className="animated-text-block font-adornstoryserif text-[19px] md:text-[21px] leading-[1.9] tracking-[0.4px] text-[#f2f2f2] max-w-[95%] mt-1 drop-shadow-[0_2px_6px_rgba(0,0,0,0.65)]">
              Faiza Talat founded{" "}
              <span className="text-[#C9A39A] font-semibold drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]">
                Chic & Holland
              </span>{" "}
              in 2015, realizing a childhood dream of bringing her vision of exquisitely
              crafted dresses to the world.
            </p>

            <p className="text-[18px] lg:text-[20px] text-[#e6e6e6] font-mysi leading-relaxed mt-4 drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]">
              Based in the Netherlands, Chic & Holland designs and manufactures luxurious,
              hand-crafted dresses for every special occasion in a woman’s life. Each
              collection is dedicated to the purity of couture — of color, texture and
              refined embellishment details.
            </p>
          </div>
        </div>

        {/* RIGHT IMAGE - UPDATED WITH YOUR HOVER DESIGN */}
        <div
          ref={imageRef}
          className="opacity-0 translate-x-10 transition-all duration-700 ease-out order-1 lg:order-2"
        >
          <div className="flex justify-center md:justify-end">
            <div className="relative group section-right">
              {/* Layered background effect */}
              <div className="absolute inset-0 bg-[#C9A39A]/20 rounded-2xl transform rotate-3 transition-transform duration-700 group-hover:rotate-6"></div>
              
              {/* Image Container with Reveal & Zoom */}
              <div className="relative overflow-hidden rounded-2xl shadow-2xl transform transition-all duration-700 ease-out group-hover:scale-105">
                <div className="image-reveal overflow-hidden rounded-2xl">
                  <CustomizedImage
                    src="/faiza-talat.jpg"
                    alt="Faiza Talat"
                    unoptimized
                    className="w-[260px] h-[360px] md:w-[440px] md:h-[560px] object-cover transform transition-transform duration-1000 ease-out"
                  />
                </div>
                {/* Gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 🔥 PREMIUM ANIMATIONS (Same as before) */}
      <style jsx>{`
        .animate-title {
          animation: fadeSlideDown 1.2s ease-out forwards,
            softZoom 1.4s ease-out forwards;
        }

        .animate-text {
          opacity: 1 !important;
          transform: translateY(0) !important;
        }

        .animate-image {
          animation: fadeSlideRight 1.3s ease-out forwards;
        }

        @keyframes fadeSlideDown {
          0% { opacity: 0; transform: translateY(-25px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        @keyframes fadeSlideRight {
          0% { opacity: 0; transform: translateX(45px); }
          100% { opacity: 1; transform: translateX(0); }
        }

        @keyframes softZoom {
          0% { transform: scale(0.96); }
          100% { transform: scale(1); }
        }

        .luxury-glow {
          background: linear-gradient(to right, #ffffff 0%, #c9a39a 50%, #ffffff 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          color: transparent;
          animation: shimmerRoll 4s linear infinite;
        }
        @keyframes shimmerRoll {
          from { background-position: 200% center; }
          to { background-position: -200% center; }
        }

        .particle-ambient::before {
          content: "";
          position: absolute;
          inset: 0;
          background-image: radial-gradient(circle at 20% 30%, rgba(201, 163, 154, 0.08) 0, transparent 45%);
          animation: particleFade 8s ease-in-out infinite alternate;
        }
        @keyframes particleFade {
          0% { opacity: 0.25; }
          100% { opacity: 0.45; }
        }
      `}</style>
    </section>
  );
}