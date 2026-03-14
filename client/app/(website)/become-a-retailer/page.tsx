"use client";

import { useState, useEffect, useRef } from "react";
import ContactForm from "../contact-us/Form";

const BecomeARetailer = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={sectionRef} className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative flex h-[45vh] sm:h-[55vh] md:h-[60vh] items-center justify-center overflow-hidden">
        <img
          src="https://chicandholland-space.ams3.cdn.digitaloceanspaces.com/latest-content/0C4A9275%20copy.jpg"
          alt="Chic & Holland Boutique"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40" />

        <div
          className={`relative z-10 text-center px-4 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <h1 className="font-adornstoryserif text-4xl sm:text-5xl md:text-6xl text-white mb-4">
            Become a Retailer
          </h1>
        </div>
      </section>

      {/* Main Content */}
      <div className="mx-auto max-w-6xl px-4 sm:px-8 md:px-12 lg:px-16 py-10 sm:py-14 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">

          {/* Left Side - Video */}
          <div
            className={`transition-all duration-700 delay-300 ${
              isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
            }`}
          >
            <div className="relative overflow-hidden rounded-sm aspect-[3/4] sm:aspect-[4/5] lg:aspect-auto lg:h-full min-h-[300px]">
              <video
                src="https://chicandholland-space.ams3.cdn.digitaloceanspaces.com/IOS_Converted/Sequence_04_1_ios.mp4"
                autoPlay
                muted
                loop
                playsInline
                className="h-full w-full object-cover"
              />
            </div>
          </div>

          {/* Right Side - Content & Form */}
          <div
            className={`transition-all duration-700 delay-500 ${
              isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
            }`}
          >
            {/* Welcome Text */}
            <div className="mb-6 sm:mb-8">
              <h2 className="font-adornstoryserif text-xl sm:text-2xl md:text-3xl text-black leading-snug mb-3">
                THANK YOU FOR YOUR INTEREST IN BECOMING A CHIC &amp; HOLLAND RETAILER!
              </h2>
              <div className="w-12 h-0.5 bg-black mb-5" />

              <p className="font-mysi text-lg sm:text-xl md:text-2xl leading-relaxed text-gray-700">
                We appreciate your interest in joining the Chic &amp; Holland retailer network!
                We are overjoyed to hear that you find our brand appealing and would like
                to carry the brand. To start the process of becoming a Chic &amp; Holland retailer,
                please send an email to{" "}
                <a
                  href="mailto:info@chicandholland.com"
                  className="underline hover:text-gray-500 transition-colors"
                >
                  info@chicandholland.com
                </a>
              </p>
            </div>

            {/* Application Form */}
            <div>
              <h2 className="text-lg sm:text-xl font-semibold tracking-wide text-black mb-1">
                Retailer Application Form
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                Complete the form below to begin your journey with Chic &amp; Holland
              </p>
              <ContactForm />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default BecomeARetailer;