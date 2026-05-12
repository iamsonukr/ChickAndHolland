"use client";

import ThemeToggle from "@/components/theme-toggle";
import { UserNav } from "@/components/custom/admin-panel/userNav";
import { SheetMenu } from "@/components/custom/admin-panel/sheetMenu";

interface NavbarProps {
  title: string;
  userDetails: any;
}

/** * Fixed JS capitalize function: 
 * Added 'return' and ensures the rest of the word is lowercase 
 */
const capitalize = (str: string) => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export function Navbar({ title, userDetails }: NavbarProps) {
  const user = {
    name: userDetails?.name || "Admin",
    username: userDetails?.username || "admin",
  };

  console.log("Navbar user details:", userDetails);
  // Logic to hide username if it's identical to the display name
  const showUsername =
    user.username &&
    user.username.toLowerCase() !== user.name.toLowerCase();

  return (
    <header className="sticky top-0 z-50 w-full bg-background/95 shadow backdrop-blur supports-[backdrop-filter]:bg-background/60 dark:shadow-secondary">
      <div className="mx-3 flex h-14 min-w-0 items-center justify-between gap-2 sm:mx-4 lg:mx-6">

        {/* Left Side: Mobile Menu & Title */}
        <div className="flex min-w-0 items-center gap-2 sm:gap-4 lg:gap-6">
          <SheetMenu userDetails={userDetails} />
          <h1 className="truncate text-base font-bold tracking-wide sm:text-lg">
            {title}
          </h1>
        </div>

        {/* Right Side: Theme, User Info, & Avatar */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <ThemeToggle />

          <div className="hidden max-w-[180px] flex-col items-end text-right sm:flex">
            {/* Added 'capitalize' class here to fix "sonu" -> "Sonu" */}
            <span className="truncate text-sm font-semibold">
              Hi, {user?.name?.split(" ")[0] || "User"}
            </span>

            {showUsername && (
              <span className="truncate text-xs text-muted-foreground capitalize">
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