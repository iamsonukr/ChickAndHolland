
"use client";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { CustomizedImage } from "./CustomizedImage";
import Autoplay from "embla-carousel-autoplay";
import { useRouter } from "next/navigation";

const RelatedProducts = ({
  relatedProducts,
}: {
  relatedProducts: {
    id: number;
    createdAt: string;
    name: string;
    isMain: boolean;
    productId: number;
    imageUrl?: string; // Ensure image field included
  }[];
}) => {
  const router = useRouter();

  return (
    <div className="row mt-10">
      <p className="text-center text-3xl font-semibold">Related Products</p>

      <div className="mx-auto mt-6 w-full lg:w-[80%] xl:w-[70%]">
        <Carousel
          opts={{ loop: true }}
          plugins={[
            Autoplay({
              delay: 2500,
              stopOnInteraction: false,
            }),
          ]}
        >
          <CarouselContent>
            {relatedProducts.map((product) => {
              const img =
                product.imageUrl ||
                product.name ||
                "/sample.jpeg";
              return (
                <CarouselItem
                  key={product.productId}
                  className="cursor-pointer md:basis-1/2 xl:basis-1/3"
                >
                  <div
                    className="md:h-full lg:h-full xl:full object-contain"
                    onClick={() => router.push(`/product/${product.productId}`)}
                  >
                    <CustomizedImage
                      src={img}
                      alt={product.name || "Product Image"}
                      unoptimized
                      priority
                    />
                  </div>
                </CarouselItem>
              );
            })}
          </CarouselContent>

          <CarouselPrevious className="hidden md:inline-flex" />
          <CarouselNext className="hidden md:inline-flex" />
        </Carousel>
      </div>
    </div>
  );
};

export default RelatedProducts;
