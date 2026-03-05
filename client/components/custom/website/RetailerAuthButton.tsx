"use client";

import { Button } from "@/components/ui/button";
import { usePathname, useRouter } from "next/navigation";

const RetailerAuthButton = ({
  isLoggedIn,
  isRetailer,
}: {
  isLoggedIn: boolean;
  isRetailer: boolean;
}) => {
  const pathName = usePathname();
  const router = useRouter();

  return (
    <Button
      onClick={() => {
        if (isLoggedIn) {
          if (isRetailer) {
            router.push("/retailer-panel");
          } else {
            router.push("/admin-panel");
          }
          return;
        }
        router.push(`/retailer-login?redirect=${pathName}`);
      }}
      className="font-helveticaneuemedium bg-none text-xl font-black text-[#C9A39A] hover:text-white md:text-sm 2xl:text-xl 3xl:text-2xl 4xl:text-3xl"
    >
      {isLoggedIn ? (isRetailer ? "RETAILER PANEL" : "ADMIN PANEL") : "LOGIN"}
    </Button>
  );
};

export default RetailerAuthButton;
