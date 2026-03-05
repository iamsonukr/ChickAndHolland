"use client";

import Link from "next/link";
import { Heart } from "lucide-react";

const HeaderFavouritesIcon = ({
  favourites,
  isRetailer,
}: {
  favourites: any;
  isRetailer: boolean;
}) => {
  return (
    <Link
      href={isRetailer ? "/retailer-panel/favourites" : "/my-favourites"}
      className="relative ml-2"
    >
      <p className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[#C9A39A]">
        {favourites.length}
      </p>
      <Heart className="text-[#C9A39A] hover:text-white" strokeWidth={3} />
    </Link>
  );
};

export default HeaderFavouritesIcon;