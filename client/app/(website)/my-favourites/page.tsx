import { cookies } from "next/headers";
import ShowMyFavourites from "./ShowMyFavourites";
import { getFavourites } from "@/lib/data";
import { Metadata } from "next";

const MyFavourites = async () => {
  const isLoggedIn = (await cookies()).get("token")?.value ? true : false;
  const isRetailer = (await cookies()).get("userType")?.value === "RETAILER";
  const retailerId = (await cookies()).get("retailerId")?.value;
  const localFavourites = JSON.parse(
    (await cookies()).get("favourites")?.value || "[]",
  );

  let favourites: any = {};

  if (isLoggedIn && isRetailer) {
    favourites = await getFavourites(Number(retailerId));
  } else {
    favourites = { favourites: localFavourites };
  }

  return (
    <div>
      <ShowMyFavourites
        favourites={favourites?.favourites}
        isLoggedIn={isLoggedIn}
        isRetailer={isRetailer}
        retailerId={retailerId as string}
        rr={favourites.rr}
      />
    </div>
  );
};

export default MyFavourites;

export const metadata: Metadata = {
  title: "Chic & Holland - My Favourites",
  description: "Favourites page of Chic & Holland",
};
