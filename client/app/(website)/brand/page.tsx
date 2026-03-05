"use client";

import { CustomizedImage } from "@/components/custom/CustomizedImage";
import { getSponsors } from "@/lib/data";
import SponserImages from "./SponserImages";
import HeroAnimated from "./HeroAnimated";
import { useState, useEffect, useRef } from "react";

export default function BrandPage() {
  const sectionsRef = useRef<(HTMLDivElement | null)[]>([]);
  const imagesRef = useRef<(HTMLImageElement | null)[]>([]);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // State to store sponsor data (client-side)
  const [sponsor, setSponsor] = useState<any[]>([]);

  // Fetch sponsors on mount
  useEffect(() => {
    const fetchSponsors = async () => {
      const { sponsor } = await getSponsors({});
      setSponsor(sponsor);
    };
    fetchSponsors();
  }, []);

  // Animation Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-in");
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px",
      }
    );

    sectionsRef.current.forEach((section) => {
      if (section) observer.observe(section);
    });

    imagesRef.current.forEach((image) => {
      if (image) observer.observe(image);
    });

    if (videoRef.current) {
      videoRef.current
        .play()
        .catch(() => {
          if (videoRef.current) {
            videoRef.current.muted = true;
            videoRef.current.play();
          }
        });
    }

    return () => observer.disconnect();
  }, []);

  const addToSectionsRef = (el: HTMLDivElement | null) => {
    if (el && !sectionsRef.current.includes(el)) {
      sectionsRef.current.push(el);
    }
  };

  const addToImagesRef = (el: HTMLImageElement | null) => {
    if (el && !imagesRef.current.includes(el)) {
      imagesRef.current.push(el);
    }
  };

  return (
    <div className="bg-black text-white">
      {/* Hero Section */}
      <div>
        <div className="container max-w-6xl mx-auto relative flex flex-col justify-between gap-8 py-8 md:flex-row px-4">
          <div className="w-full">
            <HeroAnimated />
            <div className="flex flex-col items-center py-10 rounded-2xl bg-[#050505] shadow-xl">
              {/* Quote Icon */}
              <span className="text-6xl text-[#876355] mb-6 leading-none">❝</span>

              {/* Quote Text */}
              <p className="text-2xl md:text-2xl lg:text-2xl font-light italic text-gray-100 leading-snug text-center max-w-5xl mx-auto px-4">
                "Every dress tells a story of elegance, craftsmanship, and the dreams of the woman who wears it."
              </p>

              {/* Author */}
              <p className="font-adornstoryserif text-2xl text-[#C9A39A] 3xl:text-3xl 4xl:text-5xl">
                — Faiza Talat
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-black text-primary-foreground">
        <div className="container max-w-5xl mx-auto flex flex-col gap-12 py-12 px-4">
          {/* THE LABEL Section */}
          <div
            ref={addToSectionsRef}
            className="flex flex-col items-center gap-2 text-center opacity-0 translate-y-10 transition-all duration-700 ease-out"
          >
            <h2 className="font-adornstoryserif text-2xl text-[#C9A39A] 3xl:text-3xl 4xl:text-5xl">
              THE LABEL
            </h2>
            <div className="w-full md:w-[40%] opacity-0 scale-90 transition-all duration-800 ease-out">
              <CustomizedImage
                src="https://chicandholland-space.ams3.cdn.digitaloceanspaces.com/brand_page/CH%20Monogram_Rose%20Gold.png"
                alt="Choices"
                unoptimized
                ref={addToImagesRef}
              />
            </div>
            <p
              style={{ wordSpacing: "4px" }}
              className="max-w-6xl mx-auto text-lg md:text-xl text-gray-300 font-brandon tracking-wide leading-relaxed relative z-10 transform transition-all duration-1000"
            >
              Women's wear label headquartered in the Netherlands that
              creates, manufactures, and distributes hand-crafted, high-end
              gowns for special events. Chic{" "}
              <span className="font-adornstoryserif font-bold">&</span>{" "}
              Holland have more than 200 authorized retailers within 40
              countries.
            </p>
          </div>

          {/* CHOICES Section */}
          <div
            ref={addToSectionsRef}
            className="flex flex-col items-center gap-2 text-center opacity-0 translate-y-10 transition-all duration-700 ease-out"
          >
            <h2 className="font-adornstoryserif text-2xl text-[#C9A39A] 3xl:text-3xl 4xl:text-5xl">
              CHOICES
            </h2>
            <div className="w-full md:w-[40%] opacity-0 scale-90 transition-all duration-800 ease-out">
              <CustomizedImage
                src="https://chicandholland-space.ams3.cdn.digitaloceanspaces.com/brand_page/B406-38-PaperFinish.png"
                alt="Choices"
                unoptimized
                ref={addToImagesRef}
              />
            </div>
            <p
              style={{ wordSpacing: "4px" }}
              className="max-w-6xl mx-auto text-lg md:text-xl text-gray-300 font-brandon leading-relaxed relative z-10 transform transition-all duration-1000"
            >
              The captivating, delicate patterns of embellishment impose a
              breathtaking silhouette to the ineffable enchantment of hues
              in these handcrafted evening dresses. The label also has a
              bespoke range where you may create your own special day gown.
            </p>
          </div>

          {/* Image Grid */}
          <div
            ref={addToSectionsRef}
            className="grid grid-cols-1 gap-4 md:grid-cols-3 opacity-0 max-w-6xl mx-auto"
          >
            {[
              "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/Brand_New/image2.webp",
              "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/Brand_New/image3.webp",
              "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/Brand_New/image4.webp",
            ].map((src, index) => (
              <div
                key={index}
                className="opacity-0 translate-y-8 transition-all duration-600 ease-out"
                style={{ transitionDelay: `${index * 200}ms` }}
              >
                <CustomizedImage
                  src={src}
                  alt="Gallery image"
                  unoptimized
                  ref={addToImagesRef}
                  className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700 ease-out"
                />
              </div>
            ))}
          </div>

          {/* CRAFTMANSHIP Section */}
          <div
            ref={addToSectionsRef}
            className="flex flex-col items-center gap-2 text-center opacity-0 translate-y-10 transition-all duration-700 ease-out"
          >
            <h2 className="font-adornstoryserif text-4xl text-[#C9A39A] 3xl:text-3xl 4xl:text-5xl">
              CRAFTMANSHIP
            </h2>
            <p
              style={{ wordSpacing: "4px" }}
              className="max-w-6xl mx-auto text-lg md:text-xl text-gray-300 leading-relaxed font-brandon relative z-10 transform transition-all duration-1000"
            >
              Each Season one-of-a-kind design is created with special care
              at their own Atelier. A single silhouette can take up to
              hundreds of man-hours to complete, ensuring delivery within
              the time frame. The design team themselves seeks out the
              high-quality raw materials and the proper implementation of
              each design.
            </p>
          </div>

          {/* Video Section */}
          <div
            ref={addToSectionsRef}
            className="opacity-0 scale-95 transition-all duration-900 ease-out max-w-5xl mx-auto"
          >
            <video
              ref={videoRef}
              src="https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/Brand_New/chick&.mov"
              autoPlay
              muted
              loop
              playsInline
              controlsList="nodownload"
              className="m-0 h-full p-0 rounded-2xl shadow-2xl transform hover:scale-[1.02] transition-transform duration-700 ease-out"
            />
          </div>

          {/* OFFICIAL SPONSOR Section */}
          <div
            ref={addToSectionsRef}
            className="flex flex-col items-center gap-2 text-center opacity-0 translate-y-10 transition-all duration-700 ease-out"
          >
            <h2 className="font-adornstoryserif text-4xl mb-4 text-[#C9A39A] 3xl:text-3xl 4xl:text-5xl">
              OFFICIAL SPONSOR
            </h2>
            <p
              style={{ wordSpacing: "4px" }}
              className="w-full md:w-10/12 mx-auto text-lg md:text-xl font-brandon text-gray-300 relative z-10 transform transition-all duration-1000"
            >
              Chic <span className="font-adornstoryserif font-bold">&</span>{" "}
              Holland partnered with MISS WORLD NETHERLANDS and the MISS
              NETHERLANDS show to design gowns for participants and other
              celebrities.
            </p>
          </div>

          <div className="overflow-hidden mb-8 md:mb-12">
            <h3 className="text-center font-adornstoryserif pb-3 text-3xl md:text-4xl text-[#C9A39A] mb-4 transform transition-all duration-1000">
              Worn By Icons
              <span className="absolute bottom-0 left-1/2 h-[1.5px] w-40 -translate-x-1/2 bg-gradient-to-r from-transparent via-[#C9A39A] to-transparent"></span>
            </h3>
          </div>

          {/* Sponsors */}
          <div
            ref={addToSectionsRef}
            className="rounded-2xl overflow-hidden shadow-[0_0_15px_rgba(0,0,0,0.3)] floating-frame max-w-6xl mx-auto"
          >
            <SponserImages sponsor={sponsor} />
          </div>
        </div>
      </div>

      {/* DISCOVER THE AESTHETIC Sections */}
      <div className="space-y-12 py-8">
        <header className="pattern-bg py-16 md:py-12 mb-8 md:mb-10 text-center section-fade reveal-on-scroll rounded-3xl mx-4">
          <div className="overflow-hidden px-4">
            <h1 className="relative pb-3 font-adornstoryserif text-3xl md:text-5xl lg:text-6xl bg-gradient-to-r from-primary via-white to-primary bg-clip-text text-transparent transform transition-all duration-1000 leading-tight">
              DISCOVER THE AESTHETIC OF THE HOUSE
              <span className="absolute bottom-0 left-1/2 h-[1.5px] w-48 md:w-80 -translate-x-1/2 bg-gradient-to-r from-transparent via-[#C9A39A] to-transparent"></span>
            </h1>
          </div>
        </header>

        <div className="container max-w-6xl mx-auto space-y-24 bg-black text-white px-4">
          {/* WORLD Section */}
          <div
            ref={addToSectionsRef}
            className="flex flex-col gap-8 md:flex-row md:justify-between opacity-0"
          >
            <div className="md:w-[50%] opacity-0 -translate-x-10 transition-all duration-800 ease-out">
              <CustomizedImage
                src="https://chicandholland-space.ams3.cdn.digitaloceanspaces.com/brand_page/41749c84-03e6-4a9e-894a-ecdfde95f634.jpeg"
                alt="Chic & Holland - Brand page images"
                unoptimized
                ref={addToImagesRef}
                className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700 ease-out rounded-2xl"
              />
            </div>
            <div className="flex flex-col gap-2 md:w-[70%] md:justify-center">
              <h2 className="relative mb-10 pb-2 text-center font-adornstoryserif text-6xl text-[#C9A39A] 3xl:text-3xl 4xl:text-5xl opacity-0 translate-y-4 transition-all duration-600 ease-out animate-reveal">
                WORLD
                <span className="absolute bottom-0 left-1/2 h-[1.5px] w-40 -translate-x-1/2 bg-gradient-to-r from-transparent via-[#C9A39A] to-transparent"></span>
              </h2>
              {[
                "The Chic & Holland Design Team is at the core of the brand. They seek innovation, high-quality raw materials, and the proper implementation of each proposal., Each silhouette goes through multiple phases and includes a lot of fine details.",
                "The following sections make up the manufacturing process: Creative Design, Pattern Department, Sewing Unit, Handmade ornamentation Department, 1st Stage- Quality Control, End Stage, and Final Quality Control.",
                "In collaboration with the Sales and Production teams, the Design Department meticulously plans the design of every CHIC & HOLLAND Dress. All gowns are made in a specified and regulated manner, with care and love applied at all stages.",
              ].map((text, index) => (
                <p
                  key={index}
                  className="mx-auto max-w-[80%] text-left font-mysi leading-7 md:text-md 2xl:text-2xl 3xl:text-2xl 4xl:text-2xl text-white normal-case tracking-normal opacity-0 translate-y-6 transition-all duration-700 ease-out"
                  style={{ transitionDelay: `${300 + index * 150}ms` }}
                >
                  {text}
                </p>
              ))}
            </div>
          </div>

          {/* CLASSIC MEET CONTEMPORARY Section */}
          <div
            ref={addToSectionsRef}
            className="flex flex-col gap-8 md:flex-row md:justify-between opacity-0"
          >
            <div className="flex flex-col gap-4 md:w-[70%] md:justify-center order-2 md:order-1">
              <h2 className="relative mb-8 pb-4 text-center font-adornstoryserif text-4xl text-[#C9A39A] 3xl:text-3xl 4xl:text-5xl opacity-0 translate-y-4 transition-all duration-600 ease-out animate-reveal">
                CLASSIC MEET CONTEMPORARY
                <span className="absolute bottom-0 left-1/2 h-[1.5px] w-72 -translate-x-1/2 bg-gradient-to-r from-transparent via-[#C9A39A] to-transparent"></span>
              </h2>
              {[
                "A quick look through the Chic and Holland collections reveals gown after gown meant to make a woman feel like a tall glass of beauty. The collection's color palette, extravagant detailing, and neckline or décolletage decorations are what make it modern.",
                "Chic and Holland woman is tough, elegant and sophisticated. She knows what she wants and dresses for herself. She believes in timeless elegance which can be worn to any event rather than trendy pieces which will only last a season or two. She cares about the quality and attention to detail.",
              ].map((text, index) => (
                <p
                  key={index}
                  className="mx-auto max-w-[80%] text-left font-mysi text-base leading-7 md:text-md 2xl:text-2xl 3xl:text-2xl 4xl:text-2xl text-white normal-case tracking-normal font-premium-bold font-outline-bold opacity-0 translate-y-6 transition-all duration-700 ease-out"
                  style={{ transitionDelay: `${300 + index * 150}ms` }}
                >
                  {text}
                </p>
              ))}
            </div>
            <div className="md:w-[50%] opacity-0 translate-x-10 transition-all duration-800 ease-out order-1 md:order-2">
              <CustomizedImage
                src="https://chicandholland-space.ams3.cdn.digitaloceanspaces.com/brand_page/0C4A5447%20copy.jpg"
                alt="Chic & Holland - Brand page images"
                unoptimized
                ref={addToImagesRef}
                className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700 ease-out rounded-2xl"
              />
            </div>
          </div>

          {/* TIMELESS ELEGANCE Section */}
          <div
            ref={addToSectionsRef}
            className="flex flex-col gap-8 md:flex-row md:justify-between opacity-0"
          >
            <div className="md:w-[50%] opacity-0 -translate-x-10 transition-all duration-800 ease-out">
              <CustomizedImage
                src="https://chicandholland-space.ams3.cdn.digitaloceanspaces.com/brand_page/0C4A5809%20copy.jpg"
                alt="Chic & Holland - Brand page images"
                unoptimized
                ref={addToImagesRef}
                className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700 ease-out rounded-2xl"
              />
            </div>
            <div className="flex flex-col gap-4 md:w-[70%] md:justify-center">
              <h2 className="relative mb-8 pb-4 text-center font-adornstoryserif text-4xl text-[#C9A39A] 3xl:text-4xl 4xl:text-5xl opacity-0 translate-y-4 transition-all duration-600 ease-out animate-reveal">
                TIMELESS ELEGANCE
                <span className="absolute bottom-0 left-1/2 h-[1.5px] w-40 -translate-x-1/2 bg-gradient-to-r from-transparent via-[#C9A39A] to-transparent"></span>
              </h2>
              {[
                "Our aim at Chic & Holland is to design and make dresses that will never go out of fashion - something that our discerning customers will be able to enjoy and appreciate for many years to come. The colour palette, the modern fabrics, the extravagant detailing and the classic silhouette when used together lend a very contemporary air to our collections.",
                "The Chic & Holland woman is tough, elegant and sophisticated. She knows what she wants and dresses for herself! She appreciates the finer details and the effort that goes into a high-quality handmade garment.",
              ].map((text, index) => (
                <p
                  key={index}
                  className="mx-auto max-w-[80%] text-left font-mysi text-base leading-7 md:text-md 2xl:text-2xl 3xl:text-2xl 4xl:text-2xl text-white normal-case tracking-normal font-premium-bold font-outline-bold opacity-0 translate-y-6 transition-all duration-700 ease-out"
                  style={{ transitionDelay: `${300 + index * 150}ms` }}
                >
                  {text}
                </p>
              ))}
            </div>
          </div>

          {/* TRULY HANDMADE Section */}
          <div
            ref={addToSectionsRef}
            className="flex flex-col gap-8 md:flex-row md:justify-between opacity-0"
          >
            <div className="flex flex-col gap-4 md:w-[70%] md:justify-center order-2 md:order-1">
              <h2 className="relative mb-8 pb-4 text-center font-adornstoryserif text-4xl text-[#C9A39A] 3xl:text-4xl 4xl:text-5xl opacity-0 translate-y-4 transition-all duration-600 ease-out animate-reveal">
                TRULY HANDMADE
                <span className="absolute bottom-0 left-1/2 h-[1.5px] w-40 -translate-x-1/2 bg-gradient-to-r from-transparent via-[#C9A39A] to-transparent"></span>
              </h2>
              {[
                "We consider ourselves guardians of this craft! In a world where things are increasingly being made by machines, we choose to painstakingly make all of our dresses by hand, at our own atelier - something very few brands can truly claim. The craftsmen who've chosen to work with us have been engaged in this craft for decades which helps us maintain the highest quality, consistently.",
                "Our dresses can take hundreds of man-hours to produce, because we'd want nothing but the very best for our customers.",
              ].map((text, index) => (
                <p
                  key={index}
                  className="mx-auto max-w-[80%] text-left font-mysi text-base leading-7 md:text-md 2xl:text-2xl 3xl:text-2xl 4xl:text-2xl text-white normal-case tracking-normal font-premium-bold font-outline-bold opacity-0 translate-y-6 transition-all duration-700 ease-out"
                  style={{ transitionDelay: `${300 + index * 150}ms` }}
                >
                  {text}
                </p>
              ))}
            </div>
            <div className="md:w-[50%] opacity-0 translate-x-10 transition-all duration-800 ease-out order-1 md:order-2">
              <CustomizedImage
                src="https://chicandholland-space.ams3.cdn.digitaloceanspaces.com/brand_page/0C4A5674%20copy.jpg"
                alt="Chic & Holland - Brand page images"
                unoptimized
                ref={addToImagesRef}
                className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700 ease-out rounded-2xl"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Animations */}
      <style jsx>{`
        .animate-in {
          opacity: 1 !important;
          transform: translateY(0) !important;
          transform: translateX(0) !important;
          scale: 1 !important;
        }

        .animate-in .opacity-0 {
          opacity: 1 !important;
        }

        .animate-in .translate-y-4,
        .animate-in .translate-y-6,
        .animate-in .translate-y-8,
        .animate-in .translate-y-10 {
          transform: translateY(0) !important;
        }

        .animate-in .-translate-x-10,
        .animate-in .translate-x-10 {
          transform: translateX(0) !important;
        }

        .animate-in .scale-90,
        .animate-in .scale-95 {
          transform: scale(1) !important;
        }

        .transform {
          transition: transform 0.7s cubic-bezier(0.19, 1, 0.22, 1);
        }

        html {
          scroll-behavior: smooth;
        }

        .CustomizedImage {
          transition: all 0.5s ease-in-out;
        }

        .font-premium-bold {
          text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
        }
      `}</style>
    </div>
  );
}