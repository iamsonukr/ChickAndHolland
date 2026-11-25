import { API_URL } from "@/lib/constants";
import {
  getProductColours,
  getProductColorsCheck,
  getRetailerAdminFreshOrderDetails,
  getRetailerAdminStockOrderDetails,
} from "@/lib/data";
import { convertWebPToJPG } from "../request/StockAcceptedForm";

// Shared by the existing Preview action and bulk PDF sharing.
export async function loadRegularOrderPreview(
  data: any,
  normalizePieces: () => Promise<unknown>,
) {
  let repaired = false;
  const colours = await getProductColours({});
  const res = await fetch(API_URL + `/orders/orderDetails?orderId=${data.id}`);
  let resData = await res.json();
  if (!res.ok || !resData.orders?.[0])
    throw new Error(resData.message || "Failed to load order");
  let order = resData.orders[0];
  // Repair old grouped records before rendering; never duplicate one QR.
  if (
    order.styles.some((style: any) => {
      let sizes = style.customSizesQuantity;
      if (typeof sizes === "string") {
        try {
          sizes = JSON.parse(sizes);
        } catch {
          sizes = [];
        }
      }
      return (
        Number(style.quantity) > 1 || (Array.isArray(sizes) && sizes.length > 0)
      );
    })
  ) {
    await normalizePieces();
    const refreshed = await fetch(
      API_URL + `/orders/orderDetails?orderId=${data.id}`,
    );
    resData = await refreshed.json();
    if (!refreshed.ok || !resData.orders?.[0])
      throw new Error("Failed to reload repaired order");
    order = resData.orders[0];
    repaired = true;
  }
  const colors = colours.productColours;

  const getColorName = (hex?: string | null) =>
    hex && hex !== "SAS"
      ? colors.find((c: any) => c.hexcode === hex)?.name || hex
      : "SAS";

  const normalizeArray = (v: any) => {
    if (Array.isArray(v)) return v;
    if (typeof v === "string" && v.trim()) {
      try {
        const parsed = JSON.parse(v);
        return Array.isArray(parsed) ? parsed : [v];
      } catch {
        return [v];
      }
    }

    return v ? [v] : [];
  };

  const getCustomSizeText = (value: any) => {
    if (typeof value === "string" || typeof value === "number") {
      return String(value).trim();
    }

    if (value && typeof value === "object") {
      return String(value.size ?? value.value ?? value.label ?? "").trim();
    }

    return "";
  };

  const getCustomSizeEntries = (
    customSize: any,
    customSizesQuantity: any[],
  ) => {
    const customSizeEntries = normalizeArray(customSize)
      .map(getCustomSizeText)
      .filter(Boolean);

    return customSizeEntries.length
      ? customSizeEntries
      : customSizesQuantity.map(getCustomSizeText).filter(Boolean);
  };

  const details = order.styles.reduce((acc: any[], item: any) => {
    const sizes = normalizeArray(item.customSizesQuantity);
    const customSizeEntries = getCustomSizeEntries(item.customSize, sizes);
    const isCustomSize =
      String(item.size ?? "")
        .trim()
        .toLowerCase() === "custom";

    const d = {
      quantity:
        sizes.length === 0
          ? Number(item.quantity)
          : sizes.reduce((s: number, v: any) => s + Number(v.quantity || 0), 0),

      size:
        isCustomSize && customSizeEntries.length
          ? "Custom"
          : sizes.length === 0
            ? `${item.size}/${item.quantity}`
            : sizes.map((v: any) => `${v.size}/${v.quantity}`).join(", "),
      customSize: customSizeEntries,
      customSizesQuantity: sizes,

      styleNo: item.styleNo,
      barcode: item.barcode,

      size_country: item.sizeCountry,
      comments: normalizeArray(item.comments).join(", "),
      color: item.colorType,
      image: item.convertedFirstProductImage,
      meshColor:
        item.mesh_color === "SAS" ? "SAS" : getColorName(item.mesh_color),
      beadingColor:
        item.beading_color === "SAS" ? "SAS" : getColorName(item.beading_color),
      beader: item.beader || item.product?.beader || "",
      lining: item.lining,
      liningColor:
        item.lining_color === "SAS" ? "SAS" : getColorName(item.lining_color),
      refImg: normalizeArray(item.photoUrls),
    };

    const exists = acc.find(
      (i) =>
        JSON.stringify({ ...i, refImg: undefined }) ===
        JSON.stringify({ ...d, refImg: undefined }),
    );

    if (exists) {
      exists.quantity += d.quantity;
      if (d.customSize.length) {
        exists.customSize = Array.from(
          new Set([...(exists.customSize ?? []), ...d.customSize]),
        );
      } else {
        exists.size += `, ${d.size}`;
      }
    } else {
      acc.push(d);
    }

    return acc;
  }, []);

  const formatted = {
    id: order.id,
    orderSource: "regular",

    customerId: order.customer.id,
    manufacturingEmailAddress: order.manufacturingEmailAddress,
    orderCancellationDate: order.orderCancellationDate,
    orderReceivedDate: order.orderReceivedDate,
    orderType: order.orderType,
    purchaseOrderNo: order.purchaeOrderNo,
    details,
    ppt_path: order.ppt_path || "",
  };

  return { previewData: formatted, orderDetails: resData, repaired };
}

export async function loadRetailerOrderPreview(data: any) {
  const colours = await getProductColours({});
  const colors = colours.productColours;

  const getColorName = (hex?: string | null) =>
    hex && hex !== "SAS"
      ? colors.find((c: any) => c.hexcode === hex)?.name || hex
      : "SAS";
  const formatSasColor = (name?: string | null) =>
    name && name !== "SAS" ? `SAS(${name})` : "SAS";

  const standard = async (id: number) => (await getProductColorsCheck(id)).data;

  /** --------------------- FRESH ORDER --------------------- **/
  if (data.orderType === "Fresh") {
    const fresh = await getRetailerAdminFreshOrderDetails(
      data.favouriteOrder.id,
      1,
    );

    const details = await Promise.all(
      fresh.data.map(async (i: any) => {
        const std = await standard(i.product_id);

        return {
          quantity: i.quantity,
          size: String(i.size ?? "").trim(),
          styleNo: i.styleNo,
          barcode: i.barcode,

          comments: i.comments,
          color: i.color,
          size_country: i.size_country,
          image: await convertWebPToJPG(i.image),

          refImg: i.reference_image
            ? await Promise.all(
                JSON.parse(i.reference_image).map((img: any) =>
                  convertWebPToJPG(img),
                ),
              )
            : [],

          meshColor:
            i.mesh_color === std.mesh_color
              ? formatSasColor(getColorName(std.mesh_color))
              : getColorName(i.mesh_color),

          beadingColor:
            i.beading_color === std.beading_color
              ? formatSasColor(getColorName(std.beading_color))
              : getColorName(i.beading_color),
          beader: i.beader || std.beader || "",

          lining: i.lining === std.lining ? `SAS(${std.lining})` : i.lining,

          liningColor:
            i.lining_color === std.lining_color
              ? formatSasColor(getColorName(std.lining_color))
              : getColorName(i.lining_color),
        };
      }),
    );

    return {
      id: data.id,
      manufacturingEmailAddress: data.manufacturingEmailAddress,
      orderCancellationDate: data.orderCancellationDate,
      orderReceivedDate: data.orderReceivedDate,
      orderType: "Fresh",
      purchaseOrderNo: data.purchaeOrderNo,
      name: data.customerStoreName || data.retailer_name,
      email: data.retailer_email,
      details,
      ppt_path: data.ppt_path || data.favouriteOrder.ppt_path || "",
    };
  } else {
    const stock = await getRetailerAdminStockOrderDetails(
      data.Stock_order.id,
      1,
    );

    const stockDetails = Array.isArray(stock.details) ? stock.details : [];
    if (!stockDetails.length) {
      throw new Error("Stock order details not found");
    }

    const previewDetails = await Promise.all(
      stockDetails.map(async (d: any) => {
        const std = await standard(d.product_id);

        return {
          quantity: d.quantity,
          size: String(d.size ?? "").trim(),
          styleNo: d.productCode,
          barcode: d.barcode,
          size_country: d.size_country,
          image: await convertWebPToJPG(d.image),
          color: d.color || "Stock",
          meshColor:
            d.mesh_color === std.mesh_color
              ? formatSasColor(getColorName(std.mesh_color))
              : getColorName(d.mesh_color),
          beadingColor:
            d.beading_color === std.beading_color
              ? formatSasColor(getColorName(std.beading_color))
              : getColorName(d.beading_color),
          beader: d.beader || std.beader || "",
          lining: d.lining === std.lining ? `SAS(${d.lining})` : d.lining,
          liningColor:
            d.lining_color === std.lining_color
              ? formatSasColor(getColorName(d.lining_color))
              : getColorName(d.lining_color),
          comments: d.comments || "",
          refImg: [],
        };
      }),
    );

    return {
      id: data.id,
      manufacturingEmailAddress: data.manufacturingEmailAddress,
      orderCancellationDate: data.orderCancellationDate,
      orderReceivedDate: data.orderReceivedDate,
      orderType: "Stock",
      purchaseOrderNo: data.purchaeOrderNo,

      details: previewDetails,

      ppt_path: stockDetails[0]?.ppt_path || data.ppt_path || "",
    };
  }
}
