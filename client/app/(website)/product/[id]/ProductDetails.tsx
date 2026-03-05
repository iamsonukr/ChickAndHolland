"use client";

import { Button } from "@/components/custom/button";
import { Label } from "@/components/ui/label";
import { getProductColours } from "@/lib/data";
import { cn } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const ProductDetails = ({
  productDetails,
  login,
}: {
  productDetails: any;
  login: boolean;
}) => {
  // const searchParams = useSearchParams();
  const [colors, setColors] = useState([] as any);
  const [loading, setLoading] = useState(true);

  // const size = searchParams?.get("size");
  // const color = searchParams?.get("color");

  // const allSizes = productDetails.stockDetails.map((item: any) => item.size);

  const router = useRouter();
  const getcolors = async () => {
    setLoading(true);
    const colours = await getProductColours({});
    setColors(colours.productColours);
    setLoading(false);
  };

  const getColourBasedOnId = (id: string) => {
    if (loading) return "Loading...";
    let c = colors.find((colour: any) => colour.hexcode === id)?.name;
    if (!c) {
      return "Not added yet";
    }
    return c;
  };

  useEffect(() => {
    getcolors();
  }, []);

  return (
    <div className="mt-4">
      {login && (
        <div className="flex gap-2">
          <h3 className={cn("text-2xl font-bold")}>
            {productDetails.currencyPricing
              ? `${productDetails.currencyPricing.currencySymbol} ${Math.round(parseFloat(productDetails.currencyPricing.regionPrice))}`
              : `€ ${productDetails.price}`}
          </h3>
        </div>
      )}

      {/* Display custom product specifications */}
      <div className="mt-4 space-y-3">
        <div className="flex=wrap flex gap-3">
          <span className="text-gray-600">Color:</span>
          <div className="flex items-center gap-2">
            <div
              className="h-4 w-4 rounded-full border border-gray-300"
              style={{ backgroundColor: productDetails.mesh_color }}
            />
            <span>{getColourBasedOnId(productDetails.mesh_color)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
