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
  const retailerId = cookieStore.get("retailerId")?.value;
  let accountDisplayName = cookieStore.get("accountDisplayName")?.value;
  let accountUsername = cookieStore.get("accountUsername")?.value;
  let accountStoreName = cookieStore.get("accountStoreName")?.value;
  const fallbackName = userType === "RETAILER" ? "Retailer" : "Admin";
  const fallbackUsername = userType === "RETAILER" ? "retailer" : "admin";
  const fallbackStoreName = userType === "RETAILER" ? "Store" : "Chic & Holland";

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
        accountStoreName ||= userData?.storeName;
      }
    } catch {}
  }

  if (userType === "RETAILER" && retailerId) {
    try {
      const response = await fetch(`${API_URL}/retailers/${retailerId}`, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });

      if (response.ok) {
        const data = await response.json();
        const retailerData = data?.retailer ?? data?.data ?? data;

        accountDisplayName = retailerData?.name || accountDisplayName;
        accountUsername ||= retailerData?.username || accountDisplayName;
        accountStoreName ||= retailerData?.storeName;
      }
    } catch {}
  }

  const userDetails = {
    userType,
    rolePermissions,
    name: accountDisplayName || fallbackName,
    username: accountUsername || accountDisplayName || fallbackUsername,
    storeName: accountStoreName || fallbackStoreName,
  };

  return (
    <div className="min-w-0">
      <Navbar title={title} userDetails={userDetails} />
      <div className="min-w-0 pb-8 pt-3 sm:pt-4">{children}</div>
    </div>
  );
}
