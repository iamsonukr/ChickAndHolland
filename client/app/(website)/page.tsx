import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import LazyHlsVideo from "@/components/custom/LazyHlsVideo";
import { CustomizedImage } from "@/components/custom/CustomizedImage";
import { Button } from "@/components/ui/button";
import HomeHeroVideo from "./HomeHeroVideo";

const BASE_HLS =
  "https://chicandholland-space.ams3.digitaloceanspaces.com/homepage/new-collection-videos";
const BASE_MP4 =
  "https://chicandholland-space.ams3.cdn.digitaloceanspaces.com/Homepage-videos";

const FEATURES = [
  {
    title: "Timeless Elegance",
    text: "Chic & Holland's aim is to design and create dresses that will never go out of style - something that our discerning customers will be able to enjoy and appreciate for many years to come.",
    href: "/product/1153",
    src: "https://chicandholland-space.ams3.cdn.digitaloceanspaces.com/homepage/LossyCompressed/0C4A5453%20copy-LossyCompres.jpg",
    alt: "Timeless Elegance by Chic & Holland",
    reverse: false,
  },
  {
    title: "Truly Handmade",
    text: "We believe ourselves to be the guardians of this craft! In an age when everything is being made by machines, we chose to lovingly handcraft all of our garments at our own atelier.",
    href: "/product/1150",
    src: "https://chicandholland-space.ams3.cdn.digitaloceanspaces.com/homepage/LossyCompressed/HF110537-LossyCompres.jpg",
    alt: "Truly Handmade craftsmanship by Chic & Holland",
    reverse: true,
  },
  {
    title: "Crystals & Embellishment",
    text: "One of our signature elements is our obsession with crystals. Each dress uses several types of crystals and beads, each using its own distinct language to communicate its purpose, accentuate a curve, and tell its own story.",
    href: "/product/1154",
    src: "https://chicandholland-space.ams3.cdn.digitaloceanspaces.com/homepage/LossyCompressed/0C4A5674%20copy-LossyCompres.jpg",
    alt: "Crystals and embellishment details by Chic & Holland",
    reverse: false,
  },
];

const SLIDES = [
  {
    src: "/homepage-section3-img/HF110423A-one-more-new.jpg",
    width: 1508,
    height: 2260,
  },
  { src: "/homepage-section3-img/HF110510A.jpg", width: 2732, height: 4098 },
  { src: "/homepage-section3-img/HF110529A.jpg", width: 2732, height: 4098 },
  { src: "/homepage-section3-img/HF110575.jpg", width: 2732, height: 4098 },
  { src: "/homepage-section3-img/PH12012A.jpg", width: 2732, height: 4098 },
  {
    src: "/homepage-section3-img/unnamed-img-new.jpg",
    width: 754,
    height: 1130,
  },
];

const COLLECTION_VIDEOS = [
  {
    seq: "Sequence%2005",
    posterSrc: "/homepage-section3-img/HF110423A-one-more-new.jpg",
    posterAlt: "300 Hours couture collection look one",
  },
  {
    seq: "Sequence%2003",
    posterSrc: "/homepage-section3-img/HF110510A.jpg",
    posterAlt: "300 Hours couture collection look two",
  },
  {
    seq: "Sequence%2002",
    posterSrc: "/homepage-section3-img/HF110529A.jpg",
    posterAlt: "300 Hours couture collection look three",
  },
  {
    seq: "Sequence%2004",
    posterSrc: "/homepage-section3-img/HF110575.jpg",
    posterAlt: "300 Hours couture collection look four",
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

function MediaGridSkeleton({
  itemCount,
  columnsClassName,
}: {
  itemCount: number;
  columnsClassName: string;
}) {
  return (
    <div className={cn("grid gap-4 px-4", columnsClassName)}>
      {Array.from({ length: itemCount }).map((_, index) => (
        <div
          key={index}
          className="aspect-[2/3] animate-pulse rounded-md bg-gray-200"
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

const HomepageShowcaseSlider = dynamic(() => import("./HomepageShowcaseSlider"), {
  loading: () => (
    <div className="w-full max-w-6xl">
      <MediaGridSkeleton
        itemCount={3}
        columnsClassName="grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
      />
    </div>
  ),
});

const TrendsCarousel = dynamic(() => import("./TrendsCarousel"), {
  loading: () => (
    <MediaGridSkeleton
      itemCount={4}
      columnsClassName="grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
    />
  ),
});

function SectionHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex flex-col items-center">
      <h2 className={`font-adornstoryserif ${TEXT_SIZES}`}>{title}</h2>
      <p className={`font-mysi ${SUBTEXT_SIZES}`}>{subtitle}</p>
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
      <div className="w-full bg-black">
        <div className="relative h-auto md:h-screen">
          <HomeHeroVideo
            src="https://chicandholland-space.ams3.cdn.digitaloceanspaces.com/Landingpagevideo/newchic-video.mp4"
            posterSrc="/Chic-Holland-HC-S26-037.jpg"
            posterAlt="Chic & Holland couture campaign"
          />
          <Link
            href="/collections/72/80"
            className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 text-xs text-white md:text-base 3xl:text-2xl 4xl:text-3xl"
          >
            VIEW THE COLLECTION
          </Link>
        </div>
      </div>

      <div className="bg-muted py-8">
        <div className="container grid grid-cols-1 gap-4 md:grid-cols-3">
          {FEATURES.map(({ title, text, href, src, alt, reverse }) => (
            <div
              key={title}
              className={`flex flex-col gap-8 ${reverse ? "md:flex-col-reverse" : ""}`}
            >
              <div className="space-y-2">
                <h2 className="text-center font-adornstoryserif text-xl md:text-xl 2xl:text-2xl 3xl:text-5xl 4xl:py-2 4xl:text-5xl">
                  {title}
                </h2>
                <p className="px-2 text-center font-mysi text-lg leading-5 text-muted-foreground md:px-4 md:text-lg md:leading-5 2xl:px-1 2xl:text-xl 2xl:leading-5 3xl:px-7 3xl:text-4xl 3xl:!leading-[29px] 4xl:px-16 4xl:text-4xl 4xl:!leading-[27px]">
                  {text}
                </p>
              </div>
              <Link href={href} className="block">
                <div className="relative aspect-[2/3] w-full overflow-hidden">
                  <CustomizedImage
                    src={src}
                    alt={alt}
                    fill
                    sizes={FEATURE_IMAGE_SIZES}
                    className="object-cover"
                    loading="lazy"
                  />
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>

      <div className="flex w-full justify-center bg-white pb-4 pt-6">
        <div className="relative w-[95%]">
          <Image
            src="/Chic-Holland-HC-S26-037.jpg"
            alt="SS26 Collection Banner"
            width={4098}
            height={2732}
            sizes="95vw"
            className="h-auto w-full"
            loading="lazy"
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white">
            <h2 className="font-adornstoryserif text-4xl leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)] md:text-7xl lg:text-8xl">
              SS26 &quot;300 Hours&quot;
            </h2>
            <h3 className="mt-2 font-adornstoryserif text-2xl leading-tight drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)] md:text-5xl lg:text-6xl">
              Couture Collection
            </h3>
            <p className="mt-4 font-adornstoryserif text-xl tracking-wide opacity-95 drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)] md:text-3xl lg:text-4xl">
              Unveiled at Dubai Fashion Week
            </p>
          </div>
        </div>
      </div>

      <div className="flex w-full flex-col items-center">
        <div className="mx-auto mb-12 max-w-4xl px-4 text-center">
          <div className="bg-[#F3F4F6] px-10 py-14 text-center font-brandon text-[14px] text-gray-400 md:px-10 md:text-[16px] md:leading-10 2xl:px-14 2xl:text-[16px] 2xl:leading-6 3xl:px-20 3xl:!leading-[32px] 4xl:px-28 4xl:text-4xl 4xl:!leading-[40px]">
            <p>
              <span className="inline-block">Chic &amp; Holland</span> unveiled
              its SS26 &quot;300 Hours&quot; couture collection at Dubai Fashion
              Week, celebrating a decade of craftsmanship and artistry. Each
              look showcased our signature hand-embellished detailing, sculpted
              silhouettes, and luxurious materials brought to life by global
              muses on the runway. This milestone presentation marks our
              expansion into the Middle East and reflects our commitment to
              timeless couture created with passion, precision, and over 300
              hours of dedicated craftsmanship.
            </p>
          </div>
        </div>

        <HomepageShowcaseSlider slides={SLIDES} />

        <div className="mt-12 w-full border-t border-gray-700 pt-8 text-center">
          <p className="text-sm text-gray-500">
            Celebrating a Decade of Timeless Couture
          </p>
        </div>
      </div>

      <div className="py-8">
        <div className="flex w-full flex-col  items-center gap-2 md:flex-row md:justify-between">
          <div className="w-full md:w-1/2">
            <div className="flex flex-col items-center justify-center bg-gray-100 px-4 py-2 md:px-5 md:py-4">
              <h2 className="mb-2 text-center font-adornstoryserif text-lg font-thin md:text-4xl 2xl:text-3xl 3xl:text-5xl 4xl:text-6xl">
                &quot;300 HOURS&quot;
              </h2>
              <p className="p-2 text-center font-brandon text-[11px] leading-[1.8] tracking-[0.08em] text-gray-700 md:w-full md:px-6 md:text-sm md:leading-[1.9] md:tracking-[0.1em] 2xl:text-base 2xl:leading-[2] 2xl:tracking-[0.12em] 3xl:px-6 3xl:text-2xl 3xl:leading-[1.8] 3xl:tracking-[0.1em] 4xl:px-14 4xl:text-3xl 4xl:leading-[1.9] 4xl:tracking-[0.1em]">
                TIME IS THE RAREST LUXURY - AND IN 300 HOURS, CHIC & HOLLAND
                CAPTURES, STITCHES, AND CRAFTS IT INTO WEARABLE ART. THIS
                COUTURE COLLECTION IS A HOMAGE TO THE SILENT HOURS BEHIND EVERY
                MASTERPIECE, WHERE HANDS WORK WITH REVERENCE, CRYSTALS ARE SEWN
                WITH PRECISION, AND EVERY BEAD IS A HEARTBEAT. EACH GOWN IS THE
                RESULT OF OVER 300 HOURS OF METICULOUS CRAFTSMANSHIP, WHERE NO
                DETAIL IS OVERLOOKED. DELICATE HAND-EMBROIDERY, LAYERED DRAPERY,
                SCULPTED BODICES, AND GLISTENING EMBELLISHMENTS COME TOGETHER IN
                HARMONY, CREATING SILHOUETTES THAT FEEL BOTH REGAL AND ETHEREAL.
                300 HOURS IS MORE THAN A NUMBER - IT&apos;S A PHILOSOPHY. IT IS
                A TESTAMENT TO THE ARTISANS WHO BRING THESE CREATIONS TO LIFE,
                AND TO THE WOMEN WHO WEAR THEM WITH GRACE, PURPOSE, AND QUIET
                POWER.
              </p>
            </div>
          </div>
          {/* <div className="flex w-full items-center justify-center md:w-1/2"> */}
          <div className="flex w-full items-center justify-center m-auto md:w-1/2">
            <LazyHlsVideo
              src={`${BASE_HLS}/Sequence%2001_5/hls/playlist.m3u8`}
              fallbackSrc="https://chicandholland-space.ams3.cdn.digitaloceanspaces.com/Homepage-videos/Sequence%2001%205.mp4"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              posterSrc="/section3-img/Chic-Holland-HC-S26-044.jpg"
              posterAlt="300 Hours couture campaign video"
              imageSizes={HALF_SECTION_IMAGE_SIZES}
              rootMargin="250px"
              className="h-full mx-auto w-full object-cover p-0 md:h-[30%] md:max-w-[505px]"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 py-8">
        <SectionHeader title="300 HOURS" subtitle="COUTURE 2025/26" />
        <div className="flex flex-row gap-2 md:gap-2">
          {COLLECTION_VIDEOS.map(({ seq, posterSrc, posterAlt }) => (
            <Link
              key={seq}
              href="/collections/72/80"
              className="block h-full w-1/4"
            >
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
                imageSizes={CAROUSEL_IMAGE_SIZES}
                rootMargin="250px"
                wrapperClassName="aspect-[2/3]"
                className="h-full w-full object-cover"
              />
            </Link>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4 py-8">
        <SectionHeader
          title="Editorial Campaign"
          subtitle="AS SEEN ON SOCIAL MEDIA"
        />
        <TrendsCarousel />
      </div>

      <div className="flex flex-col gap-4 py-8">
        <SectionHeader title="300 HOURS" subtitle="PROM 2025/26" />
        <FullscreenVideoSection
          href="/collections/92/82"
          seq="Sequence%2001_1"
          linkText="VIEW THE COLLECTION"
          posterSrc="/section3-img/Chic-Holland-HC-clp-S26-113.jpg"
          posterAlt="300 Hours prom collection video"
        />
      </div>

      <div className="bg-muted py-8">
        <div className="container flex flex-col items-center gap-4 md:flex-row md:justify-between md:gap-28">
          <div className="flex-1">
            <Link href="/product/1201" className="block">
              <div className="relative aspect-[2/3] w-full overflow-hidden">
                <Image
                  src="https://chicandholland-space.ams3.cdn.digitaloceanspaces.com/homepage/PH120116B.jpg"
                  alt="Chic & Holland dress"
                  fill
                  sizes={HALF_SECTION_IMAGE_SIZES}
                  className="object-cover"
                  loading="lazy"
                />
              </div>
            </Link>
          </div>
          <div className="flex flex-1 flex-col items-center justify-center gap-2">
            <h2 className="text-center font-adornstoryserif text-2xl md:text-2xl 2xl:text-3xl 3xl:text-5xl 4xl:py-3 4xl:text-6xl">
              Find A Nearest Store Now
            </h2>
            <p className="text-center font-mysi text-muted-foreground md:px-5 md:text-lg md:leading-5 2xl:px-4 2xl:text-xl 3xl:text-4xl 4xl:px-6 4xl:text-4xl">
              Chic & Holland is also available in many stores around the world
              and has more than 100 authorized retailers within 25 countries
              carrying the brand across Europe, USA, Canada, Australia, Mexico,
              Puerto Rico and UK.
            </p>
            <Link href="/contact-us" className="4xl:py-4">
              <Button className="font-adornstoryserif md:mt-3 3xl:mt-4 3xl:text-lg 4xl:px-5 4xl:py-5 4xl:text-3xl">
                Contact Us
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 md:pt-5 2xl:pt-6 3xl:pt-7">
        <SectionHeader title="300 HOURS" subtitle="BRIDAL 2025/26" />
        <FullscreenVideoSection
          href="/collections/71/84"
          seq="Sequence%2001_4"
          linkText="VIEW THE COLLECTION"
          posterSrc="/section3-img/Chic-Holland-HC-clp-S26-116.jpg"
          posterAlt="300 Hours bridal collection video"
        />
      </div>
    </div>
  );
}
