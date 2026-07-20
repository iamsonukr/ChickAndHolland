"use client";

import { build2dBarcodeUrl } from "@/lib/barcodes";
import {
  formatEuSizeSummary,
  PDF_DISPLAY_SIZE_UNIT,
} from "@/lib/sizeConversion";
import {
  getResponsiveStatusLabelFontSize,
  getStatusLabelPurchaseOrderNo,
} from "@/lib/statusLabelText";

/* ================= COLOR MASTER (DB MIRROR) ================= */

const PRODUCT_COLORS: Record<string, string> = {
  "#FFF5EE": "Seashell",
  "#00FF00": "Green",
  "#FF7F50": "Coral",
  "#7FFFD4": "Aquamarine Jewel",
  "#BF8678": "224 - Dusty Rose",
  "#C49054": "904 - Gold",
  "#AF958A": "724 - Dusty Lavender",
  "#EDEDED": "906 - Ivory",
  "#A2AD48": "15 - Wasabi",
  "#A28871": "134D - Smoke Nude",
  "#000000": "908 - Black",
  "#B9B4B1": "885 - Grey",
  "#101938": "843 - Navy",
  "#DBD9D7": "32LL - Ultra Silver",
  "#603A37": "826 - Midnight Aubergine",
  "#D5B086": "901 - Nude",
  "#07180E": "30G - Forest Green",
  "#A69991": "252D - Smoke Grey",
  "#6F000F": "26 - Blood Red",
  "#8DA7BF": "121 - Steel Blue",
  "#DFBFBF": "28P - Baby Pink",
  "#BE9782": "709 - Pastel Rose",
  "#DF7292": "194 - Candy Pink",
  "#CC199D": "912 - Fuschia",
  "#B69CA7": "29D - Pastel Lilac",
  "#AA7BB7": "31 - Light Purple",
  "#3D1551": "42D - Midnight Purple",
  "#7F8EC7": "729 - Winkel",
  "#0E1565": "352 - Royal Blue",
  "#9EC201": "911 - Leaf Green",
  "#003A44": "395 - Teal",
  "#B3BFC1": "63L - Metallic Blue",
  "#D47013": "914 - Orange",
  "#D6D6D6": "Silver",
  "#B87D75": "719 - Salmon",
  "#E2A3B3": "215 - Raspberry Pink",
  "#C3A9C8": "28L - Bright Lavender",
  "#A78E91": "773 - Spicy Mauve",
  "#803900": "902 - DARK FAWN",
  "#B47350": "917 - LIGHT FAWN",
  "#174F03": "907 - EMERALD GREEN",
  "#F7F7F7": "101 - LUSTER WHITE",
  "#695D5D": "GUNMETAL",
  "#FBF4F4": "Silver - Luster",
  "#BDA8A8": "903 - Blush",
  "#B30F0F": "26B - Bead Red",
  "#061946": "31N - NAVY",
  "#EBEBEB": "932LL - SILVER",
  "#6F667F": "GREY",
  "#9A8484": "BLUSH/GREY",
  "#4CD4DD": "AQUA",
  "#2C5387": "mix",
  "#944C4C": "900 - Mocha",
  "#4682B4": "Steel Blue",
};

/* ================= COLOR RESOLVER ================= */

const resolveColor = (color?: string) => {
  if (!color) {
    return { name: "UNKNOWN COLOR", hex: "" };
  }

  // If HEX
  if (color.startsWith("#")) {
    return {
      name: PRODUCT_COLORS[color.toUpperCase()] || "UNKNOWN COLOR",
      hex: color,
    };
  }

  // If already NAME
  return {
    name: color,
    hex: "",
  };
};

/* ================= LABEL COMPONENT ================= */

export default function StatusLabelBox1({
  item,
  orderType,
}: {
  item: any;
  orderType?: string;
}) {
  const { name: colorName, hex: colorHex } = resolveColor(
    item.meshColor || item.color,
  );
  const sizeText = `${PDF_DISPLAY_SIZE_UNIT} ${formatEuSizeSummary([item], { alwaysShowCount: true })}`;
  const beader = String(item.beader ?? "").trim();
  const purchaseOrderNo = getStatusLabelPurchaseOrderNo(item);
  const purchaseOrderFontSize = getResponsiveStatusLabelFontSize(
    purchaseOrderNo,
    {
      availableWidth: 165,
      maxFontSize: 14,
      minFontSize: 8,
    },
  );

  return (
    <div className="w-[210px] overflow-hidden rounded-lg border-2 border-gray-800 bg-gradient-to-b from-white to-gray-50 shadow-lg">
      {/* HEADER */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-700 py-3 text-center text-white">
        <div className="text-sm font-bold tracking-wide">{item.styleNo}</div>
        {orderType && (
          <div className="mt-1 text-xs font-medium opacity-90">
            {orderType} ORDER
          </div>
        )}
      </div>

      {/* BODY */}
      <div className="p-3">
        {/* SIZE + COLOR */}
        <div className="mb-3 flex justify-between">
          {/* SIZE */}
          <div className="text-center">
            <div className="mb-1 text-xs font-semibold text-gray-500">SIZE</div>
            <div className="rounded-md border border-gray-300 bg-gray-100 px-3 py-1 text-lg font-bold text-gray-800">
              {sizeText}
            </div>
          </div>

          {/* COLOR */}
          <div className="text-center">
            <div className="mb-1 text-xs font-semibold text-gray-500">
              COLOR
            </div>

            <div className="flex items-center gap-2 rounded-md border border-gray-300 bg-gray-100 px-2 py-1">
              {/* Swatch only if HEX */}
              {colorHex && (
                <span
                  className="h-5 w-5 rounded border border-gray-400"
                  style={{ backgroundColor: colorHex }}
                />
              )}

              <div className="text-left leading-tight">
                <div className="text-xs font-bold text-gray-800">
                  {colorName}
                </div>
                {colorHex && (
                  <div className="text-[9px] uppercase text-gray-500">
                    {colorHex}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* PURCHASE ORDER */}
        <div className="mb-4">
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <div>
              <div className="mb-2 text-center text-xs font-semibold text-gray-500">
                PURCHASE ORDER
              </div>
              <div className="rounded-lg border-2 border-yellow-300 bg-yellow-50 px-3 py-2 text-center">
                <div
                  className="font-bold text-gray-900"
                  style={{
                    fontSize: `${purchaseOrderFontSize}px`,
                    lineHeight: 1.1,
                    whiteSpace: "nowrap",
                  }}
                >
                  {purchaseOrderNo}
                </div>
              </div>
            </div>
            {/* <div className="min-w-[74px]">
              <div className="text-xs font-semibold text-gray-500 mb-2 text-center">
                BEADER
              </div>
              <div className="bg-gray-100 border border-gray-300 rounded-lg py-2 px-2 text-center">
                <div className="text-xs font-bold text-gray-900 break-all">
                  {beader || "-"}
                </div>
              </div>
            </div> */}
          </div>
        </div>

        {/* BARCODE */}
        {item.barcode && (
          <div className="mt-4 border-t border-gray-200 pt-4">
            <div className="mb-2 text-center">
              <div className="text-xs font-semibold text-gray-500">
                SCAN TO VERIFY
              </div>
              <div className="text-[10px] text-gray-400">
                ITEM ID: {item.barcode}
              </div>
            </div>

            <div className="flex justify-center rounded-lg border border-gray-300 bg-white p-3 shadow-inner">
              <img
                src={build2dBarcodeUrl(item.barcode, 180)}
                alt="2d barcode"
                style={{
                  width: "120px",
                  height: "120px",
                  imageRendering: "pixelated",
                }}
              />
            </div>

            <div className="mt-2 px-1 text-[9px] text-gray-500">✓ VERIFIED</div>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div className="bg-gray-800 px-3 py-1 text-[8px] text-white">
        <div className="flex justify-between">
          <span>Chic&Holland</span>
          <span>
            {new Date().toLocaleDateString("en-US", {
              month: "short",
              day: "2-digit",
              year: "numeric",
            })}
          </span>
        </div>
      </div>
    </div>
  );
}
