import { ItemsProvider } from "./Delete";
import { cookies } from "next/headers";

export default async function OrdersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const storageKey = `all-orders-selection:${cookieStore.get("userType")?.value ?? ""}:${cookieStore.get("userId")?.value ?? ""}`;
  return (
    <ItemsProvider key={storageKey} storageKey={storageKey}>
      {children}
    </ItemsProvider>
  );
}
