// "use client";

// import { CustomizedImage } from "@/components/custom/CustomizedImage";
// import { useCallback, useRef, useState } from "react";
// import ReactImageMagnify from "react-image-magnify";
// import QuickPinchZoom, { make3dTransformValue } from "react-quick-pinch-zoom";
// import { Button } from "@/components/ui/button";
// import {
//   Dialog,
//   DialogClose,
//   DialogContent,
//   DialogFooter,
//   DialogTrigger,
// } from "@/components/ui/dialog";
// import Magnifier from "react18-image-magnifier";
// import InnerImageZoom from "react-inner-image-zoom";
// import "react-inner-image-zoom/lib/InnerImageZoom/styles.css";
// const ImageCarousel = ({
//   images,
// }: {
//   images: {
//     id: number;
//     createdAt: string;
//     name: string;
//     isMain: boolean;
//   }[];
// }) => {
//   const [biggerImage, setBiggerImage] = useState(images[0]);
//   const imgRef = useRef<HTMLImageElement | null>(null);
//   const [modalWidth, setModalWidth] = useState("");

//   const onUpdate = useCallback(({ x, y, scale }: any) => {
//     const { current: img }: any = imgRef;

//     if (img) {
//       const value = make3dTransformValue({ x, y, scale });

//       img.style.setProperty("transform", value);
//     }
//   }, []);

//   const zoomInFun = () => {
//     setModalWidth("!max-w-[80vw] h-screen");
//   };

//   const zoomOutFun = () => {
//     setModalWidth("");
//   };

//   return (
//     <div className="flex w-full flex-col md:w-[40%] md:gap-4">
//       <div className="col-12 hidden justify-between md:flex">
//         <div className="ms-3 w-2/12 p-2 3xl:w-3/12">
//           {images.map((image) => (
//             <div className="my-2" onClick={() => setBiggerImage(image)}>
//               <img
//                 src={image.name}
//                 alt={image.name}
//                 className="h-[150px] w-full cursor-pointer object-cover 3xl:h-[300px] 3xl:w-[70%]"
//               />
//             </div>
//           ))}
//         </div>
//         <div className="w-8/12">
//           <Dialog>
//             <DialogTrigger asChild>
//               <CustomizedImage
//                 src={biggerImage?.name}
//                 alt={biggerImage?.name}
//                 className="cursor-pointer"
//                 unoptimized
//               />
//             </DialogTrigger>
//             <DialogContent className={`${modalWidth}`}>
//               <div
//                 className="flex w-full justify-center"
//                 onMouseLeave={zoomOutFun}
//               >
//                 <InnerImageZoom
//                   src={biggerImage?.name}
//                   zoomSrc={biggerImage?.name}
//                   afterZoomIn={zoomInFun}
//                   afterZoomOut={zoomOutFun}
//                   className=""
//                 />
//               </div>
//             </DialogContent>
//           </Dialog>
//         </div>
//       </div>

//       <div className="hidden md:block">
//         {/* <CustomizedImage
//           src={biggerImage?.name}
//           alt={biggerImage?.name}
//           unoptimized
//         /> */}
//       </div>

//       <div className="block md:hidden">
//         {images.map((image, index: number) => (
//           <div className="my-2">
//             {/* <InnerImageZoom  src={image.name} zoomSrc={image.name}  className="" fullscreenOnMobile /> */}
//             {/* <CustomizedImage src={image.name} alt={image.name} unoptimized /> */}

//             <Dialog key={index}>
//               <DialogTrigger asChild>
//                 <CustomizedImage
//                   src={image.name}
//                   alt={image.name}
//                   unoptimized
//                 />
//               </DialogTrigger>
//               <DialogContent className="sm:max-w-md">
//                 <div className="flex justify-center">
//                   <QuickPinchZoom onUpdate={onUpdate}>
//                     <img
//                       ref={imgRef}
//                       src={image.name}
//                       className="h-auto w-full"
//                     />
//                   </QuickPinchZoom>
//                 </div>
//                 <DialogFooter className="sm:justify-start">
//                   <DialogClose asChild>
//                     <Button type="button" variant="secondary">
//                       Close
//                     </Button>
//                   </DialogClose>
//                 </DialogFooter>
//               </DialogContent>
//             </Dialog>
//           </div>
//         ))}
//       </div>

//       {/* <div className="hidden md:block">
//         <Carousel
//           opts={{
//             loop: true,
//           }}
//           plugins={[
//             AutoPlay({
//               delay: 2000,
//               stopOnInteraction: false,
//             }),
//           ]}
//         >
//           <CarouselContent>
//             {images.map((image) => (
//               <CarouselItem
//                 key={image.id}
//                 className="cursor-pointer md:basis-1/3"
//                 onClick={() => setBiggerImage(image)}
//               >
//                 <div
//                   className={cn(
//                     "h-[150px]",
//                     image.id === biggerImage.id &&
//                       "border-2 border-primary shadow-md transition-all",
//                   )}
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
//         </Carousel>
//       </div> */}
//     </div>
//   );
// };

// export default ImageCarousel;

"use client";

import { CustomizedImage } from "@/components/custom/CustomizedImage";
import { useCallback, useRef, useState } from "react";
import QuickPinchZoom, { make3dTransformValue } from "react-quick-pinch-zoom";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogTrigger,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import InnerImageZoom from "react-inner-image-zoom";
import "react-inner-image-zoom/lib/InnerImageZoom/styles.css";
import { Button } from "@/components/ui/button";

const ImageCarousel = ({
  images,
}: {
  images: {
    id: number;
    createdAt: string;
    name: string;
    isMain: boolean;
  }[];
}) => {
  const [biggerImage, setBiggerImage] = useState(images[0]);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [modalWidth, setModalWidth] = useState("");

  const onUpdate = useCallback(({ x, y, scale }: any) => {
    const { current: img }: any = imgRef;
    if (img) {
      const value = make3dTransformValue({ x, y, scale });
      img.style.setProperty("transform", value);
    }
  }, []);

  const zoomInFun = () => {
    setModalWidth("!max-w-[80vw] h-screen");
  };

  const zoomOutFun = () => {
    setModalWidth("");
  };

  return (
    <div className="flex w-full flex-col md:w-[40%] md:gap-4">
      
      {/* DESKTOP VIEW */}
      <div className="col-12 hidden justify-between md:flex">
        
        {/* Left Thumbnails */}
        <div className="ms-3 w-2/12 p-2 3xl:w-3/12">
          {images.map((image) => (
            <div
              key={image.id}
              className="my-2 cursor-pointer"
              onClick={() => setBiggerImage(image)}
            >
              <img
                src={image.name}
                alt={image.name}
                className="h-[150px] w-full object-cover 3xl:h-[300px] 3xl:w-[70%]"
              />
            </div>
          ))}
        </div>

        {/* Main Image */}
        <div className="w-8/12">
          <Dialog>
            <DialogTrigger asChild>
              <CustomizedImage
                src={biggerImage?.name}
                alt={biggerImage?.name}
                className="cursor-pointer"
                unoptimized
              />
            </DialogTrigger>

            <DialogContent className={`${modalWidth}`}>
              <DialogHeader>
                <DialogTitle className="sr-only">Image Preview</DialogTitle>
              </DialogHeader>

              <div
                className="flex w-full justify-center"
                onMouseLeave={zoomOutFun}
              >
                <InnerImageZoom
                  src={biggerImage?.name}
                  zoomSrc={biggerImage?.name}
                  afterZoomIn={zoomInFun}
                  afterZoomOut={zoomOutFun}
                />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* MOBILE VIEW */}
      <div className="block md:hidden">
        {images.map((image) => (
          <div className="my-2" key={image.id}>
            <Dialog>
              <DialogTrigger asChild>
                <CustomizedImage src={image.name} alt={image.name} unoptimized />
              </DialogTrigger>

             <DialogContent className="sm:max-w-md">
  <DialogHeader>
    <DialogTitle className="sr-only">Zoom Image</DialogTitle>
  </DialogHeader>

  <div className="flex justify-center">
    <QuickPinchZoom onUpdate={onUpdate}>
      <img ref={imgRef} src={image.name} className="h-auto w-full" />
    </QuickPinchZoom>
  </div>

  <DialogFooter className="sm:justify-start">
    <DialogClose asChild>
      <Button type="button" variant="secondary">Close</Button>
    </DialogClose>
  </DialogFooter>
</DialogContent>

            </Dialog>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImageCarousel;
