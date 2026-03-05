"use client";

import Link from "next/link";
import { Ellipsis, LogOut } from "lucide-react";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { getMenuList, getMenuListWithPermissions } from "@/lib/menuList";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  // const menuList = getMenuList(pathname, userDetails.userType);
  const menuListWithPermissions = getMenuListWithPermissions(
    pathname,
    userDetails.userType,
    userDetails.userType === "ADMIN"
      ? JSON.parse(userDetails.rolePermissions)
      : [],
  );
  const totalCount = freshCount + stockCount;

 

  return (
    <ScrollArea className="[&>div>div[style]]:!block">
      <nav className="mt-8 h-full w-full">
        <ul className="flex min-h-[calc(100vh-48px-36px-16px-32px)] flex-col items-start space-y-1 px-2 lg:min-h-[calc(100vh-32px-40px-32px)]">
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
                  <p
                    className={cn(
                      "max-w-[248px] truncate px-4 pb-2 text-sm font-medium text-muted-foreground",
                    )}
                  >
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
                                {/* <Link href={href}>
                                  <span
                                    className={cn(
                                      isOpen === false ? "" : "mr-4",
                                    )}
                                  >
                                    <Icon size={18} />
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
                                    {label === "Order Request" &&
                                      freshCount > 0 &&
                                      stockCount > 0 && (
                                        <span className="ml-5 rounded-full bg-red-500 px-2 text-xs text-white">
                                          {totalCount}
                                        </span>
                                      )}
                                  </p>
                                </Link> */}

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

                                      {label === "Enquiries" && unreadEnquiryCount > 0 && (
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
          {/* <li className="w-full grow flex items-end">
            <TooltipProvider disableHoverableContent>
              <Tooltip delayDuration={100}>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => {}}
                    variant="outline"
                    className="w-full justify-center h-10 mt-5"
                  >
                    <span className={cn(isOpen === false ? "" : "mr-4")}>
                      <LogOut size={18} />
                    </span>
                    <p
                      className={cn(
                        "whitespace-nowrap",
                        isOpen === false ? "opacity-0 hidden" : "opacity-100"
                      )}
                    >
                      Sign out
                    </p>
                  </Button>
                </TooltipTrigger>
                {isOpen === false && (
                  <TooltipContent side="right">Sign out</TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </li> */}
        </ul>
      </nav>
    </ScrollArea>
  );
}
