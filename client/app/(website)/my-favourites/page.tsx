import { cookies } from "next/headers";
import type { Metadata } from "next";
import ShowMyFavourites from "./ShowMyFavourites";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "My Favourites | Chic & Holland",
  description: "View your saved favorite items from Chic & Holland.",
};

const MyFavourites = async () => {
  const cookieStore = await cookies();
  const isRetailer = cookieStore.get("userType")?.value === "RETAILER";

  // Retailers have a dedicated Cart — send them there
  if (isRetailer) {
    redirect("/retailer-panel/favourites");
  }

  const localFavourites = JSON.parse(
    cookieStore.get("favourites")?.value || "[]",
  );

  return (
    <div>
      <ShowMyFavourites
        favourites={localFavourites}
        isLoggedIn={false}
        isRetailer={false}
        retailerId={""}
        rr={[]}
      />
    </div>
  );
};

export default MyFavourites;
