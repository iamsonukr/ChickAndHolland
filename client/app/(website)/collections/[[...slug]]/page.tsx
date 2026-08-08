import { getProducts, getRetailerDetails, getSubCategoryDetails } from "@/lib/data";
import { notFound } from "next/navigation";
import { cn } from "@/lib/utils";
import ProductCard from "@/components/custom/ProductCard";
import LazyVideo from "@/components/custom/LazyVideo";
import TopSection from "./TopSection";
import { cookies } from "next/headers";
import ClientPaginatedProducts from "@/components/custom/ClientPaginatedProducts";


const ITEMS_PER_PAGE = 12;
const FULL_INITIAL_FETCH_SUBCATEGORY_IDS = new Set([50, 56]);

export default async function CollectionProducts(props: {
  params: Promise<{ slug: string[] }>;
}) {
  const params = await props.params;
  // Validate slug length
  if (params?.slug?.length !== 2) {
    return notFound();
  }
  const cookieStore = await cookies();
  const isLoggedIn = cookieStore.get("token")?.value ? true : false;

  let currencyId = cookieStore.get("currencyId")?.value;
  const retailerId = cookieStore.get("retailerId")?.value;

  // Use the currency cookie when available so we avoid an extra blocking
  // retailer request on every collection view.
  if (!currencyId && retailerId) {
    const latestRetailer = await getRetailerDetails(Number(retailerId));
    const latestCurrencyId =
      latestRetailer?.currencyId ||
      latestRetailer?.retailer?.currencyId ||
      latestRetailer?.retailer?.customer?.currencyId;
    if (latestCurrencyId) {
      currencyId = String(latestCurrencyId);
    }
  }

  const categoryId = parseInt(params.slug[0], 10);
  const subCategoryId = parseInt(params.slug[1], 10);
  if (categoryId === 95) {
    return notFound();
  }

  const resolvedCurrencyId = currencyId ? parseInt(currencyId, 10) : undefined;
  const shouldFetchFullCollection =
    FULL_INITIAL_FETCH_SUBCATEGORY_IDS.has(subCategoryId);

  const initialProductData = await getProducts({
    categoryId,
    subCategoryId,
    ...(resolvedCurrencyId ? { currencyId: resolvedCurrencyId } : {}),
    ...(shouldFetchFullCollection
      ? {}
      : { page: 1, limit: ITEMS_PER_PAGE }),
  });

  // Error handling for empty data
  if (
    !initialProductData?.products?.length &&
    !initialProductData?.productsWithoutVideo?.length
  ) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-lg text-gray-500">No products found</p>
      </div>
    );
  }

  // Determine which products to show initially (server-rendered)
  const initialGroups = [];
  let remainingCount = ITEMS_PER_PAGE;
  let groupIndex = 0;

  // Add product groups first
  while (
    remainingCount > 0 &&
    groupIndex < initialProductData.products.length
  ) {
    initialGroups.push(initialProductData.products[groupIndex]);
    remainingCount -= initialProductData.products[groupIndex].products.length;
    groupIndex++;
  }

  // Add products without video if needed
  let initialProductsWithoutVideo = [];
  if (remainingCount > 0) {
    initialProductsWithoutVideo = initialProductData.productsWithoutVideo.slice(
      0,
      remainingCount,
    );
  }

  // Get the category name for the heading
  const categoryName = initialProductData.categoryDetails?.name || "";

  return (
<div className="flex flex-col w-full">
      {/* Hero section */}
      <TopSection
        name={categoryName}
        subCategoryId={subCategoryId}
      />

      {/* Heading placed on the page as requested */}
      <h1 className="z-[2] text-center mt-3 mb-1 font-adornstoryserif text-3xl font-bold tracking-wide text-black">
        {categoryName}
      </h1>

      <div className="mx-1 md:mx-2 mb-8 mt-8 flex flex-col gap-2 md:p-2 p-1  ">
        {/* Server-rendered initial products with videos */}
        {initialGroups.map((group, i) => (
          <div
            key={`server-group-${i}`}
            className={cn(
              "grid grid-cols-1 gap-2",
              group.video
                ? "lg:grid-cols-3 lg:grid-rows-2"
                : "lg:grid-cols-4 lg:grid-rows-1",
            )}
          >
            {group.video && (
              <LazyVideo
                src={group.video}
                className="h-full w-full lg:col-span-1 lg:row-span-2"
              />
            )}
            {group.products.map((product, index) => (
              <ProductCard
                key={`server-product-${product.id}`}
                product={product}
                className="lg:col-span-1 lg:row-span-1"
                priority={i === 0 && index < 4}
                isLoggedIn={isLoggedIn}
                outerPrice={isLoggedIn}
                hiddenButtons={true}
              />
            ))}
          </div>
        ))}

        {/* Server-rendered initial products without videos */}
        {initialProductsWithoutVideo.length > 0 && (
          <div className="grid grid-cols-1 gap-2 lg:grid-cols-4 ">
            {initialProductsWithoutVideo.map((product: any) => (
              <ProductCard
                key={`server-product-no-video-${product.id}`}
                product={product}
                isLoggedIn={isLoggedIn}
                priority={false}
                outerPrice={isLoggedIn}
                hiddenButtons={true}
              />
            ))}
          </div>
        )}

        {/* Client-side component for loading more products */}
        <ClientPaginatedProducts
          categoryId={categoryId}
          subCategoryId={subCategoryId}
          currencyId={resolvedCurrencyId}
          isLoggedIn={isLoggedIn}
          initialPage={2}
          initialHasMore={
            shouldFetchFullCollection || Boolean(initialProductData.hasMore)
          }
          itemsPerPage={ITEMS_PER_PAGE}
        />
      </div>
    </div>
  );
}

export async function generateMetadata(props: {
  params: Promise<{ slug: string[] }>;
}) {
  const params = await props.params;
  if (params?.slug?.length !== 2) {
    return notFound();
  }

  const categoryId = parseInt(params.slug[0], 10);
  const subCategoryId = parseInt(params.slug[1], 10);
  if (categoryId === 95) {
    return notFound();
  }

  const categoryDetails = await getSubCategoryDetails(subCategoryId);
  const categoryName = categoryDetails?.name || "Collection";
  const description = `Check out our latest collection of ${categoryName} on Chic & Holland.`;

  return {
    title: `${categoryName} | Chic & Holland`,
    description,
    keywords: [
      `${categoryName}`,
      "fashion",
      "clothing",
      "Chic & Holland",
      "online shopping",
    ],
    openGraph: {
      title: `${categoryName} | Chic & Holland`,
      description,
      images: [
        {
          url: "https://chicandholland.com/Chic-Holland-HC-S26-037.jpg",
          width: 1200,
          height: 630,
          alt: `${categoryName} by Chic & Holland`,
        },
      ],
      locale: "en_US",
      type: "website",
    },
  };
}

export const dynamic = "force-dynamic";
