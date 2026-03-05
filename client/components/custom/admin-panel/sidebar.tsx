import Link from "next/link";
import { PanelsTopLeft } from "lucide-react";

import { cn } from "@/lib/utils";
import { useStore } from "@/lib/hooks/useStore";
import { Button } from "@/components/ui/button";
import { Menu } from "@/components/custom/admin-panel/menu";
import { useSidebarToggle } from "@/lib/hooks/useSidebarToggle";
import { SidebarToggle } from "@/components/custom/admin-panel/sideBarToggle";

export function Sidebar({ userDetails,freshCount, stockCount,unreadEnquiryCount  }: any) {
  const sidebar = useStore(useSidebarToggle, (state) => state);

  if (!sidebar) return null;

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-20 h-screen -translate-x-full bg-secondary transition-[width] duration-300 ease-in-out lg:translate-x-0",
        sidebar?.isOpen === false ? "w-[90px]" : "w-72",
      )}
    >
      <SidebarToggle isOpen={sidebar?.isOpen} setIsOpen={sidebar?.setIsOpen} />
      <div className="relative flex h-full flex-col overflow-y-auto px-3 py-4 shadow-md dark:shadow-zinc-800">
        <Button
          className={cn(
            "mb-1 transition-transform duration-300 ease-in-out",
            sidebar?.isOpen === false ? "translate-x-1" : "translate-x-0",
          )}
          variant="link"
          asChild
        >
          <Link href="/" className="flex items-center gap-2">
            <PanelsTopLeft className="mr-1 h-6 w-6" />
            <h1
              className={cn(
                "whitespace-nowrap text-lg font-bold transition-[transform,opacity,display] duration-300 ease-in-out",
                sidebar?.isOpen === false
                  ? "hidden -translate-x-96 opacity-0"
                  : "translate-x-0 opacity-100",
              )}
            >
              Chic & Holland
            </h1>
          </Link>
        </Button>
        <Menu isOpen={sidebar?.isOpen} userDetails={userDetails} freshCount={freshCount} stockCount={stockCount}   unreadEnquiryCount={unreadEnquiryCount}
  />
      </div>
    </aside>
  );
}
