"use client";

import { cn } from "@/lib/utils";
import { useStore } from "@/lib/hooks/useStore";
import { Sidebar } from "@/components/custom/admin-panel/sidebar";
import { useSidebarToggle } from "@/lib/hooks/useSidebarToggle";

export default function AdminPanelLayout({
  children,
  userDetails,
  freshCount,
  stockCount,
  unreadEnquiryCount,
  draftCount,
}: {
  children: React.ReactNode;
  userDetails: any;
  freshCount: number;
  stockCount: number;
  unreadEnquiryCount: number;
  draftCount?: number;
}) {
  const sidebar = useStore(useSidebarToggle, (state) => state);
  if (!sidebar) return null;
  return (
    <>
      <Sidebar
        userDetails={userDetails}
        freshCount={freshCount}
        stockCount={stockCount}
        unreadEnquiryCount={unreadEnquiryCount}
        draftCount={draftCount}
      />
      <main
        className={cn(
          "min-h-dvh min-w-0 bg-background transition-[margin-left] duration-300 ease-in-out",
          sidebar?.isOpen === false ? "lg:ml-[90px]" : "lg:ml-72",
        )}
      >
        <div className="min-w-0 px-3 py-3 sm:px-4 sm:py-4 lg:px-5">
          {children}
        </div>
      </main>
    </>
  );
}
