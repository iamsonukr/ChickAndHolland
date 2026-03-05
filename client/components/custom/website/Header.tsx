import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { HoverCard, HoverCardTrigger } from "@/components/ui/hover-card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarTrigger,
} from "@/components/ui/menubar";

import Link from "next/link";
import { getCategories, getFavourites } from "@/lib/data";
import { ChevronDown, Heart, Menu, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cookies } from "next/headers";
import SearchBar from "../Search";
import HeaderFavouritesIcon from "@/components/custom/website/HeaderFavouritesIcon";
import RetailerAuthButton from "@/components/custom/website/RetailerAuthButton";

const Header = async () => {
  const isLoggedIn = !!(await cookies()).get("token")?.value;
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

  const categories = await getCategories();

  const sortedCategories = categories
    ?.sort((a: any, b: any) => a.priority - b.priority)
    .map((category: any) => {
      category.subCategories = category.subCategories.sort((a: any, b: any) => {
        return a.priority - b.priority;
      });
      return category;
    });

  return (
    <div className="sticky top-0 z-10 h-[90px] max-h-[120px] w-full bg-background shadow-md lg:h-[120px] 2xl:h-[120px] 2xl:max-h-[120px] 3xl:h-[125px] 3xl:max-h-[150px] 4xl:h-[150px] 4xl:max-h-[150px]">
      <header className="flex h-[90px] md:h-[130px] flex-row items-center justify-around bg-black md:justify-between md:px-[2rem] lg:flex-col 3xl:h-[150px]">
        {/* tablet/mobile view */}
        <div className="lg:hidden">
          <Menubar className="border-none bg-black p-0 text-[#C9A39A]">
            <MenubarMenu>
              <MenubarTrigger className="bg-black px-0 py-0">
                <Menu className="bg-black font-bold text-[#C9A39A]" />
              </MenubarTrigger>
              <MenubarContent className="mt-8 !w-screen border-none bg-black">
                <MenubarItem className="!w-full" asChild>
                  <Link
                    href={"/"}
                    className="font-brandon w-full text-xl  text-[#C9A39A]"
                  >
                    HOME
                  </Link>
                </MenubarItem>
                <MenubarItem className="!w-full" asChild>
                  <Link
                    href={"/brand"}
                    className="font-brandon text-xl  text-[#C9A39A]"
                  >
                    BRAND
                  </Link>
                </MenubarItem>

                <Collapsible>
                  <CollapsibleTrigger asChild>
                    <Button className="w-full !bg-transparent !px-[6px] !py-0 !text-start">
                      <p className="font-brandon w-full !p-0 text-start text-xl  text-[#C9A39A]">
                        COLLECTIONS
                      </p>
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent asChild>
                    <div className="mt-2 flex flex-col gap-3">
                      {sortedCategories.map((category: any) => (
                        <Collapsible key={category.id} className="ml-2">
                          <CollapsibleTrigger asChild>
                            <Button
                              variant="secondary"
                              className="w-full bg-black font-adornstoryserif text-xl text-[#C9A39A] hover:bg-black"
                            >
                              {category.name} <ChevronDown />
                            </Button>
                          </CollapsibleTrigger>
                          <CollapsibleContent asChild>
                            <div className="mx-auto mt-2 flex max-w-fit flex-col gap-2 text-center">
                              {category.subCategories.map((subcategory: any) => (
                                <MenubarItem key={subcategory.id} asChild>
                                  <Link href={`/collections/${category.id}/${subcategory.id}`}>
                                    <button className="w-full text-left font-mysi text-xl text-[#C9A39A]">
                                      {subcategory.name}
                                    </button>
                                  </Link>
                                </MenubarItem>
                              ))}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                <MenubarItem className="!w-full" asChild>
                  <Link href={"/shows-and-events"} className="font-brandon text-xl text-[#C9A39A]">
                    SHOW/EVENTS
                  </Link>
                </MenubarItem>
                <MenubarItem className="!w-full" asChild>
                  <Link href={"/contact-us"} className="font-brandon text-xl text-[#C9A39A]">
                    CONTACT US
                  </Link>
                </MenubarItem>
                <MenubarItem className="!w-full" asChild>
                  <Link href={"/find-a-store"} className="font-brandon text-xl text-[#C9A39A]">
                    FIND A STORE
                  </Link>
                </MenubarItem>
                <MenubarItem className="!w-full" asChild>
                  <Link href={"/size-chart"} className="font-brandon text-xl text-[#C9A39A]">
                    SIZE CHART
                  </Link>
                </MenubarItem>
                {!isLoggedIn && (
                  <MenubarItem className="!w-full" asChild>
                    <Link href={"/become-a-retailer"} className="font-brandon text-xl text-[#C9A39A]">
                      BECOME A RETAILER
                    </Link>
                  </MenubarItem>
                )}
                {!isLoggedIn ? (
                  <MenubarItem className="!w-full" asChild>
                    <RetailerAuthButton isLoggedIn={isLoggedIn} isRetailer={isRetailer} />
                  </MenubarItem>
                ) : (
                  <MenubarItem className="!w-full" asChild>
                    <RetailerAuthButton isLoggedIn={isLoggedIn} isRetailer={isRetailer} />
                  </MenubarItem>
                )}
              </MenubarContent>
            </MenubarMenu>
          </Menubar>
        </div>

        <Link
          href={"/"}
          className="logo-ios-se logo-ios-standard logo-ios-x-series logo-ios-plus logo-ios-pro-max logo-ios-15-pro-max logo-android-fallback flex w-4/12 justify-center sm:w-3/12 md:ml-0 md:inline-block md:w-fit"
        >
          <img
            src="https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/Brand_New/logo.png"
            alt="Chic & Holland"
            className="w-[110px] md:w-[75px] 2xl:w-[80px] 3xl:w-[100px] 4xl:w-[105px]"
          />
        </Link>

        <div className="flex items-center gap-6 pb-2 4xl:pb-5">
          {/* desktop view */}
          <NavigationMenu className="hidden lg:flex">
            <NavigationMenuList>

              {/* ✅ HOME */}
              <NavigationMenuItem>
                <NavigationMenuLink asChild className={`${navigationMenuTriggerStyle()} font-brandon`}>
                  <Link href={"/"}>HOME</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>

              {/* ✅ BRAND */}
              <NavigationMenuItem>
                <NavigationMenuLink asChild className={`${navigationMenuTriggerStyle()} font-brandon`}>
                  <Link href={"/brand"}>BRAND</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>

              {/* COLLECTIONS — no change needed, uses NavigationMenuTrigger */}
              <NavigationMenuItem>
                <NavigationMenuTrigger>
                  <p className="attention font-brandon">COLLECTIONS</p>
                </NavigationMenuTrigger>
                <NavigationMenuContent className="flex min-w-[100vw] max-w-[100vw] flex-row justify-between px-8 xl:justify-center xl:gap-[135px]">
                  {sortedCategories.map((category: any) => (
                    <HoverCard key={category.id} closeDelay={200}>
                      <HoverCardTrigger asChild className="cursor-pointer">
                        <div>
                          <p className="!mb-4 !mt-3 w-fit border-b-[3px] border-[#C9A39A] pb-1 font-adornstoryserif text-xl font-bold md:text-2xl 2xl:text-3xl 3xl:text-3xl">
                            {category.name}
                          </p>
                          {category.subCategories.map((subcategory: any) => (
                            <Link
                              key={subcategory.id}
                              className="cursor-pointer"
                              href={`/collections/${category.id}/${subcategory.id}`}
                            >
                              <p className="!my-3 font-mysi text-base transition-all hover:text-blue-500 md:text-xl 2xl:text-2xl 3xl:text-3xl">
                                {subcategory.name}
                              </p>
                            </Link>
                          ))}
                        </div>
                      </HoverCardTrigger>
                    </HoverCard>
                  ))}
                </NavigationMenuContent>
              </NavigationMenuItem>

              {/* ✅ SHOW/EVENTS */}
              <NavigationMenuItem>
                <NavigationMenuLink asChild className={`${navigationMenuTriggerStyle()} font-brandon`}>
                  <Link href={"/shows-and-events"}>SHOW/EVENTS</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>

              {/* ✅ CONTACT US */}
              <NavigationMenuItem>
                <NavigationMenuLink asChild className={`${navigationMenuTriggerStyle()} font-brandon`}>
                  <Link href={"/contact-us"}>CONTACT US</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>

              {/* ✅ FIND A STORE */}
              <NavigationMenuItem>
                <NavigationMenuLink asChild className={`${navigationMenuTriggerStyle()} font-brandon`}>
                  <Link href={"/find-a-store"}>FIND A STORE</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>

              {/* ✅ SIZE CHART */}
              <NavigationMenuItem>
                <NavigationMenuLink asChild className={`${navigationMenuTriggerStyle()} font-brandon`}>
                  <Link href={"/size-chart"}>SIZE CHART</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>

              {/* ✅ BECOME A RETAILER */}
              {!isLoggedIn && (
                <NavigationMenuItem>
                  <NavigationMenuLink asChild className={`${navigationMenuTriggerStyle()} font-brandon`}>
                    <Link href={"/become-a-retailer"}>BECOME A RETAILER</Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              )}

              {/* ✅ AUTH BUTTON */}
              {!isLoggedIn ? (
                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <Link href={"/retailer-login"}>
                      <RetailerAuthButton isLoggedIn={isLoggedIn} isRetailer={isRetailer} />
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ) : (
                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <Link href={"/logout"}>
                      <RetailerAuthButton isLoggedIn={isLoggedIn} isRetailer={isRetailer} />
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              )}

            </NavigationMenuList>
          </NavigationMenu>

          <div className="flex w-full justify-end pe-4 md:inline-flex md:w-fit md:justify-between md:pe-0">
            <SearchBar />
            {isRetailer ? (
              <Link href={"/retailer-panel/favourites"} className={"relative ml-2"}>
                <p className={"absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[#C9A39A] hover:text-white"}>
                  {favourites.favourites.length}
                </p>
                <ShoppingCart className="text-[#C9A39A] hover:text-white 4xl:text-9xl" strokeWidth={3} />
              </Link>
            ) : (
              <HeaderFavouritesIcon
                favourites={favourites?.favourites}
                isRetailer={isRetailer}
              />
            )}
          </div>
        </div>
      </header>

      {/* WhatsApp floating icon */}
      <div className="fixed bottom-6 right-6">
        <Link
          href={"https://wa.me/+33758609484?text=Hello%20I%20came%20through%20your%20website,%20want%20to%20know%20more%20about%20your%20products%20and%20services."}
          target="_blank"
          className="flex h-[50px] w-[50px] justify-center rounded-full bg-green-600 p-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            style={{ width: "30px", fill: "white" }}
            viewBox="0 0 448 512"
          >
            <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7 .9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z" />
          </svg>
        </Link>
      </div>
    </div>
  );
};

export default Header;