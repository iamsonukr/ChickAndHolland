import { ContentLayout } from "@/components/custom/admin-panel/contentLayout";

export default function Loading() {
  return (
    <ContentLayout title="Query Management">
      <div className="min-h-screen bg-gray-50 p-4 dark:bg-gray-900 md:p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="grid gap-2 rounded-lg border border-gray-200 bg-white p-1 shadow dark:border-gray-700 dark:bg-gray-800 md:grid-cols-2">
            <div className="h-11 animate-pulse rounded-md bg-gray-200 dark:bg-gray-700" />
            <div className="h-11 animate-pulse rounded-md bg-gray-200 dark:bg-gray-700" />
          </div>
          <div className="h-10 animate-pulse rounded-md bg-gray-200 dark:bg-gray-700" />
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
            <div className="h-16 animate-pulse bg-gray-800 dark:bg-gray-900" />
            <div className="space-y-3 p-4">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="h-14 animate-pulse rounded-md bg-gray-100 dark:bg-gray-700"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </ContentLayout>
  );
}
