import { cn } from "@/lib/utils";

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-gray-200/90", className)}
      aria-hidden="true"
    />
  );
}

function ProductCardSkeleton() {
  return (
    <div className="space-y-3">
      <SkeletonBlock className="aspect-[4/7] w-full" />
      <SkeletonBlock className="ml-auto h-4 w-20" />
      <SkeletonBlock className="ml-auto h-4 w-16" />
    </div>
  );
}

export function CollectionProductCardsSkeleton({
  itemCount = 4,
  className,
}: {
  itemCount?: number;
  className?: string;
}) {
  return (
    <div className={cn("grid grid-cols-1 gap-2 lg:grid-cols-4", className)}>
      {Array.from({ length: itemCount }).map((_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
}

export default function CollectionProductsSkeleton({
  showHero = true,
  itemCount = 8,
}: {
  showHero?: boolean;
  itemCount?: number;
}) {
  return (
    <div className="flex flex-col justify-center">
      {showHero && (
        <>
          <section className="relative h-[50vh] overflow-hidden bg-gray-100">
            <SkeletonBlock className="absolute inset-0 rounded-none" />
          </section>
          <div className="mx-auto mb-1 mt-3 h-9 w-48">
            <SkeletonBlock className="h-full w-full" />
          </div>
        </>
      )}

      <div className="mx-auto mb-8 mt-8 flex w-full flex-col gap-6 px-2 md:px-8 md:py-4">
        <div className="hidden gap-2 lg:grid lg:grid-cols-3 lg:grid-rows-2">
          <SkeletonBlock className="min-h-[420px] lg:col-span-1 lg:row-span-2" />
          {Array.from({ length: 4 }).map((_, index) => (
            <ProductCardSkeleton key={`featured-${index}`} />
          ))}
        </div>

        <CollectionProductCardsSkeleton itemCount={itemCount} />
      </div>
    </div>
  );
}
