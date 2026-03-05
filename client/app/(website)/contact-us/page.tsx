// import ContactForm from "./Form";

// const ContactUs = () => {
//   return (
//     <div className="my-8 flex flex-col gap-8">
//       <h1 className="text-center text-3xl font-adornstoryserif">Contact us</h1>

//       <div className="bg-muted py-6 text-primary">
//         <div className="container space-y-6">
//           <div>
//             <p className="font-bold">Call Our Headquarters</p>
//             <p className="font-bold">+31621422813, +33758609484</p>
//           </div>
//           <div>
//             <p className="font-bold">
//               General Enquiries:{" "}
//               <a
//                 href="mailto:info@chicandholland.com"
//                 className="text-blue-500"
//               >
//                 info@chicandholland.com
//               </a>
//             </p>
//             <p className="font-bold">
//               Sales Enquiries:{" "}
//               <a
//                 href="mailto:sales@chicandholland.com"
//                 className="text-blue-500"
//               >
//                 sales@chicandholland.com
//               </a>
//             </p>
//           </div>
//         </div>
//       </div>

//       <div className="flex flex-col-reverse gap-8 px-8 md:flex-row">
//         <div className="h-[800px] flex-1">
//           <video
//             src="https://chicandholland-space.ams3.cdn.digitaloceanspaces.com/new-collection-videos/COUTURE/Sequence 01_6.mp4"
//             autoPlay={true}
//             muted={true}
//             loop={true}
//             playsInline={true}
//             controlsList="nodownload"
//             className="m-0 h-full w-full object-cover object-center p-0"
//           ></video>
//         </div>
//         <div className="flex flex-1 flex-col justify-center gap-4">
//           <h2 className="text-2xl">GET IN TOUCH WITH OUR TEAM</h2>

//           <ContactForm />
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ContactUs;

"use client";

import { useState, useEffect, useRef } from "react";
import ContactForm from "./Form";

const ContactUs = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (videoRef.current) {
            videoRef.current.play().catch(() => {});
          }
        }
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div 
      ref={sectionRef}
      className="luxury-contact-page min-h-screen bg-black py-16"
    >
      {/* Animated Background Elements */}
      <div className="luxury-background-elements">
        <div className="floating-orb orb-1"></div>
        <div className="floating-orb orb-2"></div>
        <div className="floating-orb orb-3"></div>
        <div className="grid-pattern"></div>
      </div>

      <div className="container mx-auto px-4">
        {/* Enhanced Header */}
        <div className={`text-center mb-16 transition-all duration-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          <h1 className="font-adornstoryserif text-5xl md:text-7xl text-white mb-6 luxury-title">
            Contact Us
          </h1>
          <div className="w-24 h-0.5 bg-primary mx-auto luxury-line"></div>
        </div>

        {/* Contact Information Cards */}
        <div className={`grid md:grid-cols-2 gap-8 mb-20 transition-all duration-1000 delay-300 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
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
                  <a href="mailto:info@chicandholland.com" className="email-link">
                    info@chicandholland.com
                  </a>
                </p>
                <p className="card-email">
                  <a href="mailto:sales@chicandholland.com" className="email-link">
                    sales@chicandholland.com
                  </a>
                </p>
              </div>
              <div className="card-shine"></div>
            </div>
          </div>
        </div>

        {/* Main Content Section */}
        <div className={`flex flex-col-reverse gap-12 lg:gap-20 lg:flex-row items-center transition-all duration-1000 delay-500 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          {/* Video Section */}
          <div className="luxury-video-section flex-1 w-full">
            <div className="video-container">
              <video
                ref={videoRef}
                src="https://chicandholland-space.ams3.cdn.digitaloceanspaces.com/new-collection-videos/COUTURE/Sequence 01_6.mp4"
                autoPlay={true}
                muted={true}
                loop={true}
                playsInline={true}
                controlsList="nodownload"
                className="luxury-contact-video"
              />
              <div className="video-overlay"></div>
              <div className="video-frame"></div>
            </div>
          </div>

          {/* Form Section */}
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