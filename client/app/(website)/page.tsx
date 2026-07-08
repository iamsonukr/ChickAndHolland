import Image from "next/image";
import Link from "next/link";
import LazyHlsVideo from "@/components/custom/LazyHlsVideo";
import { CustomizedImage } from "@/components/custom/CustomizedImage";
import { Button } from "@/components/ui/button";
import HomeHeroVideo from "./HomeHeroVideo";
import HomepageShowcaseSlider from "./HomepageShowcaseSlider";
import TrendsCarousel from "./TrendsCarousel";

const BASE_HLS =
  "https://chicandholland-space.ams3.digitaloceanspaces.com/homepage/new-collection-videos";
const BASE_MP4 =
  "https://chicandholland-space.ams3.cdn.digitaloceanspaces.com/Homepage-videos";

const FEATURES = [
  {
    title: "Timeless Elegance",
    text: "Chic & Holland's aim is to design and create dresses that will never go out of style - something that our discerning customers will be able to enjoy and appreciate for many years to come.",
    href: "/product/1153",
    src: "https://chicandholland-space.ams3.cdn.digitaloceanspaces.com/ChangesJuly26/HomeContent/First-Section/0C4A8574%20copy.jpg",
    alt: "Timeless Elegance by Chic & Holland",
    reverse: false,
  },
  {
    title: "Truly Handmade",
    text: "We believe ourselves to be the guardians of this craft! In an age when everything is being made by machines, we chose to lovingly handcraft all of our garments at our own atelier.",
    href: "/product/1150",
    src: "https://chicandholland-space.ams3.cdn.digitaloceanspaces.com/ChangesJuly26/HomeContent/First-Section/0C4A6925%20copy.jpg",
    alt: "Truly Handmade craftsmanship by Chic & Holland",
    reverse: true,
  },
  {
    title: "Crystals & Embellishment",
    text: "One of our signature elements is our obsession with crystals. Each dress uses several types of crystals and beads, each using its own distinct language to communicate its purpose, accentuate a curve, and tell its own story.",
    href: "/product/1154",
    src: "https://chicandholland-space.ams3.cdn.digitaloceanspaces.com/ChangesJuly26/HomeContent/First-Section/0C4A8400%20copy.jpg",
    alt: "Crystals and embellishment details by Chic & Holland",
    reverse: false,
  },
];

const SLIDES = [
  {
    src: "https://chicandholland-space.ams3.cdn.digitaloceanspaces.com/ChangesJuly26/HomeContent/ROCOCO%20DREAMS%20PROM%20EDIT/0C4A0683%20copy.jpg",
    width: 1508,
    height: 2260,
  },
  {
    src: "https://chicandholland-space.ams3.cdn.digitaloceanspaces.com/ChangesJuly26/HomeContent/ROCOCO%20DREAMS%20PROM%20EDIT/0C4A0533%20copy.jpg",
    width: 2732,
    height: 4098,
  },
  {
    src: "https://chicandholland-space.ams3.cdn.digitaloceanspaces.com/ChangesJuly26/HomeContent/ROCOCO%20DREAMS%20PROM%20EDIT/0C4A0683%20copy.jpg",
    width: 2732,
    height: 4098,
  },
];

const COLLECTION_VIDEOS = [
  {
    videoSrc:
      "https://chicandholland-space.ams3.cdn.digitaloceanspaces.com/ChangesJuly26/HomeContent/ROCOCO%20DREAMS/9.mp4",
    posterSrc: "/homepage-section3-img/HF110423A-one-more-new.jpg",
    posterAlt: "Rococo Dreams couture collection look one",
  },
  {
    videoSrc:
      "https://chicandholland-space.ams3.cdn.digitaloceanspaces.com/ChangesJuly26/HomeContent/ROCOCO%20DREAMS/17.mp4",
    posterSrc: "/homepage-section3-img/HF110510A.jpg",
    posterAlt: "Rococo Dreams couture collection look two",
  },
  {
    videoSrc:
      "https://chicandholland-space.ams3.cdn.digitaloceanspaces.com/ChangesJuly26/HomeContent/ROCOCO%20DREAMS/4.mp4",
    posterSrc: "/homepage-section3-img/HF110529A.jpg",
    posterAlt: "Rococo Dreams couture collection look three",
  },
  {
    videoSrc:
      "https://chicandholland-space.ams3.cdn.digitaloceanspaces.com/ChangesJuly26/HomeContent/ROCOCO%20DREAMS/1.mp4",
    posterSrc: "/homepage-section3-img/HF110575.jpg",
    posterAlt: "Rococo Dreams couture collection look four",
  },
];

const FEATURE_IMAGE_SIZES = "(min-width: 768px) 33vw, 100vw";
const HALF_SECTION_IMAGE_SIZES = "(min-width: 768px) 50vw, 100vw";
const CAROUSEL_IMAGE_SIZES =
  "(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw";

const TEXT_SIZES =
  "text-2xl md:text-3xl 2xl:text-3xl 3xl:text-5xl 4xl:text-6xl";
const SUBTEXT_SIZES =
  "text-lg md:text-xl 2xl:text-xl 3xl:text-3xl 4xl:text-5xl";

export function SectionHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex flex-col items-center px-4 text-center">
      <h2 className={`font-adornstoryserif ${TEXT_SIZES}`}>{title}</h2>
      <p className={`font-mysi ${SUBTEXT_SIZES}`}>{subtitle}</p>
    </div>
  );
}

/**
 * Shared bordered CTA used across the Rococo Dreams sub-collection blocks
 * (Couture / Prom Edit / Evening Collection) — matches the outlined
 * "EXPLORE THE COLLECTION" button in the mock.
 */
function ExploreButton({
  href,
  label = "EXPLORE THE COLLECTION",
}: {
  href: string;
  label?: string;
}) {
  return (
    <Link href={href}>
      <button className="border border-[#b78674] px-6 py-3 text-[11px] uppercase tracking-widest text-[#b78674] transition-all duration-300 hover:bg-[#b78674] hover:text-white sm:px-10 sm:text-xs md:text-sm">
        {label}
      </button>
    </Link>
  );
}

/** Small decorative divider used under a few sections in the mock. */
function OrnamentDivider() {
  return (
    <div className="flex w-full justify-center py-6" aria-hidden="true">
      <span className="text-2xl tracking-[0.5em] text-[#b78674]/60">
        ⚜
      </span>
    </div>
  );
}

function FullscreenVideoSection({
  href,
  seq,
  linkText,
  posterSrc,
  posterAlt,
  className = "",
}: {
  href: string;
  seq: string;
  linkText: string;
  posterSrc: string;
  posterAlt: string;
  className?: string;
}) {
  return (
    <div className={`relative flex w-full flex-col gap-4 ${className}`}>
      <LazyHlsVideo
        src={`${BASE_HLS}/${seq}/hls/playlist.m3u8`}
        fallbackSrc={`${BASE_MP4}/${seq}.mp4`}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        controlsList="nodownload"
        posterSrc={posterSrc}
        posterAlt={posterAlt}
        imageSizes="100vw"
        rootMargin="250px"
        wrapperClassName="h-auto md:h-screen"
        className="m-0 h-full w-full object-cover p-0"
      />
      <Link
        href={href}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 text-xs text-white md:text-base 3xl:text-2xl 4xl:text-3xl"
      >
        {linkText}
      </Link>
    </div>
  );
}

export default function Home() {
  return (
    <div>
      {/* ───────────────────────── 1. HERO ─────────────────────────
          Mock: full-bleed chateau video with "ROCOCO DREAMS" title,
          "A MODERN COUTURE FAIRYTALE" subtitle, and a CTA link. */}
      <div className="w-full bg-black">
        <div className="relative h-auto md:h-screen">
          <HomeHeroVideo
            src="https://chicandholland-space.ams3.cdn.digitaloceanspaces.com/ChangesJuly26/HomeContent/HomeVideo.mp4"
            posterSrc="/Chic-Holland-HC-S26-037.jpg"
            posterAlt="Chic & Holland Rococo Dreams campaign"
          />
          <Link
            href="/collections/72/80"
            className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 text-xs uppercase tracking-widest text-white md:text-base 3xl:text-2xl 4xl:text-3xl"
          >
            VIEW THE COLLECTION
          </Link>
        </div>
      </div>

      {/* ───────────────── 2. FEATURES (Timeless Elegance / Truly
          Handmade / Crystals & Embellishment) — mock shows all three
          titles sitting above their image, no staggered/reverse layout. */}
      <div className="bg-muted py-8">
        <div className="container grid grid-cols-1 gap-8 sm:gap-6 md:grid-cols-3 md:gap-4">
          {FEATURES.map(({ title, text, href, src, alt, reverse }) => (
            <div
              key={title}
              className={`flex flex-col gap-4 sm:gap-8 ${reverse ? "md:flex-col-reverse" : ""}`}
            >
              <div className="space-y-2">
                <h2 className="text-center font-adornstoryserif text-lg uppercase tracking-wide text-[#b78674] sm:text-xl md:text-xl 2xl:text-2xl 3xl:text-5xl 4xl:py-2 4xl:text-5xl">
                  {title}
                </h2>
              </div>
              <Link href={href} className="block">
                <div className="relative aspect-[2/3] w-full overflow-hidden">
                  <CustomizedImage
                    src={src}
                    alt={alt}
                    fill
                    sizes={FEATURE_IMAGE_SIZES}
                    className="object-cover"
                    loading="eager"
                  />
                </div>
              </Link>
              <p className="px-2 text-center font-mysi text-base leading-5 text-muted-foreground sm:text-lg md:px-4 md:text-lg md:leading-5 2xl:px-1 2xl:text-xl 2xl:leading-5 3xl:px-7 3xl:text-4xl 3xl:!leading-[29px] 4xl:px-16 4xl:text-4xl 4xl:!leading-[27px]">
                {text}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ───────────────── 3. ROCOCO DREAMS framed intro copy + video ────────────────
          FIX: this block used to be a permanent flex-row, which crushed the
          frame + video into a tiny sliver on phones. Now stacks vertically
          below `lg`, and all the overlay text (previously fixed px sizes
          that didn't scale down) uses responsive clamps instead. */}
      <section className="w-full bg-[#f8f1ef] py-10 sm:py-16 lg:py-20">
        <div className="mx-auto flex max-w-[1500px] flex-col items-center justify-between gap-10 px-4 sm:px-8 lg:flex-row lg:gap-16 lg:px-20">

          {/* LEFT FRAME CONTENT */}
          <div className="relative flex w-full items-center justify-center lg:w-[68%]">
            <Image
              src="https://chicandholland-space.ams3.cdn.digitaloceanspaces.com/ChangesJuly26/HomeContent/frame.png"
              alt="Decorative Frame"
              width={1400}
              height={900}
              sizes="(min-width: 1024px) 68vw, 100vw"
              loading="eager"
              className="w-full max-w-[1000px] object-cover opacity-70"
            />

            <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center sm:px-6">
              <h2 className="font-serif text-2xl uppercase tracking-[3px] text-[#9f766b] sm:text-3xl sm:tracking-[5px] md:text-[42px] md:tracking-[6px]">
                Rococo Dreams
              </h2>

              <p className="mt-1 text-xs tracking-[2px] text-[#9f766b] sm:text-sm sm:tracking-[3px] md:text-[18px] md:tracking-[5px]">
                2026-27
              </p>

              <p className="mt-3 max-w-[280px] text-[11px] uppercase leading-[18px] tracking-[0.5px] text-[#a8847a] sm:max-w-[500px] sm:text-[12px] sm:leading-[20px] md:max-w-[680px] md:text-[14px] md:leading-[24px] md:tracking-[1px]">
                Rococo Dreams began with a dream of another era—one filled with pastel
                hues, ornate details, and effortless elegance.
              </p>

              <p className="mt-2 max-w-[280px] text-[11px] uppercase leading-[18px] tracking-[0.5px] text-[#a8847a] sm:max-w-[520px] sm:text-[12px] sm:leading-[20px] md:max-w-[720px] md:text-[14px] md:leading-[24px] md:tracking-[1px]">
                Inspired by the enchanting spirit of Rococo, this collection transforms
                its romance into modern couture through sculpted corsetry, intricate
                embellishment, and exceptional craftsmanship.
              </p>

              <h3 className="mt-3 font-serif text-base text-[#9f766b] sm:text-lg md:mt-4 md:text-[24px]">
                A modern couture fairytale
              </h3>

              <div className="mt-5 md:mt-7">
                <ExploreButton href="/collections/72/80" />
              </div>
            </div>
          </div>

          {/* RIGHT VIDEO */}
          <div className="flex w-full justify-center lg:w-[32%]">
            <div className="w-full max-w-[280px] sm:max-w-[340px] lg:max-w-[380px]">
              <LazyHlsVideo
                src={`${BASE_HLS}/Sequence%2s001_5/hls/playlist.m3u8`}
                fallbackSrc="https://chicandholland-space.ams3.cdn.digitaloceanspaces.com/ChangesJuly26/HomeContent/15.mov"
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                posterSrc="/section3-img/sec1.jpg"
                posterAlt="Rococo Dreams couture campaign video"
                imageSizes={HALF_SECTION_IMAGE_SIZES}
                rootMargin="250px"
                wrapperClassName="aspect-[3/5] w-full bg-black"
                className="h-full w-full object-cover"
              />
            </div>
          </div>

        </div>
      </section>

      {/* ───────────────── 4. EDITORIAL CAMPAIGN ──────────────── */}
      <div className="flex flex-col gap-4 bg-[#f8f4f2] py-8">
        <SectionHeader
          title="Editorial Campaign"
          subtitle="AS SEEN ON SOCIAL MEDIA"
        />
        <TrendsCarousel />
        <OrnamentDivider />
      </div>

      {/* ───────────────── 5. ROCOCO DREAMS COUTURE — 2026-27 ──────────────── */}
      <div className="flex flex-col gap-4 py-8">
        <SectionHeader title="Rococo Dreams Couture" subtitle="2026-27" />

        <div className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-2">
          {COLLECTION_VIDEOS.map(({ videoSrc, posterSrc, posterAlt }) => (
            <Link
              key={videoSrc}
              href="/collections/72/80"
              className="block h-full w-full"
            >
              <LazyHlsVideo
                src={videoSrc}
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                controlsList="nodownload"
                posterSrc={posterSrc}
                posterAlt={posterAlt}
                imageSizes={CAROUSEL_IMAGE_SIZES}
                rootMargin="250px"
                wrapperClassName="aspect-[2/3]"
                className="h-full w-full object-cover"
              />
            </Link>
          ))}
        </div>
        <p className="text-center font-mysi text-sm uppercase tracking-widest text-muted-foreground">
          A Modern Couture Fairytale
        </p>
      </div>

      {/* ───────────────── 6. ROCOCO DREAMS PROM EDIT — 2026-27 ──────────────── */}
      <div className="flex flex-col items-center gap-6 bg-[#f8f4f2] py-8">
        <div className="w-full max-w-6xl px-4">
          <HomepageShowcaseSlider slides={SLIDES} />
        </div>
        <ExploreButton href="/collections/92/96" />
        <OrnamentDivider />
      </div>

      {/* ───────────────── 7. ROCOCO DREAMS EVENING COLLECTION — 2026-27 ──────────────── */}
      <div className="flex flex-col items-center gap-6 py-8">
        <SectionHeader
          title="Rococo Dreams Evening Collection"
          subtitle="2026-27"
        />
        <div className="relative aspect-[16/9] w-full max-w-6xl overflow-hidden px-4 md:px-0">
          <Image
            src="https://chicandholland-space.ams3.cdn.digitaloceanspaces.com/ChangesJuly26/HomeContent/OneBigImage.png"
            alt="Rococo Dreams evening collection"
            fill
            sizes="(min-width: 1024px) 1152px, 100vw"
            className="object-cover"
            loading="eager"
          />
        </div>
        <ExploreButton href="/collections/73/97" />
      </div>

      {/* ───────────────── 8. FIND A STORE ──────────────── */}
      <div className="bg-muted py-8">
        <div className="container flex flex-col items-center gap-6 md:flex-row md:justify-between md:gap-28">
          <div className="w-full max-w-xs sm:max-w-sm md:max-w-none md:flex-1">
            <Link href="/product/1201" className="block">
              <div className="relative aspect-[2/3] w-full overflow-hidden">
                <video
                  src="https://chicandholland-space.ams3.cdn.digitaloceanspaces.com/ChangesJuly26/HomeContent/FindStore.mp4"
                  className="h-full w-full object-cover"
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  controlsList="nodownload"
                  aria-label="Chic & Holland find a store video"
                />
              </div>
            </Link>
          </div>
          <div className="flex flex-1 flex-col items-center justify-center gap-2 px-2">
            <h2 className="text-center font-adornstoryserif text-xl md:text-2xl 2xl:text-3xl 3xl:text-5xl 4xl:py-3 4xl:text-6xl">
              Find A Store
            </h2>
            <p className="text-center font-mysi text-sm text-muted-foreground sm:text-base md:px-5 md:text-lg md:leading-5 2xl:px-4 2xl:text-xl 3xl:text-4xl 4xl:px-6 4xl:text-4xl">
              Chic &amp; Holland is also available in many stores around the world
              and has more than 100 authorized retailers within 25 countries
              carrying the brand across Europe, USA, Canada, Australia, Mexico,
              Puerto Rico and UK.
            </p>
            <Link href="/find-a-store" className="4xl:py-4">
              <Button className="font-adornstoryserif md:mt-3 3xl:mt-4 3xl:text-lg 4xl:px-5 4xl:py-5 4xl:text-3xl">
                Find A Store
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* ───────────────── 9. DUBAI FASHION WEEK / SS26 "300 HOURS" ────────────────
          FIX: stacked overlay headings were too large/tight on small phones
          (three lines of big serif text over a limited-height banner).
          Sizes now step up more gradually from mobile → desktop. */}
      <div className="flex w-full flex-col items-center bg-white pb-4 pt-6">
        <h2 className="mb-4 px-4 text-center font-adornstoryserif text-xl uppercase tracking-[0.15em] text-[#b78674] sm:text-2xl md:text-4xl md:tracking-[0.2em]">
          Dubai Fashion Week
        </h2>
        <div className="relative w-[95%]">
          <Image
            src="/Chic-Holland-HC-S26-037.jpg"
            alt="SS26 Collection Banner"
            width={4098}
            height={2732}
            sizes="95vw"
            className="h-auto w-full"
            loading="eager"
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center px-3 text-center">
            <h2 className="font-adornstoryserif text-xl leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)] sm:text-2xl md:text-4xl lg:text-7xl xl:text-8xl">
              SS26 &quot;300 Hours&quot;
            </h2>
            <h3 className="mt-1 font-adornstoryserif text-base leading-tight drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)] sm:text-lg md:mt-2 md:text-2xl lg:text-5xl xl:text-6xl">
              Couture Collection
            </h3>
            <p className="mt-2 font-adornstoryserif text-xs tracking-wide opacity-95 drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)] sm:text-sm md:mt-4 md:text-xl lg:text-3xl xl:text-4xl">
              Unveiled at Dubai Fashion Week
            </p>
            <Link
              href="/collections/72/80"
              className="mt-3 px-4 py-2 text-[10px] uppercase tracking-widest text-white sm:text-xs md:mt-6 md:text-base"
            >
              VIEW THE COLLECTION
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}