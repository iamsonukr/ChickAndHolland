import {
  Banknote,
  Book,
  Cog,
  DollarSign,
  Heart,
  LandmarkIcon,
  LayoutGrid,
  List,
  MapPin,
  Package,
  Paintbrush,
  PartyPopper,
  ShoppingCart,
  ShoppingCartIcon,
  User,
  UserIcon,
  Users,
} from "lucide-react";

type Submenu = {
  href: string;
  label: string;
  active: boolean;
};

type Menu = {
  href: string;
  label: string;
  active: boolean;
  icon: any;
  submenus: Submenu[];
};

type Group = {
  groupLabel: string;
  menus: Menu[];
};

type Group2 = {
  groupLabel: string;
  menus: (Menu & {
    canAccess: boolean;
    submenus: (Submenu & {
      canAccess: boolean;
    })[];
  })[];
};

export function getMenuList(pathname: string, userType: any): Group[] {
  if (userType === "ADMIN") {
    return [
      {
        groupLabel: "",
        menus: [
          {
            href: "/admin-panel/",
            label: "Dashboard",
            active: pathname === "/admin-panel",
            icon: LayoutGrid,
            submenus: [],
          },
          {
            href: "/admin-panel/bank",
            label: "Account",
            active: pathname === "/admin-panel/bank",
            icon: LandmarkIcon,
            submenus: [],
          },
        ],
      },
      {
        groupLabel: "Admin",
        menus: [
          {
            href: "/admin-panel/users",
            label: "Users",
            active: pathname.includes("/users"),
            icon: User,
            submenus: [],
          },
          {
            icon: User,
            href: "/admin-panel/user-roles",
            label: "User roles",
            active: pathname.includes("/user-roles"),
            submenus: [],
          },
          {
  href: "/admin-panel/contactus",
  label: "Enquiries",
  active: pathname.includes("/contactus"),
  icon: User,
  submenus: [],
},


        ],
      },
      {
        groupLabel: "Orders",
        menus: [
          {
            href: "/admin-panel/orders",
            label: "All Orders",
            active: pathname.includes("/orders"),
            icon: Cog,
            submenus: [],
          },
//           {
//   href: "/admin-panel/qr-scan",
//   label: "QR Scan",
//   active: pathname.includes("/qr-scan"),
//   icon: Cog,
//   submenus: [],
// },

          {
            href: "/admin-panel/order-list",
            label: "Order List",
            active: pathname.includes("/order-list"),
            icon: List,
            submenus: [],
          },
          {
            href: "/admin-panel/request",
            label: "Order Request",
            active: pathname.includes("/request"),
            icon: ShoppingCart,
            submenus: [],
          },
        ],
      },
      {
        groupLabel: "Products",
        menus: [
          {
            href: "/admin-panel/products/categories",
            label: "Categories",
            active: pathname.includes("/products/categories"),
            icon: Package,
            submenus: [],
          },
          {
            href: "/admin-panel/products/collections",
            label: "Collections",
            active: pathname.includes("/products/collections"),
            icon: Package,
            submenus: [],
          },
          {
            href: "/admin-panel/products/colours",
            label: "Colours",
            active: pathname.includes("/products/colours"),
            icon: Paintbrush,
            submenus: [],
          },
          {
            href: "/admin-panel/products",
            label: "Products",
            active: pathname === "/admin-panel/products",
            icon: Package,
            submenus: [],
          },
          {
  href: "/admin-panel/color-chart",
  label: "Color Chart",
  active: pathname.includes("/color-chart"),
  icon: Paintbrush,
  submenus: [],
},

        ],
      },
      {
        groupLabel: "Customers",
        menus: [
          {
            href: "/admin-panel/customers",
            label: "All customers",
            active: pathname.includes("/customers"),
            icon: Users,
            submenus: [],
          },
          //  {
          //   href: "/admin-panel/country",
          //   label: "Country",
          //   active: pathname.includes("/country"),
          //   icon:  Banknote,
          //   submenus: [],
          // },
          {
            href: "/admin-panel/store-locators",
            label: "Store locators",
            active: pathname.includes("/store-locators"),
            icon: MapPin,
            submenus: [],
          },
        ],
      },
      {
        groupLabel: "Stock",
        menus: [
          {
            href: "/admin-panel/stock",
            label: "Stock",
            active: pathname.includes("/stock"),
            icon: Package,
            submenus: [],
          },
        ],
      },
      {
        groupLabel: "Sponsor",
        menus: [
          {
            href: "/admin-panel/sponsor",
            label: "Sponsor",
            active: pathname.includes("/sponsor"),
            icon: Package,
            submenus: [],
          },
        ],
      },
      {
        groupLabel: "Expenses",
        menus: [
          {
            href: "/admin-panel/expenses/chic-and-holland",
            label: "Chic and Holland",
            active: pathname.includes("/expenses/chic-and-holland"),
            icon: DollarSign,
            submenus: [],
          },
          {
            href: "/admin-panel/expenses/ozil",
            label: "Ozil",
            active: pathname.includes("/expenses/ozil"),
            icon: DollarSign,
            submenus: [],
          },
        ],
      },
      {
        groupLabel: "Apps",
        menus: [
          {
            href: "/admin-panel/quickbook",
            label: "Quickbook",
            active: pathname.includes("/admin-panel/quickbook"),
            icon: Book,
            submenus: [],
          },
        ],
      },
    ];
  } else if (userType === "RETAILER") {
    return [
      {
        groupLabel: "",
        menus: [
          {
            href: "/retailer-panel/account",
            label: "Account",
            active: pathname.includes("/account"),
            icon: UserIcon,
            submenus: [],
          },
        ],
      },
      {
        groupLabel: "",
        menus: [
          {
            href: "/retailer-panel/",
            label: "My Dashboard",
            active: pathname === "/retailer-panel",
            icon: LayoutGrid,
            submenus: [],
          },
        ],
      },
      {
        groupLabel: "Products",
        menus: [
          {
            href: "/retailer-panel/inventory",
            label: "Inventory",
            active: pathname.includes("/inventory"),
            icon: Package,
            submenus: [],
          },
          {
            href: "/retailer-panel/favourites",
            label: "Cart",
            active: pathname.includes("/favourites"),
            icon: ShoppingCartIcon,
            submenus: [],
          },
          {
            href: "/collections/6/3",
            label: "Latest Collection",
            active: pathname.includes("/home"),
            icon: PartyPopper,
            submenus: [],
          },
        ],
      },
      {
        groupLabel: "My Orders",
        // changed the names follow the routes to find pages
        menus: [
          {
            href: "/retailer-panel/pending-orders",
            label: "Pending Orders",
            active: pathname.includes("/pending-orders"),
            icon: Package,
            submenus: [],
          },
          {
            href: "/retailer-panel/my-orders",
            label: "My Orders",
            active: pathname.includes("/my-orders"),
            icon: Package,
            submenus: [],
          },
        ],
      },
    ];
  }

  return [];
}

// export const generateValue = (groupLabel: string, label: string) => {
//   return groupLabel
//     ? `${groupLabel.toLowerCase().replaceAll(" ", "_")}-${label.toLowerCase().replaceAll(" ", "_")}`
//     : `${label.toLowerCase().replaceAll(" ", "_")}`;
// };

export const getMenuListForSelection = () => {
  return getMenuList("/admin-panel", "ADMIN").flatMap((group) => {
    const menus = group.menus.map((menu) => {
      return {
        value: menu.href,
        label: group.groupLabel
          ? `${group.groupLabel} - ${menu.label}`
          : menu.label,
        url: menu.href,
      };
    });
    return [...menus];
  });
};

export const getReadablePermissions = (permissions: string[], maxCount = 5) => {
  const allPermissions = getMenuListForSelection();

  return (
    permissions
      ?.slice(0, maxCount)
      .map((permission) => {
        return allPermissions.find((p) => p.value === permission)?.label;
      })
      .join(", ") + (permissions.length > maxCount ? ", ..." : "")
  );
};

export const getMenuListWithPermissions = (
  pathname: string,
  userType: any,
  permissions: string[] = [],
): Group2[] => {
  const menus = getMenuList(pathname, userType);

  if (userType !== "ADMIN") {
    // give true to all permissions
    return menus.map((group) => {
      const menus = group.menus.map((menu) => {
        // const value = generateValue(group.groupLabel, menu.label);
        // // console.log(value)
        return {
          ...menu,
          canAccess: true,
          submenus: menu.submenus.map((submenu) => {
            return {
              ...submenu,
              canAccess: true,
            };
          }),
        };
      });
      return {
        ...group,
        menus,
      };
    });
  }

  return menus.map((group) => {
    const menus = group.menus.map((menu) => {
      const value = menu.href;
      const thePermissions = !permissions ? [] : permissions;

      return {
        ...menu,
canAccess: thePermissions.includes("ALL") || thePermissions.includes(value),
        // canAccess: true,
        submenus: menu.submenus.map((submenu) => {
          const value = submenu.href;
          return {
            ...submenu,
canAccess: thePermissions.includes("ALL") || thePermissions.includes(value),
            // canAccess: true,
          };
        }),
      };
    });
    return {
      ...group,
      menus,
    };
  });
};
