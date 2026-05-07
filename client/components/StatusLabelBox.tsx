"use client";

import { build2dBarcodeUrl } from "@/lib/barcodes";
import { formatEuSizeSummary, PDF_DISPLAY_SIZE_UNIT } from "@/lib/sizeConversion";

/* ================= LABEL COMPONENT ================= */

export default function StatusLabelBox({ item, orderType }: { item: any; orderType?: string }) {
  const sizeText = `${PDF_DISPLAY_SIZE_UNIT} ${formatEuSizeSummary([item], { alwaysShowCount: true })}`;


  return (
    <div className="w-[210px] border-2 border-gray-800 bg-gradient-to-b from-white to-gray-50 rounded-lg shadow-lg overflow-hidden">

      {/* HEADER */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-700 text-white py-3 text-center">
        <div className="text-sm font-bold tracking-wide">
          {item.styleNo}
        </div>
        {orderType && (
          <div className="text-xs font-medium mt-1 opacity-90">
            {orderType} ORDER
          </div>
        )}
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
              {sizeText}
            </div>
          </div>

  {/* COLOR = BACKEND MESH COLOR (AS-IT-IS) */}
<div className="text-center">
  <div className="text-xs font-semibold text-gray-500 mb-1">
    COLOR
  </div>

  <div className="bg-gray-100 py-2 px-3 rounded-md border border-gray-300">
    <div className="text-xs font-bold text-gray-800 text-center leading-tight">
      {item.meshColor || item.color}
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
                src={build2dBarcodeUrl(item.barcode, 180)}
                alt="2d barcode"
                style={{
                  width: "120px",
                  height: "120px",
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
