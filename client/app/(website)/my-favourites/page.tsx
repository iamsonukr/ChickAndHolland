import { cookies } from "next/headers";
import ShowMyFavourites from "./ShowMyFavourites";
import { Metadata } from "next";
import { redirect } from "next/navigation";

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

export const metadata: Metadata = {
  title: "Chic & Holland - My Favourites",
  description: "Favourites page of Chic & Holland",
};
