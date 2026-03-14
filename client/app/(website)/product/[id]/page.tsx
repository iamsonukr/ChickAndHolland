import { getFavourites, getProductDetails } from "@/lib/data";
import ImageCarousel from "./ImageCarousel";
import { cookies } from "next/headers";
import ProductDetails from "./ProductDetails";
import RelatedProducts from "@/components/custom/relatedProducts";
import { SizeChartDialog } from "@/components/custom/sizeChart";
import ActionButtons from "./ActionButtons";
import ScrollToTop from "@/components/custom/ScrollToTop";

interface PageProps {
  params: Promise<{ id: string }>;
}

interface ProductImage {
  name: string;
}

const ProductDetailsPage = async ({ params }: PageProps) => {
  const { id } = await params;

  // Single cookie read pass
  const cookieStore = await cookies();
  const isLoggedIn = Boolean(cookieStore.get("token")?.value);
  const userType = cookieStore.get("userType")?.value ?? "";
  const isRetailer = userType === "RETAILER";
  const retailerId = cookieStore.get("retailerId")?.value;
  const currencyId = cookieStore.get("currencyId")?.value;
  const localFavourites = JSON.parse(
    cookieStore.get("favourites")?.value ?? "[]",
  );

  const productDetails = await getProductDetails(
    Number(id),
    currencyId ? Number(currencyId) : undefined,
  );

  const favourites =
    isLoggedIn && isRetailer
      ? await getFavourites(Number(retailerId))
      : { favourites: localFavourites };

  return (
    <div className="my-8">
      {/* Ensures page always starts at the top on navigation */}
      <ScrollToTop />

      <div className="flex-row pe-4 ps-4 md:flex md:gap-24 md:!pe-0 md:!ps-0">
        <ImageCarousel images={productDetails.images} />

        <div className="flex w-full flex-col gap-2 md:w-1/2">
          <h2 className="block text-3xl font-bold">
            {productDetails.productCode}
          </h2>
          <h1 className="block text-lg font-bold text-muted-foreground">
            {productDetails.subCategory.name}
          </h1>

          <ProductDetails productDetails={productDetails} login={isLoggedIn} />

          <div className="block">
            <ActionButtons
              productDetails={productDetails}
              isRetailer={isRetailer}
              isLoggedIn={isLoggedIn}
              retailerId={retailerId}
              favourites={favourites?.favourites}
              userType={userType}
            />
            <SizeChartDialog />
            {productDetails.description && (
              <p className="text-sm">{productDetails.description}</p>
            )}
          </div>
        </div>
      </div>

      <RelatedProducts relatedProducts={productDetails.relatedProducts} />
    </div>
  );
};

export default ProductDetailsPage;

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const productDetails = await getProductDetails(Number(id));

  const categoryName = productDetails.subCategory.name;
  const productCode = productDetails.productCode;
  const title = `${productCode} - ${categoryName} | Chic & Holland.`;
  const description = `Check out our latest product ${productCode} from ${categoryName} on Chic & Holland.`;

  const ogImages: { url: string; width: number; height: number; alt: string }[] =
    productDetails.images
      ?.slice(0, 4)
      .map((img: ProductImage) => ({
        url: img.name,
        width: 1200,
        height: 630,
        alt: `${productCode} - ${categoryName}`,
      })) ?? [];

  return {
    title,
    description,
    keywords: [productCode, categoryName, "fashion", "clothing", "Chic & Holland", "online shopping"],
    openGraph: {
      title,
      description,
      images: ogImages,
      locale: "en_US",
      type: "website",
    },
  };
}

export const dynamic = "force-dynamic";