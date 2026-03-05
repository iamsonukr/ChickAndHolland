import {
  getFavourites,
  getProductColours,
  getProductDetails,
} from "@/lib/data";
import ImageCarousel from "./ImageCarousel";
import { cookies } from "next/headers";
import ProductDetails from "./ProductDetails";
import RelatedProducts from "@/components/custom/relatedProducts";
import { SizeChartDialog } from "@/components/custom/sizeChart";
import ActionButtons from "./ActionButtons";
const ProductDetailsPage = async (props: {
  params: Promise<{ id: string }>;
}) => {
  const params = await props.params;
  const isLoggedIn = !!(await cookies()).get("token")?.value;
  const isRetailer = (await cookies()).get("userType")?.value === "RETAILER";
  const retailerId = (await cookies()).get("retailerId")?.value;
  const userType = (await cookies()).get("userType")?.value;
  const currencyId = (await cookies()).get("currencyId")?.value;

  const localFavourites = JSON.parse(
    (await cookies()).get("favourites")?.value || "[]",
  );
  const productDetails = await getProductDetails(
    Number(params.id),
    currencyId ? Number(currencyId) : undefined,
  );

  let favourites: any = {};

  if (isLoggedIn && isRetailer) {
    favourites = await getFavourites(Number(retailerId));
  } else {
    favourites = { favourites: localFavourites };
  }

  // console.log(productDetails);

  return (
    <div className="my-8">
      <div className="flex-row pe-4 ps-4 md:flex md:gap-24 md:!pe-0 md:!ps-0">
        <ImageCarousel images={productDetails.images} />
        <div className="flex w-[100%] flex-col gap-2 md:w-[50%]">
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
              userType={userType || ""}
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

export async function generateMetadata(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;
  const productDetails = await getProductDetails(Number(params.id));

  const categoryName = productDetails.subCategory.name;
  const productCode = productDetails.productCode;

  return {
    title: `${productCode} - ${categoryName} | Chic & Holland.`,
    description: `Check out our latest product ${productCode} from ${categoryName} on Chic & Holland.`,
    keywords: [
      `${productCode}`,
      `${categoryName}`,
      "fashion",
      "clothing",
      "Chic & Holland",
      "online shopping",
    ],
    openGraph: {
      title: `${productCode} - ${categoryName} | Chic & Holland.`,
      description: `Check out our latest product ${productCode} from ${categoryName} on Chic & Holland.`,
      images: productDetails.images
        ? productDetails.images.slice(0, 4).map((img: any) => {
            return {
              url: img.name,
              width: 1200,
              height: 630,
              alt: `${productCode} - ${categoryName}`,
            };
          })
        : [],
      locale: "en_US",
      type: "website",
    },
  };
}

export const dynamic = "force-dynamic";
