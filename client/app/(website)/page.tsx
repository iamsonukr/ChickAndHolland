"use client";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/autoplay";
import Link from "next/link";

import { CustomizedImage } from "@/components/custom/CustomizedImage";
import TrendsCarousel from "./TrendsCarousel";
import { Button } from "@/components/ui/button";
import HlsVideo from "@/components/custom/HlsVideo";

// ─── Constants ───────────────────────────────────────────
const BASE_HLS = "https://chicandholland-space.ams3.digitaloceanspaces.com/homepage/new-collection-videos";
const BASE_MP4 = "https://chicandholland-space.ams3.cdn.digitaloceanspaces.com/Homepage-videos";

const FEATURES = [
  {
    title: "Timeless Elegance",
    text: "Chic & Holland's aim is to design and create dresses that will never go out of style - something that our discerning customers will be able to enjoy and appreciate for many years to come.",
    href: "/product/1153",
    src: "https://chicandholland-space.ams3.cdn.digitaloceanspaces.com/homepage/0C4A5453%20copy.jpg",
    reverse: false,
  },
  {
    title: "Truly Handmade",
    text: "We believe ourselves to be the guardians of this craft! In an age when everything is being made by machines, we chose to lovingly handcraft all of our garments at our own atelier.",
    href: "/product/1150",
    src: "https://chicandholland-space.ams3.cdn.digitaloceanspaces.com/homepage/HF110537.jpg",
    reverse: true,
  },
  {
    title: "Crystals & Embellishment",
    text: "One of our signature elements is our obsession with crystals. Each dress uses several types of crystals and beads, each using its own distinct language to communicate its purpose, to accentuate a curve, to tell you its own story…",
    href: "/product/1154",
    src: "https://chicandholland-space.ams3.cdn.digitaloceanspaces.com/homepage/0C4A5674%20copy.jpg",
    reverse: false,
  },
];

const SLIDES = [
  "/homepage-section3-img/HF110423A-one-more-new.jpg",
  "/homepage-section3-img/HF110510A.jpg",
  "/homepage-section3-img/HF110529A.jpg",
  "/homepage-section3-img/HF110575.jpg",
  "/homepage-section3-img/PH12012A.jpg",
  "/homepage-section3-img/unnamed-img-new.jpg",
];

const COLLECTION_VIDEOS = ["Sequence%2005", "Sequence%2003", "Sequence%2002", "Sequence%2004"];

const TEXT_SIZES = "text-2xl md:text-3xl 2xl:text-3xl 3xl:text-5xl 4xl:text-6xl";
const SUBTEXT_SIZES = "text-lg md:text-xl 2xl:text-xl 3xl:text-3xl 4xl:text-5xl";

// ─── Sub-components ──────────────────────────────────────
function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex flex-col items-center">
      <h2 className={`font-adornstoryserif ${TEXT_SIZES}`}>{title}</h2>
      <p className={`font-mysi ${SUBTEXT_SIZES}`}>{subtitle}</p>
    </div>
  );
}

function FullscreenVideoSection({
  href, seq, linkText, className = "",
}: {
  href: string; seq: string; linkText: string; className?: string;
}) {
  return (
    <div className={`relative flex w-full flex-col gap-4 ${className}`}>
      <div className="h-auto md:h-screen">
        <HlsVideo
          src={`${BASE_HLS}/${seq}/hls/playlist.m3u8`}
          fallbackSrc={`${BASE_MP4}/${seq}.mp4`}
          autoPlay muted loop playsInline preload="auto"
          controlsList="nodownload"
          className="m-0 h-full w-full object-cover p-0"
          webkit-playsinline="true"  // ← Add this
        />
      </div>
      <Link
        href={href}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 text-xs text-white md:text-base 3xl:text-2xl 4xl:text-3xl"
      >
        {linkText}
      </Link>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────
export default function Home() {
  return (
    <div>

      {/* Hero Video */}
      <div className="w-full bg-black">
        <div className="relative h-auto md:h-screen">
          <HlsVideo
            src="https://chicandholland-space.ams3.cdn.digitaloceanspaces.com/Landingpagevideo/landingpage.mp4"
            fallbackSrc="https://chicandholland-space.ams3.cdn.digitaloceanspaces.com/Landingpagevideo/landingpage.mp4"
            autoPlay muted loop playsInline preload="auto"
            controlsList="nodownload"
            className="m-0 h-full w-full object-cover p-0"
            poster="/videos/first-video-poster.jpg"
          />
          <Link
            href="/collections/72/80"
            className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 text-xs text-white md:text-base 3xl:text-2xl 4xl:text-3xl"
          >
            VIEW THE COLLECTION
          </Link>
        </div>
      </div>

      {/* Features Grid */}
      <div className="bg-muted py-8">
        <div className="container grid grid-cols-1 gap-4 md:grid-cols-3">
          {FEATURES.map(({ title, text, href, src, reverse }) => (
            <div key={title} className={`flex flex-col gap-8 ${reverse ? "md:flex-col-reverse" : ""}`}>
              <div className="space-y-2">
                <h2 className="text-center font-adornstoryserif text-xl md:text-xl 2xl:text-2xl 3xl:text-5xl 4xl:py-2 4xl:text-5xl">
                  {title}
                </h2>
                <p className="px-2 text-center font-mysi text-lg leading-5 text-muted-foreground md:px-4 md:text-lg md:leading-5 2xl:px-1 2xl:text-xl 2xl:leading-5 3xl:px-7 3xl:text-4xl 3xl:!leading-[29px] 4xl:px-16 4xl:text-4xl 4xl:!leading-[27px]">
                  {text}
                </p>
              </div>
              <Link href={href}>
                <CustomizedImage src={src} loading="lazy" alt={`Chic & Holland – ${title}`} unoptimized />
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* SS26 Banner */}
      <div className="w-full bg-white flex justify-center pt-6 pb-4">
        <div className="relative w-[95%]">
          <img src="/Chic-Holland-HC-S26-037.jpg" alt="SS26 Collection Banner" className="w-full h-auto" />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white">
            <h2 className="font-adornstoryserif text-4xl md:text-7xl lg:text-8xl leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
              SS26 "300 Hours"
            </h2>
            <h3 className="font-adornstoryserif text-2xl md:text-5xl lg:text-6xl mt-2 leading-tight drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]">
              Couture Collection
            </h3>
            <p className="font-adornstoryserif text-xl md:text-3xl lg:text-4xl mt-4 opacity-95 tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
              Unveiled at Dubai Fashion Week
            </p>
          </div>
        </div>
      </div>

      {/* SS26 Description + Slider */}
      <div className="w-full flex flex-col items-center">
        <div className="max-w-4xl mx-auto text-center mb-12 px-4">
          <p className="bg-[#F3F4F6] px-10 py-14 text-center text-[14px] leading-2 text-gray-400 md:px-10 md:text-[16px] md:leading-10 2xl:px-14 2xl:text-[16px] 2xl:leading-6 3xl:px-20 3xl:!leading-[32px] 4xl:px-28 4xl:text-4xl 4xl:!leading-[40px] font-brandon">
            Chic & Holland unveiled its SS26 "300 Hours" couture collection at Dubai Fashion Week,
            celebrating a decade of craftsmanship and artistry. Each look showcased our signature
            hand-embellished detailing, sculpted silhouettes, and luxurious materials—brought to life
            by global muses on the runway. This milestone presentation marks our expansion into the
            Middle East and reflects our commitment to timeless couture created with passion, precision,
            and over 300 hours of dedicated craftsmanship.
          </p>
        </div>

        <div className="w-full max-w-6xl px-4">
          <Swiper
            modules={[Autoplay]}
            loop
            speed={700}
            autoplay={{ delay: 1500, disableOnInteraction: false }}
            breakpoints={{ 320: { slidesPerView: 1 }, 640: { slidesPerView: 2 }, 1024: { slidesPerView: 3 } }}
          >
            {SLIDES.map((src) => (
              <SwiperSlide key={src}>
                <div className="relative group overflow-hidden shadow-lg transition-all duration-500">
                  <img
                    src={src}
                    alt="SS26 collection"
                    className="w-full h-[580px] object-fill group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        <div className="mt-12 w-full border-t border-gray-700 pt-8 text-center">
          <p className="text-sm text-gray-500">Celebrating a Decade of Timeless Couture</p>
        </div>
      </div>

      {/* 300 Hours Text + Video */}
      <div className="py-8">
        <div className="flex w-full flex-col items-center gap-2 md:flex-row md:justify-between">
          <div className="w-full md:w-1/2">
            <div className="flex flex-col items-center justify-center bg-gray-100 px-4 py-2 md:px-5 md:py-4">
              <h2 className="mb-2 text-center font-adornstoryserif text-lg font-thin md:text-4xl 2xl:text-3xl 3xl:text-5xl 4xl:text-6xl">
                "300 HOURS"
              </h2>
              <p className="p-2 text-center font-brandon text-[11px] leading-[1.8] tracking-[0.08em] text-gray-700 md:w-full md:px-6 md:text-sm md:leading-[1.9] md:tracking-[0.1em] 2xl:text-base 2xl:leading-[2] 2xl:tracking-[0.12em] 3xl:px-6 3xl:text-2xl 3xl:leading-[1.8] 3xl:tracking-[0.1em] 4xl:px-14 4xl:text-3xl 4xl:leading-[1.9] 4xl:tracking-[0.1em]">
                TIME IS THE RAREST LUXURY—AND IN 300 HOURS, CHIC & HOLLAND CAPTURES, STITCHES, AND
                CRAFTS IT INTO WEARABLE ART. THIS COUTURE COLLECTION IS A HOMAGE TO THE SILENT HOURS
                BEHIND EVERY MASTERPIECE, WHERE HANDS WORK WITH REVERENCE, CRYSTALS ARE SEWN WITH
                PRECISION, AND EVERY BEAD IS A HEARTBEAT. EACH GOWN IS THE RESULT OF OVER 300 HOURS
                OF METICULOUS CRAFTSMANSHIP, WHERE NO DETAIL IS OVERLOOKED. DELICATE HAND-EMBROIDERY,
                LAYERED DRAPERY, SCULPTED BODICES, AND GLISTENING EMBELLISHMENTS COME TOGETHER IN
                HARMONY, CREATING SILHOUETTES THAT FEEL BOTH REGAL AND ETHEREAL. 300 HOURS IS MORE
                THAN A NUMBER—IT'S A PHILOSOPHY. IT IS A TESTAMENT TO THE ARTISANS WHO BRING THESE
                CREATIONS TO LIFE, AND TO THE WOMEN WHO WEAR THEM WITH GRACE, PURPOSE, AND QUIET POWER.
              </p>
            </div>
          </div>
          <div className="flex w-full items-center justify-center md:w-1/2">
            <HlsVideo
              src={`${BASE_HLS}/Sequence%2001_5/hls/playlist.m3u8`}
              fallbackSrc="https://chicandholland-space.ams3.digitaloceanspaces.com/Homepage-videos/Sequence%2001_5.mp4"
              autoPlay muted loop playsInline
              className="h-full w-full object-cover p-0 md:h-[30%] md:max-w-[50%]"
            />
          </div>
        </div>
      </div>

      {/* Couture Collection Videos */}
      <div className="flex flex-col gap-4 py-8">
        <SectionHeader title="300 HOURS" subtitle="COUTURE 2025/26" />
        <div className="flex flex-row">
          {COLLECTION_VIDEOS.map((seq) => (
            <Link key={seq} href="/collections/72/80" className="block h-full w-1/4">
              <HlsVideo
                src={`${BASE_HLS}/${seq}/hls/playlist.m3u8`}
                fallbackSrc={`${BASE_MP4}/${seq}.mp4`}
                autoPlay muted loop playsInline
                controlsList="nodownload"
                className="h-full w-full object-cover"
              />
            </Link>
          ))}
        </div>
      </div>

      {/* Editorial Campaign */}
      <div className="flex flex-col gap-4 py-8">
        <SectionHeader title="Editorial Campaign" subtitle="AS SEEN ON SOCIAL MEDIA" />
        <TrendsCarousel />
      </div>

      {/* Prom Video */}
      <div className="flex flex-col gap-4 py-8">
        <SectionHeader title="300 HOURS" subtitle="PROM 2025/26" />
        <FullscreenVideoSection
          href="/collections/92/82"
          seq="Sequence%2001_1"
          linkText="VIEW THE COLLECTION"
        />
      </div>

      {/* Find A Store */}
      <div className="bg-muted py-8">
        <div className="container flex flex-col items-center gap-4 md:flex-row md:justify-between md:gap-28">
          <div className="flex-1">
            <Link href="/product/1201">
              <CustomizedImage
                src="https://chicandholland-space.ams3.cdn.digitaloceanspaces.com/homepage/PH120116B.jpg"
                alt="Chic & Holland dress"
                loading="lazy"
                unoptimized
              />
            </Link>
          </div>
          <div className="flex flex-1 flex-col items-center justify-center gap-2">
            <h2 className="text-center font-adornstoryserif text-2xl md:text-2xl 2xl:text-3xl 3xl:text-5xl 4xl:py-3 4xl:text-6xl">
              Find A Nearest Store Now
            </h2>
            <p className="text-center font-mysi text-muted-foreground md:px-5 md:text-lg md:leading-5 2xl:px-4 2xl:text-xl 3xl:text-4xl 4xl:px-6 4xl:text-4xl">
              Chic & Holland is also available in many stores around the world and has more than 100
              authorized retailers within 25 countries carrying the brand across Europe, USA, Canada,
              Australia, Mexico, Puerto Rico and UK.
            </p>
            <Link href="/contact-us" className="4xl:py-4">
              <Button className="font-adornstoryserif md:mt-3 3xl:mt-4 3xl:text-lg 4xl:px-5 4xl:py-5 4xl:text-3xl">
                Contact Us
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Bridal Video */}
      <div className="flex flex-col gap-4 md:pt-5 2xl:pt-6 3xl:pt-7">
        <SectionHeader title="300 HOURS" subtitle="BRIDAL 2025/26" />
        <FullscreenVideoSection
          href="/collections/71/84"
          seq="Sequence%2001_4"
          linkText="VIEW THE COLLECTION"
        />
      </div>

    </div>
  );
}