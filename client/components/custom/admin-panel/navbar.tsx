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
  const user = {
    name: userDetails?.name || "Admin",
    username: userDetails?.username || "admin",
  };
  const showUsername =
    user.username &&
    user.username.toLowerCase() !== user.name.toLowerCase();

  return (
    <header className="sticky top-0 z-50 w-full bg-background/95 shadow backdrop-blur supports-[backdrop-filter]:bg-background/60 dark:shadow-secondary">
      <div className="mx-3 flex h-14 min-w-0 items-center justify-between gap-2 sm:mx-4 lg:mx-6">
        <div className="flex min-w-0 items-center gap-2 sm:gap-4 lg:gap-6">
          <SheetMenu userDetails={userDetails} />
          <h1 className="truncate text-base font-bold tracking-wide sm:text-lg">
            {title}
          </h1>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <div className="hidden max-w-[180px] flex-col items-end text-right sm:flex">
            <span className="truncate text-sm font-semibold">{user.name}</span>
            {showUsername && (
              <span className="truncate text-xs text-muted-foreground">
                {user.username}
              </span>
            )}
          </div>
          <UserNav user={user} />
        </div>
      </div>
    </header>
  );
}
