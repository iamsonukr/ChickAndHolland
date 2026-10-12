import { ItemsProvider } from "./Delete";

export default function OrdersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ItemsProvider>{children}</ItemsProvider>;
}
