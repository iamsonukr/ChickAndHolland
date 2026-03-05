// import type { Metadata } from "next";
// import { Inter } from "next/font/google";
// import "../globals.css";
// import { ThemeProvider } from "@/components/theme-provider";
// import { Toaster } from "@/components/ui/sonner";
// import AdminPanelLayout from "@/components/custom/admin-panel/layout";
// import { cookies } from "next/headers";
// import { getAdminRetailersFreshOrders, getAdminRetailersStockOrders } from "@/lib/data";

// // const kalam = Kalam({ subsets: ["latin"], weight: ["300", "400", "700"] });
// const inter = Inter({ subsets: ["latin"] });

// export async function generateMetadata(): Promise<Metadata> {
//   const userType = (await cookies()).get("userType")?.value;

//   console.log("userType", userType);

//   return {
//     title:
//       userType === "RETAILER"
//         ? "Chic & Holland Retailer Panel"
//         : "Chic & Holland Admin Panel",
//     description:
//       userType === "RETAILER"
//         ? "Chic & Holland Retailer Panel"
//         : "Chic & Holland Admin Panel",
//   };
// }

// export default async function RootLayout({
//   children,
// }: Readonly<{
//   children: React.ReactNode;
// }>) {
//   const userType = (await cookies()).get("userType")?.value;
//   const rolePermissions =
//     (await cookies()).get("rolePermissions")?.value != "null" &&
//     (await cookies()).get("rolePermissions")?.value
//       ? (await cookies()).get("rolePermissions")?.value
//       : "[]";

//   const userDetails = {
//     userType,
//     rolePermissions,
//   };
//    const myFreshOrders = await getAdminRetailersFreshOrders({
//       page: 1,
//       query:"",
//     });

//  const myStockOrders = await getAdminRetailersStockOrders({
//     page: 1,
//     query:"",
//   });

//   return (
//    <html lang="en" suppressHydrationWarning>
//   <body className={inter.className}>
//   <ThemeProvider
//           attribute="class"
//           defaultTheme="system"
//           enableSystem
//           // disableTransitionOnChange
//         >
//           <AdminPanelLayout userDetails={userDetails} freshCount={myFreshOrders.favoritesOrders?.length} stockCount={myStockOrders.stockOrders?.length}>
//             {children}
//           </AdminPanelLayout>
//           <Toaster />
//         </ThemeProvider>
//       </body>
//     </html>
//   );
// }

// export const dynamic = "force-dynamic";


import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import AdminPanelLayout from "@/components/custom/admin-panel/layout";
import { cookies } from "next/headers";
import {
  getAdminRetailersFreshOrders,
  getAdminRetailersStockOrders,
} from "@/lib/data";
import { API_URL } from "@/lib/constants";


const inter = Inter({ subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  const userType = (await cookies()).get("userType")?.value;

  return {
    title:
      userType === "RETAILER"
        ? "Chic & Holland Retailer Panel"
        : "Chic & Holland Admin Panel",
    description:
      userType === "RETAILER"
        ? "Chic & Holland Retailer Panel"
        : "Chic & Holland Admin Panel",
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userType = (await cookies()).get("userType")?.value;
  const rolePermissions =
    (await cookies()).get("rolePermissions")?.value != "null" &&
    (await cookies()).get("rolePermissions")?.value
      ? (await cookies()).get("rolePermissions")?.value
      : "[]";

  const userDetails = {
    userType,
    rolePermissions,
  };

  const myFreshOrders = await getAdminRetailersFreshOrders({
    page: 1,
    query: "",
  });

  const myStockOrders = await getAdminRetailersStockOrders({
    page: 1,
    query: "",
  });


  const unreadEnquiryCount = async () => {
  const token = (await cookies()).get("token")?.value || "";

  const res = await fetch(`${API_URL}/contactus`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  const data = await res.json();
  const contacts = Array.isArray(data) ? data : data.data ?? [];
  return contacts.filter((c: any) => !c.isRead).length;
};

const unreadCount = await unreadEnquiryCount();

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AdminPanelLayout
            userDetails={userDetails}
            freshCount={myFreshOrders.favoritesOrders?.length || 0}
            stockCount={myStockOrders.stockOrders?.length || 0}
              unreadEnquiryCount={unreadCount}

          >
            {children}
          </AdminPanelLayout>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}

export const dynamic = "force-dynamic";
