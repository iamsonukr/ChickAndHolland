import { Navbar } from "@/components/custom/admin-panel/navbar";
import { API_URL } from "@/lib/constants";
import { cookies } from "next/headers";

interface ContentLayoutProps {
  title: string;
  children: React.ReactNode;
}

export async function ContentLayout({ title, children }: ContentLayoutProps) {
  const cookieStore = await cookies();
  const userType = cookieStore.get("userType")?.value;
  const rolePermissions = cookieStore.get("rolePermissions")?.value;
  const token = cookieStore.get("token")?.value;
  const userId = cookieStore.get("userId")?.value;
  let accountDisplayName = cookieStore.get("accountDisplayName")?.value;
  let accountUsername = cookieStore.get("accountUsername")?.value;
  const fallbackName = userType === "RETAILER" ? "Retailer" : "Admin";
  const fallbackUsername = userType === "RETAILER" ? "retailer" : "admin";

  if (
    userType === "ADMIN" &&
    token &&
    userId &&
    (!accountDisplayName || !accountUsername)
  ) {
    try {
      const response = await fetch(`${API_URL}/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });

      if (response.ok) {
        const data = await response.json();
        const userData = data?.data ?? data?.user ?? data;

        accountDisplayName ||= userData?.name || userData?.username;
        accountUsername ||= userData?.username || accountDisplayName;
      }
    } catch {}
  }

  const userDetails = {
    userType,
    rolePermissions,
    name: accountDisplayName || fallbackName,
    username: accountUsername || accountDisplayName || fallbackUsername,
  };

  return (
    <div className="min-w-0">
      <Navbar title={title} userDetails={userDetails} />
      <div className="min-w-0 pb-8 pt-3 sm:pt-4">{children}</div>
    </div>
  );
}
