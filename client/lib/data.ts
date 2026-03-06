"use server";

import {
  eternalSunshine,
  paparazzi,
  videos,
} from "@/app/(website)/collections/[[...slug]]/videos";
import { API_URL } from "./constants";
import { cookies } from "next/headers";
import { unstable_cache } from "next/cache";

export const fetchWrapper = async (
  endpoint: string,
  options: RequestInit = {},
) => {
  const token = (await cookies()).get("token")?.value;


  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  return response.json();
};

 

export const getCategories = async () => {
  try {
    const response = await fetch(`${API_URL}/categories`, { cache: "no-store" });
    const data = await response.json();

    console.log("Categories received at data.ts ", data)

    // 🧠 Handle different API shapes gracefully
    if (Array.isArray(data)) {
      return data;
    } else if (Array.isArray(data.categories)) {
      return data.categories;
    } else if (Array.isArray(data.data)) {
      return data.data;
    } else {
      console.warn("⚠️ Unexpected /categories API response:", data);
      return [];
    }
  } catch (error) {
    console.error("❌ Error fetching categories:", error);
    return [];
  }
};


export const getProducts = async ({
  categoryId,
  subCategoryId,
  currencyId,
}: {
  categoryId: number;
  subCategoryId: number;
  currencyId?: number;
}) => {
  const response = await fetch(
    `${API_URL}/products/filter?categoryId=${categoryId}&subCategoryId=${subCategoryId}${currencyId ? `&currencyId=${currencyId}` : ''}`,
    
  );
  const categories = await getCategories();
console.log("🔥 ALL CATEGORIES:", categories);

  const productsData = await response.json();
  console.log("🔥 API PRODUCT RESPONSE:", {
  categoryId,
  subCategoryId,
  currencyId,
  productsData
});

  console.log(productsData)
  const categoryDetails = await getSubCategoryDetails(subCategoryId);

  let videosForThisPage = videos.slice();

  if (categoryId == 74 && subCategoryId == 59) {
    videosForThisPage = [
      {
        url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/Video12-05-22.mp4",
        year: "2022",
      },
    ].concat(videosForThisPage);
  }

  if (categoryId == 71 && subCategoryId == 44) {
    videosForThisPage = videosForThisPage.filter(
      (v: any) =>
        v.url !==
        "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/Video2022five.mp4",
    );
  }
  
  // Helper function to enrich hardcoded products with API data
  const enrichProductsWithApiData = (hardcodedProducts: any[], apiProducts: any[]) => {
    return hardcodedProducts.map(hardcodedProduct => {
      const fullProductData = apiProducts.find(
        apiProduct => apiProduct.productCode === hardcodedProduct.productCode
      );
      
      if (fullProductData) {
        // Merge hardcoded data with full API data, preferring API data for overlapping fields
        return {
          ...fullProductData,
          // Keep any hardcoded fields that might be specific to the video grouping
          ...hardcodedProduct
        };
      }
      
      // If no match found in API data, return the hardcoded product as-is
      console.warn(`Product ${hardcodedProduct.productCode} not found in API response`);
      return hardcodedProduct;
    });
  };

  let products = [];
  let productsWithoutVideo = [];

  const doesSubCategoryExist = videosForThisPage.find(
    (video: any) => video.subCategoryId == subCategoryId,
  );

  let tempVidieos: { video: string | null; products: any[] }[] = [];

  if (subCategoryId != 56 && subCategoryId != 50) {
    let actualVidieos: { url: string; year: string }[] =
      videosForThisPage.filter((video: any) => {
        if (video.subCategoryId) {
          return video.subCategoryId == subCategoryId;
        } else {
          if (!doesSubCategoryExist) {
            return (
              video.year ===
              categoryDetails.name.split(" ")[
                categoryDetails.name.split(" ").length - 1
              ]
            );
          }
        }
      });

    if (categoryId == 71 && subCategoryId == 44) {
      let initial = 0;
      let final = 4;
      let loopValue = Math.trunc(productsData.length / 4);

      for (let i = 0; i < loopValue; i++) {
        let obj = {
          video: i == 0 ? actualVidieos[0]?.url : null,
          products: productsData.slice(initial, final),
        };
        tempVidieos.push(obj);
        initial = final;
        final = final + 4;
      }

      products = tempVidieos;

      const indexToInsert = loopValue * 4;
      const remainingProducts = productsData.slice(indexToInsert);
      productsWithoutVideo = remainingProducts;
    } else {
      let initial = 0;
      let final = 4;
      let loopValue = Math.trunc(productsData.length / 4);

      if (loopValue != 0) {
        for (let i = 0; i < loopValue; i++) {
          let obj = {
            video: actualVidieos[i]?.url,
            products: productsData.slice(initial, final),
          };
          tempVidieos.push(obj);
          initial = final;
          final = final + 4;
        }
        products = tempVidieos;
        const indexToInsert = loopValue * 4;
        const remainingProducts = productsData.slice(indexToInsert);
        productsWithoutVideo = remainingProducts;
      } else {
        productsWithoutVideo = productsData;
      }
    }
  } else {
    // Handle special subcategories with hardcoded data
    let hardcodedGroups = [];
    
    if (subCategoryId == 50) {
      hardcodedGroups = paparazzi;
    } else {
      hardcodedGroups = eternalSunshine;
    }

    // Enrich each group's products with full API data
    const enrichedGroups = hardcodedGroups.map(group => ({
      ...group,
      products: enrichProductsWithApiData(group.products, productsData)
    }));

    tempVidieos.push(...enrichedGroups);

    const allImages = productsData;

    const hfImages = allImages.filter((img: any) =>
      img.productCode.includes(subCategoryId == 50 ? "AF" : "HF"),
    );

    // Get all product codes that are already used in the enriched groups
    const alreadyUsedProductCodes = enrichedGroups.flatMap(group =>
      group.products.map(product => product.productCode)
    );

    const hfImagesWhichAreNotAlreadyUsed = hfImages.filter(
      (hfImage: any) => !alreadyUsedProductCodes.includes(hfImage.productCode),
    );

    productsWithoutVideo = hfImagesWhichAreNotAlreadyUsed;
  }

  products = tempVidieos;

  return {
    products,
    productsWithoutVideo,
    categoryDetails,
  };
};

export const getSubCategoryDetails = async (id: number) => {
  const res = await fetch(`${API_URL}/subcategories/${id}`);
  const data = await res.json();

  if (data?.success) return data.data;

  return {
    id,
    name: "Unknown Collection",
    category: { name: "" }
  };
};


export const getProductDetails = async (id: number, currencyId?: number) => {
  const response = await fetch(
    `${API_URL}/products/${id}${currencyId ? `?currencyId=${currencyId}` : ''}`
  );

  return response.json();
};

export const getProductDetailsByProductCode = async (productCode: string) => {
  const response = await fetch(
    `${API_URL}/products/product-code/${productCode}`,
  );

  return response.json();
};

// export const getCustomers = async ({
//   page,
//   query,
// }: {
//   page?: number;
//   query?: string;
// }) => {
//   const headers = {
//     Authorization: `Bearer ${(await cookies()).get("token")?.value}`,
//   };

//   if (!page) {
//     const response = await fetch(`${API_URL}customers`, {
//       headers,
//     });

//     return response.json();
//   }

//   const response = await fetch(
//     `${API_URL}customers?page=${page}&query=${query}`,
//     {
//       headers,
//     },
//   );

//   return response.json();
// };

export const getStock = async ({
  page,
  query,
  currencyId,
}: {
  page?: number;
  query?: string;
  currencyId?: number;
}) => {
  const headers = {
    Authorization: `Bearer ${(await cookies()).get("token")?.value}`,
  };

  const queryParams = new URLSearchParams();
  if (page) queryParams.append('page', page.toString());
  if (query) queryParams.append('query', query);
  if (currencyId) queryParams.append('currencyId', currencyId.toString());

  const response = await fetch(`${API_URL}/stock?${queryParams.toString()}`, {
    headers,
  });

  return response.json();
};

export const getProductsCodes = async (data: string) => {
  const headers = {
    Authorization: `Bearer ${(await cookies()).get("token")?.value}`,
  };

  const response = await fetch(`${API_URL}/products/styleNo/${data}`, {
    headers,
  });

  return response.json();
};

export const getProductsPrice = async (data: string) => {
  const headers = {
    Authorization: `Bearer ${(await cookies()).get("token")?.value}`,
  };

  const response = await fetch(`${API_URL}/products/price/${data}`, {
    headers,
  });

  return response.json();
};

export const getImageByStockId = async (stockId: string) => {
  const headers = {
    Authorization: `Bearer ${(await cookies()).get("token")?.value}`,
  };

  const response = await fetch(`${API_URL}/stock/${stockId}/image`, {
    headers,
    // cache: "force-cache",
  });

  return response.json();
};

// export const getCachedImageByStockId = unstable_cache(getImageByStockId, ["stock-id-images"], {
//   revalidate: 60 * 60, // revalidate every hour0
//   tags: ["stock-id-images"]
// });

export const getOrders = async ({
  page,
  query,
  orderType,
}: {
  page?: number;
  query?: string;
  orderType?: string;
}) => {
  const headers = {
    Authorization: `Bearer ${(await cookies()).get("token")?.value}`,
  };

  const response = await fetch(
    `${API_URL}/orders?page=${page}&query=${query}&orderType=${orderType}`,
    {
      headers,
    },
  );

  return response.json();
};

export const getRetailerStoreOrders = async ({
  retailerId,
  page,
}: {
  retailerId: number;
  page?: number;
}) => {
  const headers = {
    Authorization: `Bearer ${(await cookies()).get("token")?.value}`,
  };

  const res = await fetch(
    `${API_URL}/orders/retailer/store-orders/${retailerId}?page=${page}`,
    {
      headers,
      cache: "no-store",
    }
  );

  return res.json();
};


export const getExpenses = async ({
  page,
  query,
  expenseName,
  expenseType,
  isPaid,
  fromDate,
  toDate,
}: {
  page?: number;
  query?: string;
  expenseName?: string;
  expenseType?: string;
  isPaid?: string;
  fromDate?: string;
  toDate?: string;
}) => {
  const headers = {
    Authorization: `Bearer ${(await cookies()).get("token")?.value}`,
  };

  const response = await fetch(
    // `${API_URL}expenses?page=${page}&query=${query}&expenseName=${expenseName}`,
    // encodeURIComponent(expenseName)
    `${API_URL}/expenses?page=${page}&query=${query}&expenseName=${encodeURIComponent(expenseName as string)}&expenseType=${expenseType}&isPaid=${isPaid}&fromDate=${fromDate}&toDate=${toDate}`,
    {
      headers,
    },
  );

  return response.json();
};

export const getExpensesDownload = async ({
  query,
  expenseName,
  expenseType,
  isPaid,
  fromDate,
  toDate,
}: {
  query?: string;
  expenseName?: string;
  expenseType?: string;
  isPaid?: string;
  fromDate?: string;
  toDate?: string;
}) => {
  const headers = {
    Authorization: `Bearer ${(await cookies()).get("token")?.value}`,
  };

  const response = await fetch(
    // `${API_URL}expenses?page=${page}&query=${query}&expenseName=${expenseName}`,
    // encodeURIComponent(expenseName)
    `${API_URL}/expenses?query=${query}&expenseName=${encodeURIComponent(expenseName as string)}&expenseType=${expenseType}&isPaid=${isPaid}&fromDate=${fromDate}&toDate=${toDate}`,
    {
      headers,
    },
  );

  return response.json();
};

export const getFavourites = async (customerId: number) => {
  const headers = {
    Authorization: `Bearer ${(await cookies()).get("token")?.value}`,
  };

  const response = await fetch(`${API_URL}/favourites/customer/${customerId}`, {
    headers,
  });

  const responseJson = await response.json();
  console.log("FAVOURITES RESPONSE:", responseJson);

  if (!response.ok || !responseJson.success) {
    return { favourites: [] };
  }

  return responseJson;
};


export const getRetailersOrders = async ({
  retailerId,
  page,
  query,
  isApproved,
}: {
  retailerId?: number;
  page?: number;
  query?: string;
  isApproved: number;
}) => {
  const headers = {
    Authorization: `Bearer ${(await cookies()).get("token")?.value}`,
  };

  if (!page) {
    const response = await fetch(
      `${API_URL}/retailers/orders/${isApproved}?retailerId=${retailerId ?? "all"}`,
      {
        headers,
      },
    );

    return response.json();
  }

  const response = await fetch(
    `${API_URL}/retailers/orders/${isApproved}?retailerId=${retailerId ?? "all"}&page=${page}&query=${query}`,
    {
      headers,
    },
  );

  return response.json();
};

export const getAcceptedRetailersOrders = async ({
  retailerId,
  page,
  query,
  id,
}: {
  retailerId?: number;
  page?: number;
  query?: string;
  id: number;
}) => {
  const headers = {
    Authorization: `Bearer ${(await cookies()).get("token")?.value}`,
  };

  if (!page) {
    const response = await fetch(
      `${API_URL}/retailer-orders/orders/accepted/customer/${id}?retailerId=${retailerId ?? "all"}`,
      {
        headers,
      },
    );

    return response.json();
  }

  const response = await fetch(
    `${API_URL}/retailer-orders/orders/accepted/customer/${id}?retailerId=${retailerId ?? "all"}&page=${page}&query=${encodeURIComponent(query as string)}`,
    {
      headers,
    },
  );

  return response.json();
};

export async function getRetailerOrderWithBarcode(orderId: number, status: number = 1) {
  const token = (await cookies()).get("token")?.value;

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/retailer-orders/admin/favorites-order/details/${orderId}/${status}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    }
  );

  const json = await res.json();

  if (!json.success) {
    throw new Error(json.message || "Failed to fetch order details");
  }

  return json;
}



export const getAdminRetailersStockOrders = async ({
  retailerId,
  page,
  query,
}: {
  retailerId?: number;
  page?: number;
  query?: string;
}) => {
  const headers = {
    Authorization: `Bearer ${(await cookies()).get("token")?.value}`,
  };

  if (!page) {
    const response = await fetch(
      `${API_URL}/retailer-orders/admin/stock-orders?retailerId=${retailerId ?? "all"}`,
      {
        headers,
      },
    );

    return response.json();
  }

  const response = await fetch(
    `${API_URL}/retailer-orders/admin/stock-orders?retailerId=${retailerId ?? "all"}&page=${page}&query=${encodeURIComponent(query as string)}`,
    {
      headers,
    },
  );

  return response.json();
};
export const getAdminRetailersFreshOrders = async ({
  retailerId,
  page,
  query,
}: {
  retailerId?: number;
  page?: number;
  query?: string;
}) => {
  const headers = {
    Authorization: `Bearer ${(await cookies()).get("token")?.value}`,
  };

  if (!page) {
    const response = await fetch(
      `${API_URL}/retailer-orders/admin/favorites-orders?retailerId=${retailerId ?? "all"}`,
      {
        headers,
      },
    );

    return response.json();
  }

  const response = await fetch(
    `${API_URL}/retailer-orders/admin/favorites-orders?retailerId${retailerId ?? "all"}&page=${page}&query=${encodeURIComponent(query as string)}`,
    {
      headers,
    },
  );

  return response.json();
};

export const getRetailerAdminStockOrderDetails = async (
  id: number,
  status: number,
) => {
  const headers = {
    Authorization: `Bearer ${(await cookies()).get("token")?.value}`,
  };

  const response = await fetch(
    `${API_URL}/retailer-orders/admin/stock-order/form/${id}/${status}`,
    {
      headers,
    },
  );

  const responseJson = await response.json();

  if (!responseJson.success) {
    throw Error("Something went wrong, please try again later");
  }

  return responseJson;
};

export const getRetailerAdminFreshOrderDetails = async (
  id: number,
  status: number,
) => {
  const headers = {
    Authorization: `Bearer ${(await cookies()).get("token")?.value}`,
  };

  const response = await fetch(
    `${API_URL}/retailer-orders/admin/favorites-order/details/${id}/${status}`,
    { headers }
  );

  const responseJson = await response.json();

  // ✅ FIX HERE
  if (!responseJson.success) {
    throw Error("Something went wrong, please try again later");
  }

  return responseJson;
};


export const getRetailerOrderDetails = async (
  id: number,
  retailerOrderID: number,
) => {
  const headers = {
    Authorization: `Bearer ${(await cookies()).get("token")?.value}`,
  };

  const response = await fetch(
    `${API_URL}/retailer-orders/customer/${id}/${retailerOrderID}`,
    {
      headers,
    },
  );

  const responseJson = await response.json();

  if (!responseJson.success) {
    throw Error("Something went wrong, please try again later");
  }

  return responseJson;
};

export const getRetailerStockOrderDetails = async (
  id: number,
  retailerOrderID: number,
) => {
  const headers = {
    Authorization: `Bearer ${(await cookies()).get("token")?.value}`,
  };

  const response = await fetch(
    `${API_URL}/retailer-orders/customer-stock/${id}/${retailerOrderID}`,
    {
      headers,
    },
  );

  const responseJson = await response.json();

  if (!responseJson.success) {
    throw Error("Something went wrong, please try again later");
  }

  return responseJson;
};

export const getProductCategories = async ({
  page,
  query,
}: {
  page?: number;
  query?: string;
}) => {
  const headers = {
    Authorization: `Bearer ${(await cookies()).get("token")?.value}`,
  };

  if (!page) {
    const response = await fetch(`${API_URL}/categories/new?`, {
      headers,
    });

    return response.json();
  }

  const response = await fetch(
    `${API_URL}/categories/new?page=${page}&query=${query}`,
    {
      headers,
    },
  );

  return response.json();
};
export const getAdminStockOrderPreview = async (id: number) => {
  const headers = {
    Authorization: `Bearer ${(await cookies()).get("token")?.value}`,
  };

  const res = await fetch(
    `${API_URL}/retailer-orders/admin/stock-order/preview/${id}`,
    { headers }
  );

  const json = await res.json();

  if (!json.success) {
    throw new Error("Failed to load stock preview");
  }

  return json;
};




export const getProductCollection = async ({
  page,
  query,
}: {
  page?: number;
  query?: string;
}) => {
  const headers = {
    Authorization: `Bearer ${(await cookies()).get("token")?.value}`,
  };

  if (!page) {
    const response = await fetch(`${API_URL}/subcategories/new?`, {
      headers,
    });

    return response.json();
  }

  const response = await fetch(
    `${API_URL}/subcategories/new?page=${page}&query=${query}`,
    {
      headers,
    },
  );

  return response.json();
};

export const getProductsNew = async ({ page, query }) => {
  const headers = {
    Authorization: `Bearer ${(await cookies()).get("token")?.value}`,
  };

  if (!page) {
    const response = await fetch(`${API_URL}/products/new?`, {
      headers,
      cache: "no-store",
    });
    return response.json();
  }

  const response = await fetch(
    `${API_URL}/products/new?page=${page}&query=${query}`,
    {
      headers,
      cache: "no-store",
    }
  );

  return response.json();
};


// export const getClients = async ({
//   page,
//   query,
// }: {
//   page?: number;
//   query?: string;
// }) => {
//   const headers = {
//     Authorization: `Bearer ${(await cookies()).get("token")?.value}`,
//   };

//   if (!page) {
//     const response = await fetch(`${API_URL}/clients/new`, {
//       headers,
//     });

//     return response.json();
//   }

//   const response = await fetch(
//     `${API_URL}clients/new?page=${page}&query=${query}`,
//     {
//       headers,
//     },
//   );

//   return response.json();
// };


export const getClients = async ({ page, query }) => {
  const headers = {
    Authorization: `Bearer ${(await cookies()).get("token")?.value}`,
  };

  const url = page
    ? `${API_URL}/clients/new?page=${page}&query=${query ?? ""}`
    : `${API_URL}/clients/new`;

  const res = await fetch(url, { headers, cache: "no-store" });
  const data = await res.json();

  return {
    clients: data.clients || [],
    totalCount: data.totalCount || 0,
    mapClients: data.mapClients || data.clients || [], // <= ALWAYS return mapClients
  };
};

export const getUserRoles = async ({ page, query }) => {
  const headers = {
    Authorization: `Bearer ${(await cookies()).get("token")?.value}`,
  };

  const queryParams = new URLSearchParams();
  if (page) queryParams.append("page", page.toString());
  if (query) queryParams.append("query", query);

  const response = await fetch(
    `${API_URL}/user-roles${queryParams.toString() ? `?${queryParams.toString()}` : ""}`,
    { headers }
  );

  return response.json();
};


export const getColorChart = async () => {
  const res = await fetch(`${API_URL}/color-chart`, {
    cache: "no-store",
  });
  return res.json();
};


export const getUsers = async ({
  page,
  query,
}: {
  page?: number;
  query?: string;
}) => {
  const headers = {
    Authorization: `Bearer ${(await cookies()).get("token")?.value}`,
  };

 const url = page
    ? `${API_URL}/users?page=${page}&query=${query ?? ""}`
    : `${API_URL}/users`;

  const res = await fetch(url, { headers, cache: "no-store" });
  const data = await res.json();

  // Normalize backend response (ensure frontend always gets consistent structure)
  return {
    users: data.users || [],
    totalCount: data.totalCount || 0,
  };
};


export const searchStyleNumbers = async (query: string) => {
  const headers = {
    Authorization: `Bearer ${(await cookies()).get("token")?.value}`,
  };

  const response = await fetch(
    `${API_URL}/products/searchStyleNo?query=${query}`,
    {
      headers,
    },
  );

  return response.json();
};

export const getDashboardData = async (startDate: string, endDate: string) => {
  const headers = {
    Authorization: `Bearer ${(await cookies()).get("token")?.value}`,
  };

  const response = await fetch(
    `${API_URL}/analytics/dashboard?startDate=${startDate}&endDate=${endDate}`,
    {
      headers,
    },
  );

  return response.json();
};

export const getQuickbookRedirectUrl = async () => {
  const headers = {
    Authorization: `Bearer ${(await cookies()).get("token")?.value}`,
  };

  const response = await fetch(`${API_URL}/quickbook/redirect-url`, {
    headers,
  });

  return response.json();
};

export const getQuickbookAccessToken = async ({
  searchParams,
}: {
  searchParams: Record<any, any>;
}) => {
  const headers = {
    Authorization: `Bearer ${(await cookies()).get("token")?.value}`,
  };

  const searchParamsString = new URLSearchParams(searchParams).toString();

  const response = await fetch(
    `${API_URL}/quickbook/access-token?${searchParamsString}`,
    {
      headers,
    },
  );

  return response.json();
};

export const getAdminOrders = async (retailerId: number) => {
  const token = (await cookies()).get("token")?.value;

  console.log("🟦 FETCHING ADMIN ORDERS FOR:", retailerId);

  const url = `${API_URL}/retailer-orders/retailer/admin-orders?retailerId=${retailerId}`
;
  console.log("🟦 REQUEST URL:", url);

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  const data = await res.json();

  console.log("🟦 API RAW RESPONSE:", data);

  return data;
};





export async function getRetailerOrderPayments(orderId: number) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payments/history/${orderId}`, {
    cache: "no-store",
  });
  return res.json();
}

export const getQuickbookStatus = async () => {
  const headers = {
    Authorization: `Bearer ${(await cookies()).get("token")?.value}`,
  };

  const response = await fetch(`${API_URL}/quickbook/connection-status`, {
    headers,
  });

  return response.json();
};

export const getProductColours = async ({
  page,
  query,
}: {
  page?: number;
  query?: string;
}) => {
  const headers = {
    Authorization: `Bearer ${(await cookies()).get("token")?.value}`,
  };

  if (!page) {
    const response = await fetch(`${API_URL}/product-colours`, {
      headers,
    });

    return response.json();
  }

  const response = await fetch(
    `${API_URL}/product-colours?page=${page}&query=${query}`,
    {
      headers,
    },
  );

  return response.json();
};
export const getStockByProductId = async (productId: number) => {
  const headers = {
    Authorization: `Bearer ${(await cookies()).get("token")?.value}`,
  };

 

  const response = await fetch(
    `${API_URL}/stock/stock-by-productid/${productId}`,
    {
      headers,
    },
  );

  return response.json();
};

export const getRetailerDetails = async (retailerId: number) => {
  const headers = {
    Authorization: `Bearer ${(await cookies()).get("token")?.value}`,
  };

  const response = await fetch(`${API_URL}/retailers/${retailerId}`, {
    headers,
    
  });
  

  return response.json();
};

export const getRetailerDashboardData = async (retailerId: number) => {
  const headers = {
    Authorization: `Bearer ${(await cookies()).get("token")?.value}`,
  };

  const response = await fetch(
    `${API_URL}/retailers/dashboard-data?retailerId=${retailerId}`,
    {
      headers,
    },
  );

  return response.json();
};

export const getSponsors = async ({
  page,
  query,
}: {
  page?: number;
  query?: string;
}) => {
  const headers = {
    Authorization: `Bearer ${(await cookies()).get("token")?.value}`,
  };

  if (!page) {
    const response = await fetch(`${API_URL}/sponsors`, {
      headers,
    });

    return response.json();
  } else {
    const response = await fetch(
      `${API_URL}/sponsors?page=${page}&query=${query}`,
      {
        headers,
      },
    );

    return response.json();
  }
};

export const getRetailerAcceptedFreshOrderDetails = async (
  retailerId: number,
  stockId: number,
  paymentId: number,
) => {
  const headers = {
    Authorization: `Bearer ${(await cookies()).get("token")?.value}`,
  };

  const response = await fetch(
    `${API_URL}/retailer-orders/customer/accepted/fresh/${retailerId}/${stockId}/${paymentId}`,
    {
      headers,
    },
  );

  const responseJson = await response.json();

  if (!responseJson.success) {
    throw Error("Something went wrong, please try again later");
  }

  return responseJson;
};

export const getRetailerAcceptedStockOrderDetails = async (
  retailerId: number,
  stockId: number,
  paymentId: number,
) => {
  const headers = {
    Authorization: `Bearer ${(await cookies()).get("token")?.value}`,
  };

  const response = await fetch(
    `${API_URL}/retailer-orders/customer-stock/accepted/${retailerId}/${stockId}/${paymentId}`,
    {
      headers,
    },
  );

  const responseJson = await response.json();

  if (!responseJson.success) {
    throw Error("Something went wrong, please try again later");
  }

  return responseJson;
};

export const getRetailerAcceptedAdminFreshOrderDetails = async ({
  retailerId,
  page,
  query,
  id,
}: {
  retailerId?: number;
  page?: number;
  query?: string;
  id: number;
}) => {
  const headers = {
    Authorization: `Bearer ${(await cookies()).get("token")?.value}`,
  };

  if (!page) {
    const response = await fetch(
      `${API_URL}/retailer-orders/admin/orders/accepted/${id}`,
      {
        headers,
      },
    );

    return response.json();
  }

  const response = await fetch(
    `${API_URL}/retailer-orders/admin/orders/accepted/${id}?page=${page}&query=${encodeURIComponent(query as string)}`,
    {
      headers,
    },
  );

  return response.json();
};

export const getBankDetails = async (id: number) => {
  const headers = {
    Authorization: `Bearer ${(await cookies()).get("token")?.value}`,
  };

  const response = await fetch(`${API_URL}/retailer-bank/${id}`, {
    headers,
  });

  const responseJson = await response.json();

  // if (!responseJson.success) {
  //   throw Error("Something went wrong, please try again later");
  // }

  return responseJson;
};

export const getAdminBankDetails = async () => {
  const headers = {
    Authorization: `Bearer ${(await cookies()).get("token")?.value}`,
  };

  const response = await fetch(`${API_URL}/admin-bank`, { headers });
  const responseJson = await response.json();

  if (!response.ok || responseJson.success === false) {
    return { success: false, data: [], msg: responseJson.msg || "No Data Found" };
  }

  return responseJson;
};


export const getAdminBankRetailerDetails = async (retailerId: number) => {
  const headers = {
    Authorization: `Bearer ${(await cookies()).get("token")?.value}`,
  };

  const response = await fetch(
    `${API_URL}/admin-bank/retailer/${retailerId}`,
    { headers }
  );

  const json = await response.json();
  return json;
};


export const getCustomizationDetails = async (id: number) => {
  const headers = {
    Authorization: `Bearer ${(await cookies()).get("token")?.value}`,
  };

  const response = await fetch(
    `${API_URL}/retailer-orders/customization/${id}`,
    {
      headers,
    },
  );

  const responseJson = await response.json();

  if (!responseJson.success) {
    throw Error("Something went wrong, please try again later");
  }

  return responseJson;
};

export const getOrderStatusDatesDetails = async (id: number) => {
  const headers = {
    Authorization: `Bearer ${(await cookies()).get("token")?.value}`,
  };

  const response = await fetch(
    `${API_URL}/retailer-orders/orderStatusDates/${id}`,
    {
      headers,
    },
  );

  const responseJson = await response.json();

  if (!responseJson.success) {
    throw Error("Something went wrong, please try again later");
  }

  return responseJson;
};

export const getOrderStatusDatesStockDetails = async (id: number) => {
  const headers = {
    Authorization: `Bearer ${(await cookies()).get("token")?.value}`,
  };

  const response = await fetch(
    `${API_URL}/retailer-orders/orderStatusDates/stock/${id}`,
    {
      headers,
    },
  );

  const responseJson = await response.json();

  if (!responseJson.success) {
    throw Error("Something went wrong, please try again later");
  }

  return responseJson;
};

export const getDates = async (id: number) => {
  const headers = {
    Authorization: `Bearer ${(await cookies()).get("token")?.value}`,
  };

  const response = await fetch(`${API_URL}/orders/retailer-order/status/${id}`, {
    headers,
  });

  const responseJson = await response.json();

  if (!responseJson.success) {
    throw Error("Something went wrong, please try again later");
  }

  return responseJson;
};

export const getOrderDates = async (id: number) => {
  const headers = {
    Authorization: `Bearer ${(await cookies()).get("token")?.value}`,
  };

  const response = await fetch(`${API_URL}/orders/order/status/${id}`, {
    headers,
  });

  const responseJson = await response.json();

  if (!responseJson.success) {
    throw Error("Something went wrong, please try again later");
  }

  return responseJson;
};

export const getLatestRegularOrder = async () => {
  const headers = {
    Authorization: `Bearer ${(await cookies()).get("token")?.value}`,
  };

  const response = await fetch(`${API_URL}/orders/latest-regular-order`, {
    headers,
  });

  const responseJson = await response.json();

  return responseJson;
};

export const getLatestRetailerOrder = async () => {
  const headers = {
    Authorization: `Bearer ${(await cookies()).get("token")?.value}`,
  };

  const response = await fetch(`${API_URL}/orders/latest-retailer-order`, {
    headers,
  });

  // console.log(response)

  // const text = await response.text();

  // console.log(text);

  const responseJson = await response.json();

  return responseJson;
};
export const getLatestFreshPO = async () => {
  const headers = {
    Authorization: `Bearer ${(await cookies()).get("token")?.value}`,
  };

  const response = await fetch(
    `${API_URL}/retailer-orders/latest-po`,
    { headers }
  );

  return response.json();
};

export const getCustomerDetails = async (customerId: number) => {
  const headers = {
    Authorization: `Bearer ${(await cookies()).get("token")?.value}`,
  };

  const response = await fetch(`${API_URL}/customers/${customerId}`, {
    headers,
  });

  const resJson = await response.json();

  if (!response.ok || !resJson.success) {
    console.error("Failed to fetch customer details");
    return null;
  }

  return resJson.data;
};


export const getProductColorsCheck = async (id: number) => {
  const headers = {
    Authorization: `Bearer ${(await cookies()).get("token")?.value}`,
  };

  const response = await fetch(`${API_URL}/products/product-color/${id}`, {
    headers,
  });

  const responseJson = await response.json();

  if (!responseJson.status) {
    throw Error("Something went wrong, please try again later");
  }

  return responseJson;
};

// export const getCountries = async () => {
//   return fetchWrapper("countries");
// };

// export const getCurrencies = async () => {
//   return fetchWrapper("currencies");
// };

// export const getCountries = async () => {
//   const res = await fetchWrapper("countries");
//   return res.countries || [];
// };

// export const getCurrencies = async () => {
//   const res = await fetchWrapper("currencies");
//   return res.currencies || [];
// };


// export async function getCustomers(params?: { page?: number; query?: string }) {
//   const search = new URLSearchParams();
//   if (params?.page) search.append("page", params.page.toString());
//   if (params?.query) search.append("q", params.query);

//   try {
//     const data = await fetchWrapper(`customers?${search.toString()}`);
//     return data; // { customers: [], totalCount: number }
//   } catch (error) {
//     console.error("Error fetching customers:", error);
//     return { customers: [], totalCount: 0 };
//   }
// }
// export const getCountries = async () => {
//   try {
//     const res = await fetch(`${API_URL}/countries`, {
//       cache: "no-store",
//     });

//     if (!res.ok) {
//       console.error("❌ Failed to fetch countries:", res.status);
//       return [];
//     }

//     const data = await res.json();
//     return data?.countries ?? [];
//   } catch (error) {
//     console.error("❌ Error fetching countries:", error);
//     return [];
//   }
// };

// export const getCurrencies = async () => {
//   try {
//     const res = await fetch(`${API_URL}/currencies`, {
//       cache: "no-store",
//     });

//     if (!res.ok) {
//       console.error("❌ Failed to fetch currencies:", res.status);
//       return [];
//     }

//     const data = await res.json();
//     return data?.currencies ?? [];
//   } catch (error) {
//     console.error("❌ Error fetching currencies:", error);
//     return [];
//   }
// };



// ✅ Always include token for protected endpoints
async function authorizedFetch(path: string) {
  const token = (await cookies()).get("token")?.value;
  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  const res = await fetch(`${API_URL}${path}`, {
    headers,
    cache: "no-store",
  });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(`❌ API ${path} failed (${res.status}): ${msg}`);
  }

  return res.json();
}

// FINAL WORKING COUNTRY API CALL
export async function getCountries() {
  try {
    const data = await fetch(`${API_URL}/countries`, {
      cache: "no-store",
    }).then((res) => res.json());

    console.log("🌍 Fetched countries:", data);

    // backend returns ARRAY, not object → return array directly
    if (Array.isArray(data)) return data;

    // fallback if backend shape changes
    if (Array.isArray(data.countries)) return data.countries;

    return [];
  } catch (error) {
    console.error("❌ Error fetching countries:", error);
    return [];
  }
}


// ✅ Currencies
export async function getCurrencies() {
  try {
    const data = await authorizedFetch("/currencies");
    console.log("✅ Currencies fetched:", data);
    return Array.isArray(data.currencies) ? data.currencies : [];
  } catch (error) {
    console.error("❌ Error fetching currencies:", error);
    return [];
  }
}

// ✅ Customers
// export async function getCustomers(params?: { page?: number; query?: string }) {
//   const search = new URLSearchParams();
//   if (params?.page) search.append("page", params.page.toString());
//   if (params?.query) search.append("q", params.query);

//   try {
//     const data = await authorizedFetch(`/customers?${search.toString()}`);
//     return data;
//   } catch (error) {
//     console.error("❌ Error fetching customers:", error);
//     return { customers: [], totalCount: 0 };
//   }
// }

// export async function getCustomers(params?: { page?: number; query?: string }) {
//   const search = new URLSearchParams();
//   if (params?.page) search.append("page", params.page.toString());
//   if (params?.query) search.append("q", params.query);

//   try {
//     const res = await fetch(`${API_URL}/customers?${search.toString()}`, {
//       headers: {
//         Authorization: `Bearer ${(await cookies()).get("token")?.value}`,
//       },
//       cache: "no-store", // ⬅️ ensures Next.js doesn’t cache old data
//     });

//     if (!res.ok) {
//       throw new Error(`Failed to fetch customers: ${res.status}`);
//     }

//     const data = await res.json();
//     console.log("✅ getCustomers data:", data);
//     return data;
//   } catch (error) {
//     console.error("❌ Error fetching customers:", error);
//     return { customers: [], totalCount: 0 };
//   }
// }

// export const getCategories = async () => {
//   const response = await fetch(`${API_URL}categories`);

//   return await response.json();
// };

// export async function getCustomers(params?: { page?: number; query?: string }) {
//   const search = new URLSearchParams();
//   if (params?.page) search.append("page", params.page.toString());
//   if (params?.query) search.append("q", params.query);

//   try {
//     const res = await fetch(`${API_URL}customers?${search.toString()}`, {
//       headers: {
//         Authorization: `Bearer ${(await cookies()).get("token")?.value}`,
//       },
//       cache: "no-store",
//     });

//     if (!res.ok) throw new Error(`Failed to fetch customers: ${res.status}`);

//     const data = await res.json();

//     // ✅ Normalize shape for frontend
//     if (Array.isArray(data)) {
//       return { customers: data, totalCount: data.length };
//     } else {
//       return {
//         customers: data.customers || [],
//         totalCount: data.totalCount || data.count || data.customers?.length || 0,
//       };
//     }
//   } catch (error) {
//     console.error("❌ Error fetching customers:", error);
//     return { customers: [], totalCount: 0 };
//   }
// }
// export async function getCustomers(params?: { page?: number; query?: string }) {
//   const search = new URLSearchParams();
//   if (params?.page) search.append("page", params.page.toString());
//   if (params?.query) search.append("query", params.query); // ✅ FIXED (was `q` before)

//   try {
//     const res = await fetch(`${API_URL}/customers?${search.toString()}`, {
//       headers: {
//         Authorization: `Bearer ${(await cookies()).get("token")?.value}`,
//       },
//       cache: "no-store",
//     });

//     if (!res.ok) throw new Error(`Failed to fetch customers: ${res.status}`);

//     const data = await res.json();
//     console.log("✅ getCustomers data:", data);

//     // ✅ Normalize shape
//     if (Array.isArray(data)) {
//       return { customers: data, totalCount: data.length };
//     } else {
//       return {
//         customers: data.customers || [],
//         totalCount: data.totalCount || data.count || data.customers?.length || 0,
//       };
//     }
//   } catch (error) {
//     console.error("❌ Error fetching customers:", error);
//     return { customers: [], totalCount: 0 };
//   }
// }

// export async function getCustomers(params?: { page?: number; query?: string }) {
//   const search = new URLSearchParams();
//   if (params?.page) search.append("page", params.page.toString());
//   if (params?.query) search.append("query", params.query || "");

//   try {
//     const res = await fetch(`${API_URL}/customers?${search.toString()}`, {
//       headers: {
//         "Content-Type": "application/json",
//       },
//       cache: "no-store", // no caching
//     });

//     if (!res.ok) {
//       console.error("❌ Failed to fetch customers:", res.status);
//       return { customers: [], totalCount: 0 };
//     }

//     const data = await res.json();
//     console.log("✅ getCustomers data:", data);

//     // normalize
//     if (Array.isArray(data)) {
//       return { customers: data, totalCount: data.length };
//     } else {
//       return {
//         customers: data.customers || [],
//         totalCount:
//           data.totalCount || data.count || data.customers?.length || 0,
//       };
//     }
//   } catch (error) {
//     console.error("❌ Error fetching customers:", error);
//     return { customers: [], totalCount: 0 };
//   }
// }

export async function getCustomers(params?: { page?: number; query?: string }) {
  const search = new URLSearchParams();
  if (params?.page) search.append("page", params.page.toString());
  if (params?.query) search.append("query", params.query || "");

  try {
    const res = await fetch(`${API_URL}/customers?${search.toString()}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${(await cookies()).get("token")?.value}`,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      console.error("❌ Failed to fetch customers:", res.status);
      return { customers: [], totalCount: 0 };
    }

    const data = await res.json();
    console.log("✅ getCustomers data:", data);

    return {
      customers: data.customers || [],
      totalCount: data.totalCount || 0,
    };
  } catch (error) {
    console.error("❌ Error fetching customers:", error);
    return { customers: [], totalCount: 0 };
  }
}
export const markOrderDelivered = async (orderId: number) => {
  const token = (await cookies()).get("token")?.value;

  const res = await fetch(`${API_URL}/orders/deliver`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify({ orderId }),
  });

  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.message || "Failed to mark order as delivered");
  }

  return data;
};