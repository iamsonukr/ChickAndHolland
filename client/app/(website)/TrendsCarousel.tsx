"use client";

import { CustomizedImage } from "@/components/custom/CustomizedImage";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import AutoPlay from "embla-carousel-autoplay";
import { useRouter } from "next/navigation";

const TrendsCarousel = () => {
  const images = [
    // '965'
    // '950'
    // '917'
    // '925'
    // '1066'
    // '1084'
    // '1128'
    // "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/COUTURE2024NEW/HF110279.avif",
    // "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/COUTURE2024NEW/HF110284.avif",
    // "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/COUTURE2024NEW/HF110310.avif",
    // "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/COUTURE2024NEW/HF110335.avif",
    // "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/COUTURE2024NEW/HF110385.avif",
    // "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/COCKTAIL2024NEW/SD880058.avif",
    // "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/COUTURE2024NEW/HF110414.avif",
    // "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/EVENING2024/AR330272.JPG",
    // "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/EVENING2024/AR330275.JPG",

    // {
    //   id: "918",
    //   src: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-images/new_image_bti3v7.webp",
    //   alt: "Picture of chic and holland dresses",
    // },
    // {
    //   id: "996",
    //   src: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-images/new_image_1up09q.webp",
    //   alt: "Picture of chic and holland dresses",
    // },
    // {
    //   id: "917",
    //   src: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-images/new_image_16optg.webp",
    //   alt: "Picture of chic and holland dresses",
    // },
    // {
    //   id: "925",
    //   src: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-images/new_image_0kbzj.webp",
    //   alt: "Picture of chic and holland dresses",
    // },
    // {
    //   id: "1066",
    //   src: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-images/new_image_i6ey2m.webp",
    //   alt: "Picture of chic and holland dresses",
    // },
    // {
    //   id: "1128",
    //   src: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-images/new_image_mjxdod.webp",
    //   alt: "Picture of chic and holland dresses",
    // },
    // {
    //   id: "1084",
    //   src: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-images/new_image_78h1sn.webp",
    //   alt: "Picture of chic and holland dresses",
    // },
    // {
    //   id: "965",
    //   src: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-images/new_image_b8glwb.webp",
    //   alt: "Picture of chic and holland dresses",
    // },
    // {
    //   id: "950",
    //   src: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-images/new_image_crrsml.webp",
    //   alt: "Picture of chic and holland dresses",
    // },

    {
      id: "1151",
      src: "https://chicandholland-space.ams3.cdn.digitaloceanspaces.com/homepage/HF110456.jpg",
      alt: "Picture of chic and holland dresses",
    },
    {
      id: "1205",
      src: "https://chicandholland-space.ams3.cdn.digitaloceanspaces.com/homepage/HF110458.jpg",
      alt: "Picture of chic and holland dresses",
    },
    {
      id: "1160",
      src: "https://chicandholland-space.ams3.cdn.digitaloceanspaces.com/homepage/HF110502.jpg",
      alt: "Picture of chic and holland dresses",
    },
    {
      id: "1235",
      src: "https://chicandholland-space.ams3.cdn.digitaloceanspaces.com/homepage/HF110547.jpg",
      alt: "Picture of chic and holland dresses",
    },
    {
      id: "1252",
      src: "https://chicandholland-space.ams3.cdn.digitaloceanspaces.com/homepage/HF110555.jpg",
      alt: "Picture of chic and holland dresses",
    },
    {
      id: "1168",
      src: "https://chicandholland-space.ams3.cdn.digitaloceanspaces.com/homepage/HF110557.jpg",
      alt: "Picture of chic and holland dresses",
    },
    {
      id: "1156",
      src: "https://chicandholland-space.ams3.cdn.digitaloceanspaces.com/homepage/HF110562.jpg",
      alt: "Picture of chic and holland dresses",
    },
    {
      id: "1204",
      src: "https://chicandholland-space.ams3.cdn.digitaloceanspaces.com/homepage/PH120103.jpg",
      alt: "Picture of chic and holland dresses",
    },
    {
      id: "1154",
      src: "https://chicandholland-space.ams3.cdn.digitaloceanspaces.com/homepage/PH120114.jpg",
      alt: "Picture of chic and holland dresses",
    },
    {
      id: "1147",
      src: "https://chicandholland-space.ams3.cdn.digitaloceanspaces.com/homepage/PH120116.jpg",
      alt: "Picture of chic and holland dresses",
    },
  ];

  const router = useRouter();

  return (
    <div className="w-full">
      <Carousel
        opts={{
          loop: true,
        }}
        plugins={[
          AutoPlay({
            delay: 2000,
            stopOnInteraction: false,
          }),
        ]}
      >
        <CarouselContent className="-ml-1 md:-ml-2">
          {" "}
          {/* Compensate for left margin */}
          {images.map((image, index) => (
            <CarouselItem
              key={index}
              className="cursor-pointer pl-1 md:basis-1/3 md:pl-2 lg:basis-1/4" // Add left padding for gap
              onClick={() => {
                router.push(`/product/${image.id}`);
              }}
            >
              <div className="">
                <CustomizedImage
                  src={image.src}
                  alt="Picture of chic and holland dresses"
                  unoptimized
                  loading="lazy"
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  );
};

export default TrendsCarousel;
