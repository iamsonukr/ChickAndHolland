"use client";

import { cn } from "@/lib/utils";
import { CustomizedImage } from "./CustomizedImage";
import Link from "next/link";
import { memo, useState } from "react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import useHttp from "@/lib/hooks/usePost";
import { usePathname } from "next/navigation";
import ProductCardDetails from "./productCardDetails";
export const MIN_QUANTITY = 1;
export const MAX_QUANTITY = 24;
const CARD_IMAGE_SIZES =
  "(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw";

interface Product {
  id: string;
  product: {
    id: string;
    price: number;
    productCode: string;
    color: string;
    imageName?: string;
    images?: { name: string }[];
  };
  productCode?: string;
  images?: any;
  imageName?: any;
  quantity: number;
  product_size: number;
  customization?: string;
  size_country: string;
  price?: number;
  color: {
    id: number;
    hexcode: string;
  };
  displayPrice?: number;
  unitPrice?: number;
  regionPrice?: number;
  currencySymbol?: string;
  currencyName?: string;
}

interface ProductCardProps {
  product: any | Product;
  className?: string;
  clickable?: boolean;
  openInDifferentTab?: boolean;
  priority?: boolean;
  isLoggedIn: boolean;
  hiddenButtons?: boolean;
  outerPrice?: boolean;
}

const ProductCard = ({
  product,
  className,
  clickable = true,
  openInDifferentTab = false,
  priority = false,
  isLoggedIn,
  hiddenButtons = false,
  outerPrice = false,
}: ProductCardProps) => {
  const [quantity, setQuantity] = useState(product?.quantity || 0);

  const pathname = usePathname();

  const { executeAsync: changeQuantity } = useHttp(
    `/cart/quantity`,
    "PATCH",
  );

  const handleQuantityChange = async (action: "increment" | "decrement") => {
    const newQuantity = action === "increment" ? quantity + 1 : quantity - 1;

    if (newQuantity > MAX_QUANTITY) {
      toast.error(`Maximum quantity is ${MAX_QUANTITY}`);
      return;
    }

    if (newQuantity < MIN_QUANTITY) {
      toast.success(`Minimum quantity is ${MIN_QUANTITY}`);
      return;
    }

    setQuantity(newQuantity);

    await changeQuantity({
      favouriteId: product.id,
      quantity: newQuantity,
    });
  };

  const productImage =
    product?.imageName ||
    product?.images?.[0]?.name ||
    product?.product?.images?.[0]?.name;
  const imageAlt = `Chic & Holland's ${isLoggedIn ? product.product?.productCode : product?.productCode} product`;

  // Get the price to display
  const getDisplayPrice = () => {
    if (product.currencyName) {
      return `${product.currencySymbol} ${parseFloat(product.unitPrice || product.regionPrice).toFixed(2)}`;
    }
    
    // Use displayPrice if available, otherwise fall back to product price
    const priceToShow = product.displayPrice || product?.product?.price || product?.price;
    return `€ ${priceToShow.toFixed(2)}`;
  };

  return (
    <div className="group">
      <div
        className={cn(
          "relative h-full w-full",
          clickable ? "cursor-pointer" : "cursor-default",
          className,
        )}
      >
        {clickable ? (
          <Link
            href={`/product/${isLoggedIn ? (product.product ? product.product.id : product?.id) : product?.id}`}
            target={openInDifferentTab ? "_blank" : "_self"}
              className="block w-full"  // add this

          >
            <CustomizedImage
              src={productImage || ""}
              alt={imageAlt}
              width={400}
              height={700}
              sizes={CARD_IMAGE_SIZES}
              priority={priority}
            />
          </Link>
        ) : (
          <CustomizedImage
            src={productImage || ""}
            alt={imageAlt}
            width={400}
            height={700}
            sizes={CARD_IMAGE_SIZES}
            priority={priority}
          />
        )}

        <p className="absolute right-2 top-2 cursor-text bg-primary p-1 text-sm text-primary-foreground 2xl:text-xl">
          {product?.product?.productCode || product.productCode}
        </p>
        {outerPrice && (
          <p className="absolute right-2 top-10 cursor-text bg-primary p-1 text-sm text-primary-foreground 2xl:text-xl">
            {product.currencyName
              ? `${product.currencySymbol} ${Math.round(parseFloat(product.regionPrice))}`
              : `€ ${product?.product?.price || product?.price}`}
          </p>
        )}
      </div>
      {isLoggedIn && product.product_size && (
        <>
          <div className="mt-2 space-y-2 p-1 text-sm">
            <div className="flex items-center justify-between">
              <p className="font-bold">
                Size: {product.product_size} ({product.size_country})
              </p>
              <p className="font-bold">
                Price: {getDisplayPrice()}
              </p>
            </div>

            <div className="flex items-center justify-between">
              {!hiddenButtons && (
                <Button
                  variant="outline"
                  onClick={() => handleQuantityChange("decrement")}
                  className="h-8 w-[25%] p-0"
                >
                  -
                </Button>
              )}
              <span className="flex h-8 w-12 items-center justify-center rounded-xl bg-gray-300">
                {quantity}
              </span>
              {!hiddenButtons && (
                <Button
                  variant="outline"
                  onClick={() => handleQuantityChange("increment")}
                  className="h-8 w-[25%] p-0"
                >
                  +
                </Button>
              )}
            </div>

            {pathname?.startsWith("/retailer-panel/my-orders") ||
              (pathname?.startsWith("/admin-panel/request") && (
                <p>
                  <span className="font-bold">customization :</span>{" "}
                  {product?.customization}
                </p>
              ))}
          </div>
          {!hiddenButtons && <ProductCardDetails data={product} />}
        </>
      )}
    </div>
  );
};

export default memo(ProductCard);
