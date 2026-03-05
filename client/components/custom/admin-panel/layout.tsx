"use client";

import { cn } from "@/lib/utils";
import { useStore } from "@/lib/hooks/useStore";
import { Sidebar } from "@/components/custom/admin-panel/sidebar";
import { useSidebarToggle } from "@/lib/hooks/useSidebarToggle";
import NotificationsBell from "@/components/NotificationsBell";

export default function AdminPanelLayout({
  children,
  userDetails,
  freshCount,
  stockCount,
  unreadEnquiryCount ,  
}: {
  children: React.ReactNode;
  userDetails: any;
  freshCount:any;
  stockCount:any;
    unreadEnquiryCount: any;  // <-- Add here

}) {
  const sidebar = useStore(useSidebarToggle, (state) => state);
  if (!sidebar) return null;
  return (
    <>
      <Sidebar userDetails={userDetails} freshCount={freshCount} stockCount={stockCount}   unreadEnquiryCount={unreadEnquiryCount}
 />
     <main
  className={cn(
    "min-h-dvh bg-background transition-[margin-left] duration-300 ease-in-out",
    sidebar?.isOpen === false ? "lg:ml-[90px]" : "lg:ml-72",
  )}
>
 

  {/* Page Content */}
  <div className="p-4">
    {children}
  </div>
</main>
    </>
  );
}
