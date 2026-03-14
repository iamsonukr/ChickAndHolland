import { getProducts } from "@/lib/data";
import { notFound } from "next/navigation";
import { cn } from "@/lib/utils";
import ProductCard from "@/components/custom/ProductCard";
import LazyVideo from "@/components/custom/LazyVideo";
import TopSection from "./TopSection";
import { cookies } from "next/headers";
import ClientPaginatedProducts from "@/components/custom/ClientPaginatedProducts";

const ITEMS_PER_PAGE = 12;

export default async function CollectionProducts(props: {
  params: Promise<{ slug: string[] }>;
}) {
  const params = await props.params;
  // Validate slug length
  if (params?.slug?.length !== 2) {
    return notFound();
  }
  const isLoggedIn = (await cookies()).get("token")?.value ? true : false;
  const currencyId = (await cookies()).get("currencyId")?.value;

  const categoryId = parseInt(params.slug[0], 10);
  const subCategoryId = parseInt(params.slug[1], 10);

  // Fetch ALL product data at once
  const allProductData = await getProducts({
    categoryId,
    subCategoryId,
    ...(currencyId ? { currencyId: parseInt(currencyId) } : {}),
  });

  // Error handling for empty data
  if (
    !allProductData?.products?.length &&
    !allProductData?.productsWithoutVideo?.length
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
  while (remainingCount > 0 && groupIndex < allProductData.products.length) {
    initialGroups.push(allProductData.products[groupIndex]);
    remainingCount -= allProductData.products[groupIndex].products.length;
    groupIndex++;
  }

  // Add products without video if needed
  let initialProductsWithoutVideo = [];
  if (remainingCount > 0) {
    initialProductsWithoutVideo = allProductData.productsWithoutVideo.slice(
      0,
      remainingCount,
    );
  }

  // Get the category name for the heading
  const categoryName = allProductData.categoryDetails?.name || "";

  return (
    <div>
      {/* Hero section */}
      <TopSection
        name={categoryName}
        subCategoryId={subCategoryId}
      />

      {/* Heading placed on the page as requested */}
      <h1 className="z-[2] text-center mt-3 mb-1 font-adornstoryserif text-3xl font-bold tracking-wide text-black">
        {categoryName}
      </h1>

      <div className="mx-8 mb-8 mt-8 flex flex-col gap-2">
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
          <div className="grid grid-cols-1 gap-2 lg:grid-cols-4">
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
          allProductData={allProductData}
          initialLoadedGroups={initialGroups.length}
          initialLoadedWithoutVideo={initialProductsWithoutVideo.length}
          isLoggedIn={isLoggedIn}
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

  const productsData = await getProducts({
    categoryId,
    subCategoryId,
  });

  const categoryName = productsData.categoryDetails.name || "Collection";

  return {
    title: `${categoryName} | Chic & Holland`,
    description: `Check out our latest collection of ${categoryName} on Chic & Holland.`,
    keywords: [
      `${categoryName}`,
      "fashion",
      "clothing",
      "Chic & Holland",
      "online shopping",
    ],
    openGraph: {
      title: `${categoryName} | Chic & Holland`,
      description: `Check out our latest collection of ${categoryName} on Chic & Holland.`,
      images: productsData.products
        ? productsData.products.slice(0, 4).map((prdData) => ({
            url: prdData.products[0].imageName,
            width: 1200,
            height: 630,
            alt: prdData.products[0].productCode,
          }))
        : [],
      locale: "en_US",
      type: "website",
    },
  };
}

export const dynamic = "force-dynamic";