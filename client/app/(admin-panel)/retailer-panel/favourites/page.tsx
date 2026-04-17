import { cookies } from "next/headers";
import { getCart } from "@/lib/data";
import Data from "./Data";
import { ContentLayout } from "@/components/custom/admin-panel/contentLayout";

const RetailerCart = async () => {
  const cookieStore = await cookies();
  const isLoggedIn = !!cookieStore.get("token")?.value;
  const retailerId = cookieStore.get("retailerId")?.value;

  let cartItems = { favourites: [] };

  if (isLoggedIn && retailerId) {
    cartItems = await getCart(Number(retailerId));
  }

  return (
    <ContentLayout title="Cart">
      <div className="p-4">
        <Data
          favourites={cartItems}
          retailerId={retailerId}
        />
      </div>
    </ContentLayout>
  );
};

export default RetailerCart;