import { getProducts } from "@/lib/data";
import { notFound } from "next/navigation";
import { cn } from "@/lib/utils";
import ProductCard from "@/components/custom/ProductCard";
import LazyVideo from "@/components/custom/LazyVideo";
import TopSection from "./TopSection";
import { cookies } from "next/headers";
import ClientPaginatedProducts from "@/components/custom/ClientPaginatedProducts";
import { cache } from "react";

const ITEMS_PER_PAGE = 12;

// ✅ Deduplicate identical fetch calls across the same render
// (generateMetadata + page both call getProducts — this ensures only ONE network request)
const getCachedProducts = cache(
  async (categoryId: number, subCategoryId: number, currencyId?: number) => {
    return getProducts({
      categoryId,
      subCategoryId,
      ...(currencyId ? { currencyId } : {}),
    });
  }
);

export default async function CollectionProducts(props: {
  params: Promise<{ slug: string[] }>;
}) {
  const params = await props.params;

  if (params?.slug?.length !== 2) return notFound();

  // ✅ Read cookies once
  const cookieStore = await cookies();
  const isLoggedIn = !!cookieStore.get("token")?.value;
  const currencyId = cookieStore.get("currencyId")?.value;

  const categoryId = parseInt(params.slug[0], 10);
  const subCategoryId = parseInt(params.slug[1], 10);

  const allProductData = await getCachedProducts(
    categoryId,
    subCategoryId,
    currencyId ? parseInt(currencyId) : undefined,
  );

  // ✅ Early return for empty data
  const hasProducts =
    allProductData?.products?.length ||
    allProductData?.productsWithoutVideo?.length;

  if (!hasProducts) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-lg text-gray-500">No products found</p>
      </div>
    );
  }

  // ✅ Compute initial groups once via extracted helper
  const { initialGroups, initialProductsWithoutVideo, loadedGroupCount } =
    computeInitialGroups(allProductData);

  const categoryName = allProductData.categoryDetails?.name || "";

  return (
    <div>
      <TopSection name={categoryName} subCategoryId={subCategoryId} />

      <h1 className="z-[2] text-center mt-3 mb-1 font-adornstoryserif text-3xl font-bold tracking-wide text-black">
        {categoryName}
      </h1>

      <div className="mx-4 sm:mx-8 mb-8 mt-8 flex flex-col gap-2">

        {/* Server-rendered groups with videos */}
        {initialGroups.map((group, i) => (
          <div key={`server-group-${i}`} className="flex flex-col gap-2">
            {group.video && (
              <LazyVideo
                src={group.video}
                className="h-full w-full"
              />
            )}
            <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
              {group.products.map((product, index) => (
                <ProductCard
                  key={`server-product-${product.id}`}
                  product={product}
                  // ✅ Only prioritize first 2 images — reduces LCP blocking
                  priority={i === 0 && index < 2}
                  isLoggedIn={isLoggedIn}
                  outerPrice={isLoggedIn}
                  hiddenButtons={true}
                />
              ))}
            </div>
          </div>
        ))}

        {/* Server-rendered products without videos */}
        {initialProductsWithoutVideo.length > 0 && (
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
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

        {/* Client component for remaining products */}
        <ClientPaginatedProducts
          allProductData={allProductData}
          initialLoadedGroups={loadedGroupCount}
          initialLoadedWithoutVideo={initialProductsWithoutVideo.length}
          isLoggedIn={isLoggedIn}
        />
      </div>
    </div>
  );
}

// ✅ Extracted helper — keeps component clean, avoids inline recomputation
function computeInitialGroups(allProductData: any) {
  const initialGroups = [];
  let remainingCount = ITEMS_PER_PAGE;
  let groupIndex = 0;

  while (remainingCount > 0 && groupIndex < allProductData.products.length) {
    initialGroups.push(allProductData.products[groupIndex]);
    remainingCount -= allProductData.products[groupIndex].products.length;
    groupIndex++;
  }

  const initialProductsWithoutVideo =
    remainingCount > 0
      ? allProductData.productsWithoutVideo.slice(0, remainingCount)
      : [];

  return {
    initialGroups,
    initialProductsWithoutVideo,
    loadedGroupCount: groupIndex,
  };
}

// ✅ generateMetadata reuses the same cached fetch — zero extra network call
export async function generateMetadata(props: {
  params: Promise<{ slug: string[] }>;
}) {
  const params = await props.params;
  if (params?.slug?.length !== 2) return notFound();

  const categoryId = parseInt(params.slug[0], 10);
  const subCategoryId = parseInt(params.slug[1], 10);

  const productsData = await getCachedProducts(categoryId, subCategoryId);
  const categoryName = productsData.categoryDetails.name || "Collection";

  return {
    title: `${categoryName} | Chic & Holland`,
    description: `Check out our latest collection of ${categoryName} on Chic & Holland.`,
    keywords: [categoryName, "fashion", "clothing", "Chic & Holland", "online shopping"],
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

// ✅ Revalidate every 60s instead of force-dynamic on every request
// Adjust up/down based on how often your collections change
export const revalidate = 60;