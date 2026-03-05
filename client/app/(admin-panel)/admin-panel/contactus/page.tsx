import { API_URL } from "../../../../lib/constants";
import { cookies } from "next/headers";
import { ContentLayout } from "@/components/custom/admin-panel/contentLayout";
import { MarkAsReadButton } from "./mark-as-read-button.tsx";
import CustomSearchBar from "@/components/custom/admin-panel/customSearchBar";
import { MessageModal } from "./message-modal";

type FilterType = "all" | "unread" | "today";

async function getContacts(filter: FilterType, search: string = "") {
  const token = (await cookies()).get("token")?.value || "";

  const res = await fetch(`${API_URL}/contactus`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      cache: "no-store",
    },
  });

  const data = await res.json();
  let contacts = Array.isArray(data) ? data : data.data ?? [];

  // 🔍 Search (screenshot style)
  if (search) {
    const q = search.toLowerCase();
    contacts = contacts.filter(
      (c: any) =>
        c.name?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.subject?.toLowerCase().includes(q) ||
        c.message?.toLowerCase().includes(q)
    );
  }

  if (filter === "unread") return contacts.filter((c: any) => !c.isRead);
  if (filter === "today")
    return contacts.filter(
      (c: any) =>
        new Date(c.createdAt).toDateString() === new Date().toDateString()
    );

  return contacts;
}

// Fix for dynamic API usage - use this export
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface ContactUsPageProps {
  searchParams: Promise<{
    filter?: string;
    q?: string;
  }>;
}

export default async function ContactUsPage(props: ContactUsPageProps) {
  // Await the searchParams promise
  const searchParams = await props.searchParams;
  const filter: FilterType = (searchParams.filter as FilterType) || "all";
  const q = searchParams.q ? decodeURIComponent(searchParams.q) : "";

  const allContacts = await getContacts("all", q);
  const displayedContacts = await getContacts(filter, q);

  const unreadCount = allContacts.filter((c) => !c.isRead).length;
  const todayCount = allContacts.filter(
    (c) => new Date(c.createdAt).toDateString() === new Date().toDateString()
  ).length;

  return (
    <ContentLayout
      title={
        <span className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
          Enquiries
        </span>
      }
    >
      
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="p-4 md:p-6">
          <div className="max-w-7xl mx-auto">

             {/* Search Bar */}
            <div className="w-full mb-6">
              <CustomSearchBar query={q} placeholder="Search enquiries..." />
            </div>
            
            {/* Filter Tabs - Mobile */}
            <div className="lg:hidden mb-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-1 shadow border border-gray-200 dark:border-gray-700">
                <div className="flex space-x-1">
                  {[
                    { key: "all", label: "All", count: allContacts.length },
                    { key: "unread", label: "New", count: unreadCount },
                    { key: "today", label: "Today", count: todayCount },
                  ].map((tab) => (
                    <a
                      key={tab.key}
                      href={`?filter=${tab.key}`}
                      className={`flex-1 text-center py-2 px-1 rounded-md font-medium transition-colors ${
                        filter === tab.key
                          ? "bg-gray-800 text-white dark:bg-gray-700"
                          : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                    >
                      {tab.label}
                      <span className={`ml-1 text-xs ${
                        filter === tab.key ? "text-gray-300" : "text-gray-500 dark:text-gray-500"
                      }`}>
                        ({tab.count})
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Table Container */}
            <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
              
              {/* Table Header */}
              <div className="bg-gray-800 dark:bg-gray-900 text-white p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between">
                  <div className="mb-4 md:mb-0">
                    <p className="text-gray-300 text-sm">
                      Showing <span className="font-semibold">{displayedContacts.length}</span> of{" "}
                      <span className="font-semibold">{allContacts.length}</span> messages
                    </p>
                  </div>
                  
                  {/* Filter Tabs - Desktop */}
                  <div className="hidden lg:flex space-x-2">
                    {[
                      { key: "all", label: "All Messages" },
                      { key: "unread", label: "New Messages" },
                      { key: "today", label: "Today" },
                    ].map((tab) => (
                      <a
                        key={tab.key}
                        href={`?filter=${tab.key}`}
                        className={`px-4 py-2 rounded-md font-medium transition-colors ${
                          filter === tab.key
                            ? "bg-white text-gray-800"
                            : "text-gray-300 hover:text-white hover:bg-gray-700"
                        }`}
                      >
                        {tab.label}
                      </a>
                    ))}
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                      <th className="p-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="p-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="p-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider hidden md:table-cell">
                        Message Details
                      </th>
                      <th className="p-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider hidden lg:table-cell">
                        Location
                      </th>
                      <th className="p-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {displayedContacts.map((c: any, index: number) => (
                      <tr 
                        key={c.id} 
                        className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
                          !c.isRead ? 'bg-blue-200 dark:bg-blue-900/10 border-l-2 border-l-blue-500' : ''
                        }`}
                      >
                        {/* Contact Name */}
                        <td className="p-3">
                          <div className="flex items-center space-x-3">
                            {/* Avatar */}
                            <div className="relative">
                              <div className="w-8 h-8 bg-gray-800 dark:bg-gray-700 rounded-md flex items-center justify-center">
                                <span className="font-bold text-sm text-white">
                                  {c.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              
                              {/* Unread Notification Dot */}
                              {!c.isRead && (
                                <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-white"></div>
                              )}
                            </div>

                            {/* Contact Info */}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between">
                                <p className={`font-medium text-sm truncate ${
                                  !c.isRead 
                                    ? 'text-blue-600 dark:text-blue-400' 
                                    : 'text-gray-800 dark:text-gray-200'
                                }`}>
                                  {c.name}
                                </p>
                                {/* Mobile Phone */}
                                <span className="md:hidden text-xs text-gray-500 dark:text-gray-400">
                                  {c.phoneNumber || "No phone"}
                                </span>
                              </div>
                              <p className="text-xs text-gray-600 dark:text-gray-400 truncate mt-0.5">
                                {c.email}
                              </p>
                              <p className="text-xs font-medium text-gray-800 dark:text-gray-300 truncate mt-0.5">
                                {c.subject}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Date Column */}
                        <td className="p-3">
                          <div className="flex flex-col">
                            <p className="text-xs text-gray-600 dark:text-gray-400 truncate mt-0.5">
                              {new Date(c.createdAt).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(c.createdAt).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit',
                                hour12: true 
                              })}
                            </p>
                          </div>
                        </td>

                        {/* Desktop Message Details */}
                        <td className="p-3 hidden md:table-cell">
                          <div className="space-y-1">
                            {/* Phone Number */}
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-gray-500 dark:text-gray-400">📱</span>
                              <p className="text-sm text-gray-700 dark:text-gray-300">
                                {c.phoneNumber || "No phone provided"}
                              </p>
                            </div>
                            
                            {/* Message Preview */}
                            <div className="max-w-xs">
                              <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                                {c.message}
                              </p>
                              {c.message.length > 100 && (
                                <button
                                  type="button"
                                  data-message-id={c.id}
                                  className="message-view-button text-xs font-medium mt-1 text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                                >
                                  View full message →
                                </button>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Desktop Location */}
                        <td className="p-3 hidden lg:table-cell">
                          <div className="flex flex-wrap gap-1">
                            {c.country ? (
                              <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded border border-gray-300 dark:border-gray-600">
                                {c.country}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400 dark:text-gray-500 italic">
                                No country
                              </span>
                            )}
                            
                            {c.state && (
                              <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded border border-gray-300 dark:border-gray-600">
                                {c.state}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Status Column */}
                        <td className="p-3">
                          <div className="flex flex-col items-start space-y-2">
                            {/* Status Badge */}
                            {!c.isRead ? (
                              <div className="flex items-center space-x-2">
                                <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 text-xs rounded-full font-medium">
                                  NEW
                                </span>
                                <MarkAsReadButton contactId={c.id} />
                              </div>
                            ) : (
                              <div className="flex items-center space-x-2">
                                <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs rounded-full font-medium">
                                  Read
                                </span>
                                <button
                                  type="button"
                                  data-message-id={c.id}
                                  className="message-view-button text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer"
                                >
                                  View
                                </button>
                              </div>
                            )}
                            
                            {/* Mobile Location Badges */}
                            <div className="flex flex-wrap gap-1 md:hidden">
                              {c.country && (
                                <span className="px-1.5 py-0.5 text-[10px] bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded border border-gray-300 dark:border-gray-600">
                                  {c.country}
                                </span>
                              )}
                              {c.state && (
                                <span className="px-1.5 py-0.5 text-[10px] bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded border border-gray-300 dark:border-gray-600">
                                  {c.state}
                                </span>
                              )}
                            </div>
                            
                            {/* Mobile Message Preview */}
                            <div className="md:hidden mt-1">
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                {c.message.substring(0, 50)}...
                              </p>
                              {c.message.length > 50 && (
                                <button
                                  type="button"
                                  data-message-id={c.id}
                                  className="message-view-button text-xs font-medium mt-1 text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
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

              {/* Empty State */}
              {displayedContacts.length === 0 && (
                <div className="text-center py-12">
                  <div className="inline-block mb-4">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">📭</span>
                    </div>
                  </div>
                  <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">
                    No Messages Found
                  </h3>
                  <p className="text-gray-500 dark:text-gray-500 max-w-md mx-auto text-sm">
                    {filter === "all" 
                      ? "The inbox is currently empty. New customer inquiries will appear here." 
                      : `No ${filter} messages found.`}
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="mt-6 text-center">
              <div className="inline-flex items-center space-x-2 text-gray-500 dark:text-gray-400 text-xs">
                <span>•</span>
                <span>Last updated: {new Date().toLocaleString()}</span>
                <span>•</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Client-side Message Modal Component */}
      <MessageModal contacts={displayedContacts} />
    </ContentLayout>
  );
}