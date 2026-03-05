"use client";

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

export default function StatusLabelBox1({ item }: { item: any }) {
const { name: colorName, hex: colorHex } = resolveColor(
  item.meshColor || item.color
);

  return (
    <div className="w-[210px] border-2 border-gray-800 bg-gradient-to-b from-white to-gray-50 rounded-lg shadow-lg overflow-hidden">

      {/* HEADER */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-700 text-white py-3 text-center">
        <div className="text-sm font-bold tracking-wide">
          {item.styleNo}
        </div>
      </div>

      {/* BODY */}
      <div className="p-3">

        {/* SIZE + COLOR */}
        <div className="flex justify-between mb-3">

          {/* SIZE */}
          <div className="text-center">
            <div className="text-xs font-semibold text-gray-500 mb-1">
              SIZE
            </div>
            <div className="text-lg font-bold text-gray-800 bg-gray-100 py-1 px-3 rounded-md border border-gray-300">
              EU {item.size}{item.quantity}
            </div>
          </div>

          {/* COLOR */}
          <div className="text-center">
            <div className="text-xs font-semibold text-gray-500 mb-1">
              COLOR
            </div>

            <div className="flex items-center gap-2 bg-gray-100 py-1 px-2 rounded-md border border-gray-300">
              {/* Swatch only if HEX */}
              {colorHex && (
                <span
                  className="w-5 h-5 rounded border border-gray-400"
                  style={{ backgroundColor: colorHex }}
                />
              )}

              <div className="text-left leading-tight">
                <div className="text-xs font-bold text-gray-800">
                  {colorName}
                </div>
                {colorHex && (
                  <div className="text-[9px] text-gray-500 uppercase">
                    {colorHex}
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* PURCHASE ORDER */}
        <div className="mb-4">
          <div className="text-xs font-semibold text-gray-500 mb-2 text-center">
            PURCHASE ORDER
          </div>
          <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg py-2 px-3 text-center">
            <div className="text-sm font-bold text-gray-900 break-all">
              {item.purchaseOrderNo}
            </div>
          </div>
        </div>

        {/* BARCODE */}
        {item.barcode && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="text-center mb-2">
              <div className="text-xs font-semibold text-gray-500">
                SCAN TO VERIFY
              </div>
              <div className="text-[10px] text-gray-400">
                ITEM ID: {item.barcode}
              </div>
            </div>

            <div className="bg-white p-3 rounded-lg border border-gray-300 shadow-inner flex justify-center">
              <img
                src={`https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(
                  item.barcode
                )}&scale=2&height=18&includetext=false`}
                alt="barcode"
                style={{
                  width: "160px",
                  imageRendering: "pixelated",
                }}
              />
            </div>

            <div className="text-[9px] text-gray-500 mt-2 px-1">
              ✓ VERIFIED
            </div>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div className="bg-gray-800 text-white text-[8px] py-1 px-3">
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
