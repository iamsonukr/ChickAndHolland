// "use client";
// import {
//   Carousel,
//   CarouselContent,
//   CarouselItem,
//   CarouselNext,
//   CarouselPrevious,
// } from "@/components/ui/carousel";
// import { CustomizedImage } from "./CustomizedImage";
// import Autoplay from "embla-carousel-autoplay";
// import { useRouter } from "next/navigation";

// const RelatedProducts = ({
//   relatedProducts,
// }: {
//   relatedProducts: {
//     id: number;
//     createdAt: string;
//     name: string;
//     isMain: boolean;
//     productId: number;
//   }[];
// }) => {
//   const router = useRouter();

//   return (
//     <div className="row mt-5">
//       <p className="text-center text-3xl">Related Products</p>
//       <div className="mx-auto mt-5 w-[80%] 3xl:w-[70%]">
//         <Carousel
//           opts={{
//             loop: true,
//           }}
//           plugins={[
//             Autoplay({
//               delay: 2000,
//               stopOnInteraction: false,
//             }),
//           ]}
//         >
//           <CarouselContent>
//             {relatedProducts.map((image) => (
//               <CarouselItem
//                 key={image.id}
//                 className="cursor-pointer md:basis-1/2 xl:basis-1/3"
//               >
//                 <div
//                   className="object-contain md:h-[450px] lg:h-[600px] 2xl:h-[700px] 3xl:h-[800px] 4xl:h-[1200px]"
//                   onClick={() => {
//                     router.push(`/product/${image.productId}`);
//                   }}
//                 >
//                   <CustomizedImage
//                     src={image.name}
//                     alt={image.name}
//                     unoptimized
//                   />
//                 </div>
//               </CarouselItem>
//             ))}
//           </CarouselContent>
//           <CarouselPrevious className="hidden md:inline-flex" />
//           <CarouselNext className="hidden md:inline-flex" />
//         </Carousel>
//       </div>
//     </div>
//   );
// };

// export default RelatedProducts;
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

      <div className="mx-auto mt-6 w-[85%] lg:w-[80%] xl:w-[70%]">
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
                "/placeholder.png";

              return (
                <CarouselItem
                  key={product.productId}
                  className="cursor-pointer md:basis-1/2 xl:basis-1/3"
                >
                  <div
                    className="md:h-[450px] lg:h-[550px] xl:h-[650px] object-contain"
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
