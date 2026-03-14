"use client";

import Link from "next/link";
import { Ellipsis, LogOut } from "lucide-react";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { getMenuListWithPermissions } from "@/lib/menuList";
import { Button } from "@/components/ui/button";
import { CollapseMenuButton } from "@/components/custom/admin-panel/colllapseMenuButton";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";

interface MenuProps {
  isOpen: boolean | undefined;
  userDetails?: any;
  freshCount: any;
  stockCount: any;
  unreadEnquiryCount: number;
}

export function Menu({
  isOpen,
  userDetails,
  freshCount,
  stockCount,
  unreadEnquiryCount,
}: MenuProps) {
  const pathname = usePathname();
  const menuListWithPermissions = getMenuListWithPermissions(
    pathname,
    userDetails.userType,
    userDetails.userType === "ADMIN"
      ? JSON.parse(userDetails.rolePermissions)
      : [],
  );
  const totalCount = freshCount + stockCount;

  return (
    // ✅ Removed ScrollArea — the parent div in Sidebar already handles overflow-y-auto
    <nav className="mt-8 w-full">
      <ul className="flex flex-col items-start space-y-1 px-2">
        {/* ✅ Removed min-h-[calc(100vh-...)] — this was forcing content to be too tall */}
        {menuListWithPermissions.map(({ groupLabel, menus }, index) => {
          if (
            menus?.find((menu) => menu?.canAccess)?.submenus?.length ??
            0 <= 0
          ) {
            return null;
          }

          return (
            <li
              className={cn("w-full", groupLabel ? "pt-5" : "")}
              key={index}
            >
              {(isOpen && groupLabel) || isOpen === undefined ? (
                <p className="max-w-[248px] truncate px-4 pb-2 text-sm font-medium text-muted-foreground">
                  {groupLabel}
                </p>
              ) : !isOpen && isOpen !== undefined && groupLabel ? (
                <TooltipProvider>
                  <Tooltip delayDuration={100}>
                    <TooltipTrigger className="w-full">
                      <div className="flex w-full items-center justify-center">
                        <Ellipsis className="h-5 w-5" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p>{groupLabel}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <p className="pb-2"></p>
              )}
              {menus.map(
                (
                  { href, label, icon: Icon, active, submenus, canAccess },
                  index,
                ) =>
                  submenus.length === 0 ? (
                    <div
                      className={cn("w-full", !canAccess && "hidden")}
                      key={index}
                    >
                      <TooltipProvider disableHoverableContent>
                        <Tooltip delayDuration={100}>
                          <TooltipTrigger asChild>
                            <Button
                              variant={active ? "default" : "ghost"}
                              className="mb-1 h-10 w-full justify-start"
                              asChild
                            >
                              <Link href={href}>
                                <span
                                  className={cn(
                                    isOpen === false ? "" : "mr-4",
                                    "relative",
                                  )}
                                >
                                  <Icon size={18} />
                                  {label === "Order Request" &&
                                    totalCount > 0 && (
                                      <span className="absolute -right-2 -top-1 flex h-4 w-4 animate-bounce items-center justify-center rounded-full bg-red-600 text-[10px] text-white">
                                        {totalCount}
                                      </span>
                                    )}
                                  {label === "Enquiries" &&
                                    unreadEnquiryCount > 0 && (
                                      <span className="absolute -right-2 -top-1 flex h-4 w-4 animate-bounce items-center justify-center rounded-full bg-red-600 text-[10px] text-white">
                                        {unreadEnquiryCount}
                                      </span>
                                    )}
                                </span>
                                <p
                                  className={cn(
                                    "max-w-[200px] truncate",
                                    isOpen === false
                                      ? "-translate-x-96 opacity-0"
                                      : "translate-x-0 opacity-100",
                                  )}
                                >
                                  {label}
                                </p>
                              </Link>
                            </Button>
                          </TooltipTrigger>
                          {isOpen === false && (
                            <TooltipContent side="right">
                              {label}
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  ) : (
                    <div className="w-full" key={index}>
                      <CollapseMenuButton
                        icon={Icon}
                        label={label}
                        active={active}
                        submenus={submenus}
                        isOpen={isOpen}
                      />
                    </div>
                  ),
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}