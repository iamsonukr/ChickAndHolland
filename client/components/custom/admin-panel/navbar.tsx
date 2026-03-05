"use client";

import ThemeToggle from "@/components/theme-toggle";
import { UserNav } from "@/components/custom/admin-panel/userNav";
import { SheetMenu } from "@/components/custom/admin-panel/sheetMenu";
// import NotificationBell from "@/components/custom/admin-panel/NotificationBell";

interface NavbarProps {
  title: string;
  userDetails: any;
}

export function Navbar({ title, userDetails }: NavbarProps) {
  return (
    <header className="sticky top-0 z-50 w-full bg-background/95 shadow backdrop-blur supports-[backdrop-filter]:bg-background/60 dark:shadow-secondary">
      <div className="mx-4 flex h-14 items-center justify-between sm:mx-8">
        
        {/* Left Section */}
        <div className="flex items-center gap-4 lg:gap-6">
          <SheetMenu userDetails={userDetails} />
          <h1 className="font-bold text-lg tracking-wide">{title}</h1>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {/* <NotificationBell /> */}
          <ThemeToggle />
          <UserNav
            user={{
              name: userDetails?.name || "Admin",
              username: userDetails?.username || "admin",
            }}
          />
        </div>

      </div>
    </header>
  );
}
