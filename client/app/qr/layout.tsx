import type { ReactNode } from "react";

export const metadata = {
  title: "Chic & Holland",
  robots: { index: false, follow: false },
};

export default function QrLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#fff" }}>{children}</body>
    </html>
  );
}
