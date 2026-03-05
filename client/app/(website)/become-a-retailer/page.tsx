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
    <div ref={sectionRef} className="luxury-retailer-page min-h-screen bg-white">
      {/* Hero Section */}
      <section className="luxury-hero-section relative flex h-[60vh] items-center justify-center overflow-hidden">
        <div className="hero-image-container">
          <img
            src="https://chicandholland-space.ams3.cdn.digitaloceanspaces.com/latest-content/0C4A9275%20copy.jpg"
            alt="Chic & Holland Boutique"
            className="hero-background-image"
          />
          <div className="hero-overlay"></div>
        </div>
        
        <div className={`hero-content text-center transition-all duration-700 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <h1 className="font-adornstoryserif text-5xl md:text-6xl text-white mb-4">
            Become a Retailer
          </h1>
          {/* <div className="w-20 h-0.5 bg-white mx-auto"></div> */}
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-25 py-16">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          
          {/* Left Side - Video */}
          <div className={`luxury-video-section transition-all duration-700 delay-300 ${
            isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'
          }`}>
            <div className="video-container">
              <video
                src="https://chicandholland-space.ams3.cdn.digitaloceanspaces.com/new-collection-videos/COUTURE/Sequence 04_1.mp4"
                autoPlay
                muted
                loop
                playsInline
                controlsList="nodownload"
                className="luxury-retailer-video"
              />
              <div className="video-overlay"></div>
            </div>
            
            {/* Quick Info */}
            {/* <div className="retailer-benefits mt-8">
              <div className="benefits-card">
                <h3 className="benefits-title">Why Partner With Us</h3>
                <ul className="benefits-list">
                  <li className="benefit-item">
                    <span className="benefit-bullet"></span>
                    Exclusive collections & premium designs
                  </li>
                  <li className="benefit-item">
                    <span className="benefit-bullet"></span>
                    Global network of 150+ retailers
                  </li>
                  <li className="benefit-item">
                    <span className="benefit-bullet"></span>
                    Comprehensive brand support
                  </li>
                  <li className="benefit-item">
                    <span className="benefit-bullet"></span>
                    Handcrafted quality assurance
                  </li>
                </ul>
              </div>
            </div> */}
          </div>

          {/* Right Side - Content & Form */}
          <div className={`luxury-content-section transition-all duration-700 delay-500 ${
            isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
          }`}>
            
            {/* Welcome Text */}
            <div className="content-card">
              <div className="content-header">
                <h2 className="content-main-title font-adornstoryserif">
                  THANK YOU FOR YOUR INTEREST IN BECOMING A CHIC & HOLLAND RETAILER!
                </h2>
                <div className="title-underline"></div>
              </div>
              
             <div className="font-mysi text-2xl">
  <p className="leading-relaxed">
    We appreciate your interest in joining the Chic & Holland retailer network! 
    We are overjoyed to hear that you find our brand appealing and would like 
    to carry the brand. To start the process of becoming a Chic & Holland retailer, 
    please send an email to{" "}
    <a 
      href="mailto:info@chicandholland.com" 
      className="luxury-email-link underline hover:text-gray-600 transition-colors"
    >
      info@chicandholland.com
    </a>.
  </p>
</div>

              {/* Application Form */}
              <div className="retailer-form-section">
                <div className="form-header">
                  <h2 className="form-title">
                    Retailer Application Form
                  </h2>
                  <p className="form-subtitle">
                    Complete the form below to begin your journey with Chic & Holland
                  </p>
                </div>
                
                <div className="form-container">
                  <ContactForm />
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default BecomeARetailer;