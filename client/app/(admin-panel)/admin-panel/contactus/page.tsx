import { getApiUrl } from "../../../../lib/constants";
import { cookies } from "next/headers";
import { ContentLayout } from "@/components/custom/admin-panel/contentLayout";
import { MarkAsReadButton } from "./mark-as-read-button";
import CustomSearchBar from "@/components/custom/admin-panel/customSearchBar";
import { MessageModal } from "./message-modal";

type FilterType = "all" | "unread" | "today";
type QueryTab = "contact" | "product";

interface QueryItem {
  id: string | number;
  queryType: QueryTab;
  name: string;
  email: string;
  phoneNumber?: string;
  subject: string;
  message: string;
  createdAt: string;
  country?: string;
  state?: string;
  city?: string;
  productCodes?: string;
  page?: string | null;
  isRead: boolean;
}

interface FetchResult {
  items: QueryItem[];
  error?: string;
}

const queryTabLabels: Record<QueryTab, string> = {
  contact: "Enquiry Emails",
  product: "Product Emails",
};

const normalizeContactQuery = (query: any): QueryItem => ({
  id: query.id,
  queryType: "contact",
  name: query.name || "Unknown",
  email: query.email || "",
  phoneNumber: query.phoneNumber || "",
  subject: query.subject || "Contact page query",
  message: query.message || "",
  createdAt: query.createdAt,
  country: query.country || "",
  state: query.state || "",
  isRead: Boolean(query.isRead),
});

const normalizeProductQuery = (query: any): QueryItem => {
  const name = [query.firstName, query.lastName].filter(Boolean).join(" ");

  return {
    id: query.id,
    queryType: "product",
    name: name || "Unknown",
    email: query.email || "",
    phoneNumber: query.contactNumber || "",
    subject: query.productCodes
      ? `Product query: ${query.productCodes}`
      : "Product query",
    message: query.message || "",
    createdAt: query.createdAt,
    country: query.country || "",
    city: query.city || "",
    productCodes: query.productCodes || "",
    page: query.page || "product",
    isRead: Boolean(query.isRead),
  };
};

const fetchQueryItems = async (
  endpoint: string,
  token: string,
  normalize: (query: any) => QueryItem
): Promise<FetchResult> => {
  try {
    const requestUrl = getApiUrl(endpoint);
    // request details intentionally not logged to reduce terminal noise

    const response = await fetch(requestUrl, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    const data = await response.json().catch(() => null);
    // response details intentionally not logged to reduce terminal noise

    if (!response.ok) {
      console.error("Dashboard Fetch API Error Response:", {
        endpoint,
        status: response.status,
        data,
      });

      return {
        items: [],
        error: data?.message || data?.msg || "Unable to load queries",
      };
    }

    const rows = Array.isArray(data) ? data : data?.data ?? [];
    return {
      items: rows.map(normalize),
    };
  } catch (error) {
    console.error("Dashboard Fetch API Catch Error:", {
      endpoint,
      error,
    });
    return {
      items: [],
      error: "Unable to load queries",
    };
  }
};

const applySearch = (queries: QueryItem[], search: string) => {
  if (!search) return queries;

  const normalizedSearch = search.toLowerCase();

  return queries.filter((query) =>
    [
      query.name,
      query.email,
      query.phoneNumber,
      query.subject,
      query.message,
      query.country,
      query.state,
      query.city,
      query.productCodes,
      query.page || "",
    ].some((value) => value?.toLowerCase().includes(normalizedSearch))
  );
};

const applyFilter = (queries: QueryItem[], filter: FilterType) => {
  if (filter === "unread") return queries.filter((query) => !query.isRead);

  if (filter === "today") {
    return queries.filter(
      (query) =>
        new Date(query.createdAt).toDateString() === new Date().toDateString()
    );
  }

  return queries;
};

const formatDate = (createdAt: string) =>
  new Date(createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const formatTime = (createdAt: string) =>
  new Date(createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface ContactUsPageProps {
  searchParams: Promise<{
    filter?: string;
    q?: string;
    tab?: string;
  }>;
}

export default async function ContactUsPage(props: ContactUsPageProps) {
  const searchParams = await props.searchParams;
  const filter: FilterType = (searchParams.filter as FilterType) || "all";
  const q = searchParams.q ? decodeURIComponent(searchParams.q) : "";
  const activeTab: QueryTab =
    searchParams.tab === "product" ? "product" : "contact";
  const token = (await cookies()).get("token")?.value || "";

  const [contactResult, productResult] = await Promise.all([
    fetchQueryItems("/contactus", token, normalizeContactQuery),
    fetchQueryItems("/product-queries", token, normalizeProductQuery),
  ]);

  const queryGroups: Record<QueryTab, QueryItem[]> = {
    contact: contactResult.items,
    product: productResult.items,
  };
  const unreadCountsByTab: Record<QueryTab, number> = {
    contact: queryGroups.contact.filter((query) => !query.isRead).length,
    product: queryGroups.product.filter((query) => !query.isRead).length,
  };

  const activeError =
    activeTab === "contact" ? contactResult.error : productResult.error;
  const activeQueries = applySearch(queryGroups[activeTab], q);
  const displayedQueries = applyFilter(activeQueries, filter);
  const unreadCount = activeQueries.filter((query) => !query.isRead).length;
  const todayCount = activeQueries.filter(
    (query) =>
      new Date(query.createdAt).toDateString() === new Date().toDateString()
  ).length;

  const buildHref = (params: Partial<{ tab: QueryTab; filter: FilterType }>) => {
    const nextParams = new URLSearchParams();
    nextParams.set("tab", params.tab || activeTab);
    nextParams.set("filter", params.filter || filter);
    if (q) nextParams.set("q", q);
    return `?${nextParams.toString()}`;
  };

  return (
    <ContentLayout title="Query Management">
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="p-4 md:p-6">
          <div className="mx-auto max-w-7xl">
            <div className="mb-6 rounded-lg border border-gray-200 bg-white p-1 shadow dark:border-gray-700 dark:bg-gray-800">
              <div className="grid gap-1 md:grid-cols-2">
                {(["contact", "product"] as QueryTab[]).map((tab) => (
                  <a
                    key={tab}
                    href={buildHref({ tab, filter: "all" })}
                    className={`rounded-md px-4 py-3 text-center text-sm font-medium transition-colors ${
                      activeTab === tab
                        ? "bg-gray-800 text-white dark:bg-gray-700"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
                    }`}
                  >
                    {queryTabLabels[tab]}
                    {unreadCountsByTab[tab] > 0 && (
                      <span className="ml-2 inline-flex min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 py-0.5 text-[11px] font-bold leading-none text-white shadow-sm">
                        {unreadCountsByTab[tab]}
                      </span>
                    )}
                  </a>
                ))}
              </div>
            </div>

            <div className="mb-6 w-full">
              <CustomSearchBar query={q} placeholder="Search queries..." />
            </div>

            <div className="mb-6 lg:hidden">
              <div className="rounded-lg border border-gray-200 bg-white p-1 shadow dark:border-gray-700 dark:bg-gray-800">
                <div className="grid grid-cols-3 gap-1">
                  {[
                    { key: "all", label: "All", count: activeQueries.length },
                    { key: "unread", label: "New", count: unreadCount },
                    { key: "today", label: "Today", count: todayCount },
                  ].map((tab) => (
                    <a
                      key={tab.key}
                      href={buildHref({ filter: tab.key as FilterType })}
                      className={`flex-1 rounded-md px-1 py-2 text-center font-medium transition-colors ${
                        filter === tab.key
                          ? "bg-gray-800 text-white dark:bg-gray-700"
                          : "text-gray-600 hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
                      }`}
                    >
                      {tab.label}
                      <span
                        className={`block text-[10px] ${
                          filter === tab.key
                            ? "text-gray-300"
                            : "text-gray-500 dark:text-gray-500"
                        }`}
                      >
                        ({tab.count})
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {activeError && (
              <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
                {activeError}
              </div>
            )}

            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
              <div className="bg-gray-800 p-4 text-white dark:bg-gray-900">
                <div className="flex flex-col justify-between md:flex-row md:items-center">
                  <div className="mb-4 md:mb-0">
                    <p className="text-sm text-gray-300">
                      Showing{" "}
                      <span className="font-semibold">
                        {displayedQueries.length}
                      </span>{" "}
                      of{" "}
                      <span className="font-semibold">
                        {activeQueries.length}
                      </span>{" "}
                      {queryTabLabels[activeTab].toLowerCase()}
                    </p>
                  </div>

                  <div className="hidden space-x-2 lg:flex">
                    {[
                      { key: "all", label: "All Queries" },
                      { key: "unread", label: "New Queries" },
                      { key: "today", label: "Today" },
                    ].map((tab) => (
                      <a
                        key={tab.key}
                        href={buildHref({ filter: tab.key as FilterType })}
                        className={`rounded-md px-4 py-2 font-medium transition-colors ${
                          filter === tab.key
                            ? "bg-white text-gray-800"
                            : "text-gray-300 hover:bg-gray-700 hover:text-white"
                        }`}
                      >
                        {tab.label}
                      </a>
                    ))}
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-100 dark:border-gray-600 dark:bg-gray-700">
                      <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                        Contact
                      </th>
                      <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                        Date
                      </th>
                      <th className="hidden p-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 md:table-cell">
                        Query Details
                      </th>
                      <th className="hidden p-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 lg:table-cell">
                        Location
                      </th>
                      <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {displayedQueries.map((query) => (
                      <tr
                        key={`${query.queryType}-${query.id}`}
                        className={`transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
                          !query.isRead
                            ? "border-l-2 border-l-blue-500 bg-blue-200 dark:bg-blue-900/10"
                            : ""
                        }`}
                      >
                        <td className="p-3">
                          <div className="flex items-center space-x-3">
                            <div className="relative">
                              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gray-800 dark:bg-gray-700">
                                <span className="text-sm font-bold text-white">
                                  {(query.name || "?").charAt(0).toUpperCase()}
                                </span>
                              </div>
                              {!query.isRead && (
                                <div className="absolute -right-1 -top-1 h-2 w-2 rounded-full border border-white bg-red-500" />
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between">
                                <p
                                  className={`truncate text-sm font-medium ${
                                    !query.isRead
                                      ? "text-blue-600 dark:text-blue-400"
                                      : "text-gray-800 dark:text-gray-200"
                                  }`}
                                >
                                  {query.name}
                                </p>
                                <span className="text-xs text-gray-500 dark:text-gray-400 md:hidden">
                                  {query.phoneNumber || "No phone"}
                                </span>
                              </div>
                              <p className="mt-0.5 truncate text-xs text-gray-600 dark:text-gray-400">
                                {query.email}
                              </p>
                              <p className="mt-0.5 truncate text-xs font-medium text-gray-800 dark:text-gray-300">
                                {query.subject}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="p-3">
                          <div className="flex flex-col">
                            <p className="mt-0.5 truncate text-xs text-gray-600 dark:text-gray-400">
                              {formatDate(query.createdAt)}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {formatTime(query.createdAt)}
                            </p>
                          </div>
                        </td>

                        <td className="hidden p-3 md:table-cell">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                Phone
                              </span>
                              <p className="text-sm text-gray-700 dark:text-gray-300">
                                {query.phoneNumber || "No phone provided"}
                              </p>
                            </div>
                            {query.productCodes && (
                              <div className="max-w-xs">
                                <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                  Product Codes
                                </p>
                                <p className="truncate text-xs text-gray-600 dark:text-gray-400">
                                  {query.productCodes}
                                </p>
                              </div>
                            )}
                            <div className="max-w-xs">
                              <p className="line-clamp-2 text-xs text-gray-600 dark:text-gray-400">
                                {query.message}
                              </p>
                              {query.message.length > 100 && (
                                <button
                                  type="button"
                                  data-message-id={query.id}
                                  data-message-type={query.queryType}
                                  className="message-view-button mt-1 cursor-pointer text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
                                >
                                  View full message
                                </button>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="hidden p-3 lg:table-cell">
                          <div className="flex flex-wrap gap-1">
                            {[query.city, query.state, query.country]
                              .filter(Boolean)
                              .map((value) => (
                                <span
                                  key={value}
                                  className="rounded border border-gray-300 bg-gray-100 px-2 py-1 text-xs text-gray-700 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300"
                                >
                                  {value}
                                </span>
                              ))}
                            {![query.city, query.state, query.country].some(
                              Boolean
                            ) && (
                              <span className="text-xs italic text-gray-400 dark:text-gray-500">
                                No location
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="p-3">
                          <div className="flex flex-col items-start space-y-2">
                            {!query.isRead ? (
                              <div className="flex items-center space-x-2">
                                <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800 dark:bg-red-900/30 dark:text-red-300">
                                  NEW
                                </span>
                                <MarkAsReadButton
                                  queryId={query.id}
                                  queryType={query.queryType}
                                />
                              </div>
                            ) : (
                              <div className="flex items-center space-x-2">
                                <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                  Read
                                </span>
                                <button
                                  type="button"
                                  data-message-id={query.id}
                                  data-message-type={query.queryType}
                                  className="message-view-button cursor-pointer text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                                >
                                  View
                                </button>
                              </div>
                            )}

                            <button
                              type="button"
                              data-message-id={query.id}
                              data-message-type={query.queryType}
                              className="query-reply-button rounded bg-gray-800 px-2.5 py-1 text-xs font-medium text-white hover:bg-gray-700 dark:bg-gray-200 dark:text-gray-900 dark:hover:bg-gray-300"
                            >
                              Reply
                            </button>

                            <div className="flex flex-wrap gap-1 md:hidden">
                              {[query.city, query.state, query.country]
                                .filter(Boolean)
                                .map((value) => (
                                  <span
                                    key={value}
                                    className="rounded border border-gray-300 bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-700 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300"
                                  >
                                    {value}
                                  </span>
                                ))}
                            </div>

                            <div className="mt-1 md:hidden">
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                {query.message.substring(0, 50)}
                                {query.message.length > 50 ? "..." : ""}
                              </p>
                              {query.message.length > 50 && (
                                <button
                                  type="button"
                                  data-message-id={query.id}
                                  data-message-type={query.queryType}
                                  className="message-view-button mt-1 cursor-pointer text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
                                >
                                  View full message
                                </button>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {displayedQueries.length === 0 && (
                <div className="py-12 text-center">
                  <div className="mb-4 inline-block">
                    <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700">
                      <span className="text-2xl">?</span>
                    </div>
                  </div>
                  <h3 className="mb-2 text-lg font-medium text-gray-600 dark:text-gray-400">
                    No Queries Found
                  </h3>
                  <p className="mx-auto max-w-md text-sm text-gray-500 dark:text-gray-500">
                    {filter === "all"
                      ? `No ${queryTabLabels[
                          activeTab
                        ].toLowerCase()} are available yet.`
                      : `No ${filter} queries found.`}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 text-center">
              <div className="inline-flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                <span>Last updated: {new Date().toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <MessageModal contacts={displayedQueries} />
    </ContentLayout>
  );
}
