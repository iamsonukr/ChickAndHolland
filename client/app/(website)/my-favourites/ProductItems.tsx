"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { memo, useState } from "react";
import { toast } from "sonner";
import useHttp from "@/lib/hooks/usePost";
import { usePathname } from "next/navigation";
import ProductCardDetails from "@/components/custom/productCardDetails";
import { Button } from "@/components/ui/button";
import { CustomizedImage } from "@/components/custom/CustomizedImage";

export const MIN_QUANTITY = 1;
export const MAX_QUANTITY = 24;

const CARD_IMAGE_SIZES =
  "(min-width: 1280px) 22vw, (min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw";

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

const ProductItem = ({
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

  const { executeAsync: changeQuantity } = useHttp(`/cart/quantity`, "PATCH");

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

  const imageAlt = `Chic & Holland's ${
    isLoggedIn ? product.product?.productCode : product?.productCode
  } product`;

  const getDisplayPrice = () => {
    if (product.currencyName) {
      return `${product.currencySymbol} ${parseFloat(
        product.unitPrice || product.regionPrice
      ).toFixed(2)}`;
    }

    const priceToShow =
      product.displayPrice || product?.product?.price || product?.price;

    return `€ ${Number(priceToShow).toFixed(2)}`;
  };

  const productHref = `/product/${
    isLoggedIn ? (product.product ? product.product.id : product?.id) : product?.id
  }`;

  const ImageBlock = (
    <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-muted">
      <CustomizedImage
        src={productImage || ""}
        alt={imageAlt}
        width={400}
        height={500}
        sizes={CARD_IMAGE_SIZES}
        priority={priority}
        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
      />

      <div className="absolute right-2 top-2 flex flex-col items-end gap-1">
        <p className="rounded-md bg-primary px-2 py-1 text-[11px] font-medium leading-none text-primary-foreground shadow-sm sm:text-xs">
          {product?.product?.productCode || product.productCode}
        </p>

        {outerPrice && (
          <p className="rounded-md bg-primary px-2 py-1 text-[11px] font-medium leading-none text-primary-foreground shadow-sm sm:text-xs">
            {product.currencyName
              ? `${product.currencySymbol} ${Math.round(
                  parseFloat(product.regionPrice)
                )}`
              : `€ ${product?.product?.price || product?.price}`}
          </p>
        )}
      </div>
    </div>
  );

  return (
    <div
      className={cn(
        "group h-full overflow-hidden rounded-xl border bg-background shadow-sm transition-shadow hover:shadow-md",
        clickable ? "cursor-pointer" : "cursor-default",
        className
      )}
    >
      <div className="p-2">
        {clickable ? (
          <Link
            href={productHref}
            target={openInDifferentTab ? "_blank" : "_self"}
            className="block"
          >
            {ImageBlock}
          </Link>
        ) : (
          ImageBlock
        )}
      </div>

      {isLoggedIn && product.product_size && (
        <>
          <div className="space-y-3 px-3 pb-3 pt-1">
            <div className="flex items-start justify-between gap-3 text-xs sm:text-sm">
              <p className="font-semibold">
                Size: {product.product_size} ({product.size_country})
              </p>
              <p className="font-semibold whitespace-nowrap">
                {getDisplayPrice()}
              </p>
            </div>

            {!hiddenButtons && (
              <div className="flex items-center justify-between gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleQuantityChange("decrement")}
                  className="h-8 min-w-8 px-2 text-sm"
                >
                  -
                </Button>

                <span className="flex h-8 min-w-[44px] items-center justify-center rounded-md bg-muted px-3 text-sm font-medium">
                  {quantity}
                </span>

                <Button
                  variant="outline"
                  onClick={() => handleQuantityChange("increment")}
                  className="h-8 min-w-8 px-2 text-sm"
                >
                  +
                </Button>
              </div>
            )}

            {(pathname?.startsWith("/retailer-panel/my-orders") ||
              pathname?.startsWith("/admin-panel/request")) && (
              <p className="text-xs sm:text-sm">
                <span className="font-semibold">Customization:</span>{" "}
                {product?.customization}
              </p>
            )}
          </div>

          {!hiddenButtons && (
            <div className="px-3 pb-3">
              <ProductCardDetails data={product} />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default memo(ProductItem);