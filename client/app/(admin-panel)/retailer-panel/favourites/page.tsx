import { cookies } from "next/headers";
import { getFavourites } from "@/lib/data";
import Data from "./Data"; // ⬅ ensure correct import

const RetailerFavourites = async () => {
  const cookieStore = await cookies();
  const isLoggedIn = !!cookieStore.get("token")?.value;
  const retailerId = cookieStore.get("retailerId")?.value;

  let favourites = { favourites: [] };

  if (isLoggedIn && retailerId) {
    favourites = await getFavourites(Number(retailerId));
  }

  return (
    <div className="p-4">
      <Data
        favourites={favourites}
        retailerId={retailerId}
      />
    </div>
  );
};

export default RetailerFavourites;