import type { Metadata } from "next";
import { CustomizedImage } from "@/components/custom/CustomizedImage";

export const metadata: Metadata = {
  title: "Size Chart | Chic & Holland",
  description:
    "Find your perfect size with our comprehensive Chic & Holland sizing guide.",
};

const SizeChart = () => {
  return (
    <div className="min-h-screen">
      <div className="mx-auto h-full py-10 md:w-[60%] lg:w-[50%] xl:w-[40%]">
        <CustomizedImage
          src="/size-chart-img-neset.jpeg"
          alt="Size Chart"
          unoptimized
        />
      </div>
    </div>
  );
};

export default SizeChart;
