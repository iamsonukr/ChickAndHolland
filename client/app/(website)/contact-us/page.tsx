"use client";

import type { Metadata } from "next";
import { useState, useEffect, useRef } from "react";
import ContactForm from "./Form";

const metadata: Metadata = {
  title: "Contact Us | Chic & Holland",
  description:
    "Get in touch with Chic & Holland for inquiries about our couture collections and fashion designs.",
};

const ContactUs = () => {
  const [isVisible, setIsVisible] = useState(true); // ✅ Start visible, never blank
  const [hasAnimated, setHasAnimated] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // ✅ If section is already in viewport on mount, mark animated
    if (sectionRef.current) {
      const rect = sectionRef.current.getBoundingClientRect();
      if (rect.top < window.innerHeight) {
        setHasAnimated(true);
        videoRef.current?.play().catch(() => {});
      }
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          videoRef.current?.play().catch(() => {});
        }
      },
      { threshold: 0, rootMargin: "-50px" } // ✅ Lower threshold
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // ✅ Use hasAnimated for the scroll-in animation class
  const animClass = hasAnimated
    ? "opacity-100 translate-y-0"
    : "opacity-0 translate-y-10";

  return (
    <div ref={sectionRef} className="luxury-contact-page min-h-screen bg-black py-16">
      <div className="luxury-background-elements">
        <div className="floating-orb orb-1"></div>
        <div className="floating-orb orb-2"></div>
        <div className="floating-orb orb-3"></div>
        <div className="grid-pattern"></div>
      </div>

      <div className="container mx-auto px-4">
        {/* Header */}
        <div className={`text-center mb-16 transition-all duration-1000 ${animClass}`}>
          <h1 className="font-adornstoryserif text-5xl md:text-7xl text-white mb-6 luxury-title">
            Contact Us
          </h1>
          <div className="w-24 h-0.5 bg-primary mx-auto luxury-line"></div>
        </div>

        {/* Cards */}
        <div className={`grid md:grid-cols-2 gap-8 mb-20 transition-all duration-1000 delay-300 ${animClass}`}>
          {/* Phone Card */}
          <div className="luxury-contact-card group">
            <div className="card-inner">
              <div className="card-icon">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <div className="card-content">
                <h3 className="card-title">Call Our Headquarters</h3>
                <p className="card-text">+31621422813</p>
                <p className="card-text">+33758609484</p>
              </div>
              <div className="card-shine"></div>
            </div>
          </div>

          {/* Email Card */}
          <div className="luxury-contact-card group">
            <div className="card-inner">
              <div className="card-icon">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="card-content">
                <h3 className="card-title">Email Enquiries</h3>
                <p className="card-email">
                  <a href="mailto:info@chicandholland.com" className="email-link">info@chicandholland.com</a>
                </p>
                <p className="card-email">
                  <a href="mailto:sales@chicandholland.com" className="email-link">sales@chicandholland.com</a>
                </p>
              </div>
              <div className="card-shine"></div>
            </div>
          </div>

          {/* Address Card */}
          <div className="luxury-contact-card group">
            <div className="card-inner">
              <div className="card-icon">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 11c1.656 0 3-1.346 3-3S13.656 5 12 5 9 6.346 9 8s1.344 3 3 3z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 20h-6.343A6.002 6.002 0 009 14V9a1 1 0 011-1h4a1 1 0 011 1v5a6.002 6.002 0 00-5.657 6H3" />
                </svg>
              </div>
              <div className="card-content">
                <h3 className="card-title">Office Address</h3>
                <p className="card-text">Jonkheer Carel Sternplein 33</p>
                <p className="card-text">2273 WZ Voorburg, Netherlands</p>
              </div>
              <div className="card-shine"></div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className={`flex flex-col-reverse gap-12 lg:gap-20 lg:flex-row lg:items-stretch transition-all duration-1000 delay-500 ${animClass}`}>
          {/* Video */}
          <div className="luxury-video-section w-full lg:flex-1">
            <div className="relative w-full h-[60vh] sm:h-[70vh] lg:h-full">
              <video
                ref={videoRef}
                src="https://chicandholland-space.ams3.cdn.digitaloceanspaces.com/IOS_Converted/Sequence%2001%206%20Ios-LossyC.mp4"
                autoPlay={true}
                muted={true}
                loop={true}
                playsInline={true}
                controlsList="nodownload"
                className="w-full h-full object-cover"
                webkit-playsinline="true"
              />
              <div className="video-overlay"></div>
              <div className="video-frame"></div>
            </div>
          </div>

          {/* Form */}
          <div className="luxury-form-section flex-1">
            <div className="form-header mb-8">
              <h2 className="font-adornstoryserif text-3xl md:text-4xl text-white mb-4">
                GET IN TOUCH WITH OUR TEAM
              </h2>
              <p className="text-gray-300 font-mysi text-lg">
                Let's create something extraordinary together. Our team is ready to assist you with any inquiries.
              </p>
            </div>
            <div className="form-container">
              <ContactForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;