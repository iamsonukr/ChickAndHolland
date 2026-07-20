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

/* ================= LABEL COMPONENT ================= */

export default function StatusLabelBox({
  item,
  orderType,
}: {
  item: any;
  orderType?: string;
}) {
  const sizeText = `${PDF_DISPLAY_SIZE_UNIT} ${formatEuSizeSummary([item], { alwaysShowCount: true })}`;
  const beader = String(item.beader ?? "").trim();
  const purchaseOrderNo = getStatusLabelPurchaseOrderNo(item);
  const purchaseOrderFontSize = getResponsiveStatusLabelFontSize(
    purchaseOrderNo,
    {
      availableWidth: 165,
      maxFontSize: 16,
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

          {/* COLOR = BACKEND MESH COLOR (AS-IT-IS) */}
          <div className="text-center">
            <div className="mb-1 text-xs font-semibold text-gray-500">
              COLOR
            </div>

            <div className="rounded-md border border-gray-300 bg-gray-100 px-3 py-2">
              <div className="text-center text-xs font-bold leading-tight text-gray-800">
                {item.meshColor || item.color}
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
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={build2dBarcodeUrl(item.barcode, 260)}
                alt="2d barcode"
                style={{
                  width: "150px",
                  height: "150px",
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
