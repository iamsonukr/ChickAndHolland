"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  getProductColorsCheck,
  getProductColours,
  getRetailerAdminFreshOrderDetails,
  getRetailerAdminStockOrderDetails,
} from "@/lib/data";
import { convertWebPToJPG } from "../request/StockAcceptedForm";
import useHttp from "@/lib/hooks/usePost";
import { toast } from "sonner";
import { PDFViewer, PDFDownloadLink } from "@react-pdf/renderer";
import RetailerPdf from "../request/RetailerPdf";

const Preview = ({
  id,
  type,
  order,
}: {
  id: number;
  type: string;
  order: any;
}) => {
  const [data, setData] = useState<any>(null);

  const { executeAsync: stockMail, loading: stockLoading } = useHttp(
    "/stock-email",
    "POST",
    true,
    false
  );

  const { executeAsync: freshMail, loading: freshLoading } = useHttp(
    "/fresh-email",
    "POST",
    true,
    false
  );

  const loading = stockLoading || freshLoading;

  const productColorSAS = async (id: number) => {
    const res = await getProductColorsCheck(id);
    return res.data;
  };

  const fetchDetails = async () => {
    try {
      const colourRes = await getProductColours({});
      const colors = colourRes.productColours;
      const getColorName = (hex: string) =>
        colors.find((c: any) => c.hexcode === hex)?.name || hex;

      if (type === "Fresh") {
        const fresh = await getRetailerAdminFreshOrderDetails(id, 1);

        const details = await Promise.all(
          fresh.data.map(async (item: any) => {
            const std = await productColorSAS(item.product_id);

            return {
              quantity: item.quantity,
              size: `${item.size}/${item.quantity}`,
              styleNo: item.productCode,
barcode: item.barcode,

              comments: item.comments || "",
              color: item.color,
              size_country: item.size_country,
              image: await convertWebPToJPG(item.image),
              refImg: item.reference_image
                ? await Promise.all(
                    JSON.parse(item.reference_image)?.map((img: any) =>
                      convertWebPToJPG(img)
                    )
                  )
                : [],
              meshColor:
                item.mesh_color === std.mesh_color
                  ? `SAS(${getColorName(std.mesh_color)})`
                  : getColorName(item.mesh_color),
              beadingColor:
                item.beading_color === std.beading_color
                  ? `SAS(${getColorName(std.beading_color)})`
                  : getColorName(item.beading_color),
              lining: item.lining,
              liningColor:
                item.lining_color === std.lining_color
                  ? `SAS(${getColorName(std.lining_color)})`
                  : getColorName(item.lining_color),
            };
          })
        );

        setData({
          purchaseOrderNo: order.order_id,
          manufacturingEmailAddress: order.email,
          orderCancellationDate: order.orderCancellationDate,
          orderReceivedDate: order.orderReceivedDate,
          orderType: "Fresh",
          details,
        });
      } else {
  const stock = await getRetailerAdminStockOrderDetails(id, 1);

  console.log("🟦 FULL STOCK API RESPONSE => ", stock);
  console.log("🟩 STOCK DETAILS RAW => ", stock.details?.[0]);

  setData({
    purchaseOrderNo: order.order_id,
    manufacturingEmailAddress: order.email,
    orderCancellationDate: order.orderCancellationDate,
    orderReceivedDate: order.received_date,
    orderType: "Stock",

    details: [
      {
        quantity: stock.details[0].quantity,
        size: `${stock.details[0].size}/${stock.details[0].quantity}`,
        styleNo: stock.details[0].productCode,

    color: stock.details[0].mesh_color || stock.details[0].color || "-",
        meshColor: stock.details[0].mesh_color || "⛔ NO MESH COLOR",
        beadingColor: stock.details[0].beading_color || "⛔ NO BEADING COLOR",
        lining: stock.details[0].lining || "⛔ NO LINING",
        liningColor: stock.details[0].lining_color || "⛔ NO LINING COLOR",

        size_country: stock.details[0].size_country,
        comments: stock.details[0].comments || "-",

        image: await convertWebPToJPG(stock.details[0].image),
      },
    ],
  });
}

    } catch (err) {
      toast.error("Failed to load order");
    }
  };

  const sendMail = async () => {
    const res =
      data.orderType === "Fresh"
        ? await freshMail({ orderData: data })
        : await stockMail({ orderData: data });

    if (res?.success) {
      toast.success("Email sent successfully");
    } else {
      toast.error("Something went wrong");
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button onClick={fetchDetails}>Preview / Mail</Button>
      </SheetTrigger>

      <SheetContent className="!min-w-[95%] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Order Preview</SheetTitle>
        </SheetHeader>

        {!data && <p className="mt-8 text-center">Loading...</p>}

        {data && (
          <>
            

            <Button className="mt-4 w-full" onClick={sendMail} disabled={loading}>
              {loading ? "Sending..." : "Send Mail"}
            </Button>

            <div className="flex justify-end py-3">
              <PDFDownloadLink
                document={<RetailerPdf orderData={data} />}
                fileName={`${data.purchaseOrderNo}.pdf`}
              >
                <Button className="bg-blue-600 text-white">Download PDF</Button>
              </PDFDownloadLink>
            </div>

            <PDFViewer className="mt-4 h-[75vh] w-full" showToolbar={false}>
              <RetailerPdf orderData={data} />
            </PDFViewer>
          </>
        )}

        <SheetFooter>
          <SheetClose />
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default Preview;
