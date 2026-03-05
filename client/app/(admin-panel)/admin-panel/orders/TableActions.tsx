
"use client";

import { Button } from "@/components/custom/button";
import { File, Mail } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import useHttp from "@/lib/hooks/usePost";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { PDFDownloadLink, PDFViewer } from "@react-pdf/renderer";
import FreshOrderPdf from "../request/FreshOrderPdf";
import { API_URL } from "@/lib/constants";
import {
  getProductColorsCheck,
  getProductColours,
  getRetailerAdminFreshOrderDetails,
  getRetailerAdminStockOrderDetails,
} from "@/lib/data";
import { convertWebPToJPG } from "../request/StockAcceptedForm";
import { downloadOrderPPT } from "@/lib/utils/exportPPT";

const TableActions = ({ data }: { data: any }) => {
  const [open, setOpen] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [file, setFile] = useState<File | null>(null);
const [uploading, setUploading] = useState(false);


  const { executeAsync: Stock, loading } = useHttp(
    "/stock-email",
    "POST",
    true,
    false,
  );


  const fetchPPT = async (id: number) => {
  try {
    const res = await fetch(API_URL + `/upload-ppt/${id}`);
    const data = await res.json();

    if (data.success && data.ppt_path) {
      setPreviewData((prev: any) => ({
        ...prev,
        ppt_path: data.ppt_path,
      }));
    }
  } catch (error) {
    console.log("Error loading saved PPT:", error);
  }
};

  /** ********** STORE / ONLINE ORDERS ********** **/
  const fetchData = async () => {
    try {
      const colours = await getProductColours({});
      const res = await fetch(API_URL + `/orders/orderDetails?orderId=${data.id}`);
      const resData = await res.json();

      const order = resData.orders[0];
      const colors = colours.productColours;

      const getColorName = (hex: string) =>
        hex !== "SAS"
          ? colors.find((c: any) => c.hexcode === hex)?.name || hex
          : "SAS";

      const normalizeArray = (v: any) =>
        Array.isArray(v) ? v : v ? [v] : [];

      const details = order.styles.reduce((acc: any[], item: any) => {
        const sizes = Array.isArray(item.customSizesQuantity)
          ? item.customSizesQuantity
          : [];

        const d = {
          quantity:
            sizes.length === 0
              ? Number(item.quantity)
              : sizes.reduce((s: number, v: any) => s + Number(v.quantity || 0), 0),

          size:
            sizes.length === 0
              ? `${item.size}/${item.quantity}`
              : sizes.map((v: any) => `${v.size}/${v.quantity}`).join(", "),

          styleNo: item.styleNo,
            barcode: item.barcode,   // 🔥 सबसे ज़रूरी लाइन

          size_country: item.sizeCountry,
          comments: normalizeArray(item.comments).join(", "),
          color: item.colorType,
          image: item.convertedFirstProductImage,
          meshColor: item.mesh_color === "SAS" ? "SAS" : getColorName(item.mesh_color),
          beadingColor:
            item.beading_color === "SAS" ? "SAS" : getColorName(item.beading_color),
          lining: item.lining,
          liningColor:
            item.lining_color === "SAS"
              ? "SAS"
              : getColorName(item.lining_color),
          refImg: normalizeArray(item.photoUrls),
        };

        const exists = acc.find(
          (i) =>
            JSON.stringify({ ...i, refImg: undefined }) ===
            JSON.stringify({ ...d, refImg: undefined }),
        );

        if (exists) {
          exists.quantity += d.quantity;
          exists.size += `, ${d.size}`;
        } else {
          acc.push(d);
        }

        return acc;
      }, []);

      const formatted = {
          id: order.id, // 🔥 add this

        customerId: order.customer.id,
        manufacturingEmailAddress: order.manufacturingEmailAddress,
        orderCancellationDate: order.orderCancellationDate,
        orderReceivedDate: order.orderReceivedDate,
        orderType: order.orderType,
        purchaseOrderNo: order.purchaeOrderNo,
        details,
          ppt_path: order.ppt_path || "", // ➕ IMPORTANT

      };

      setPreviewData(formatted);
      setOrderDetails(resData);
      await fetchPPT(formatted.id);

      
    } catch (err) {
      toast.error("Failed to load order");
    }
  };

  /** ********** RETAILER ORDERS ********** **/
 /** ********** RETAILER ORDERS ********** **/
const fetchDetails = async () => {
  try {
    console.log("🚀 FETCH STARTED");

    const colours = await getProductColours({});
    const colors = colours.productColours;

    const getColorName = (hex: string) =>
      hex !== "SAS"
        ? colors.find((c: any) => c.hexcode === hex)?.name || hex
        : "SAS";

    const standard = async (id: number) =>
      (await getProductColorsCheck(id)).data;

    /** --------------------- FRESH ORDER --------------------- **/
    if (data.orderType === "Fresh") {
      console.log("📌 ORDER TYPE = FRESH");
      console.log("🆔 FAVOURITE ORDER ID =", data.favouriteOrder.id);

      const fresh = await getRetailerAdminFreshOrderDetails(
        data.favouriteOrder.id,
        1
      );

      console.log("📦 RAW FRESH ORDER DATA →", fresh.data);

      const details = await Promise.all(
        fresh.data.map(async (i: any) => {
          const std = await standard(i.product_id);

          /** 🔥 BARCODE CHECK */
          console.log(
            `🔍 STYLE ${i.styleNo} → BARCODE COMING?`,
            i.barcode ?? "❌ NOT FOUND"
          );

          return {
            quantity: i.quantity,
            size: `${i.size}/${i.quantity}`,
            styleNo: i.styleNo,

            /** 🔥 BARCODE HERE */
            barcode: i.barcode,

            comments: i.comments,
            color: i.color,
            size_country: i.size_country,
            image: await convertWebPToJPG(i.image),

            refImg: i.reference_image
              ? await Promise.all(
                  JSON.parse(i.reference_image).map((img: any) =>
                    convertWebPToJPG(img)
                  )
                )
              : [],

            meshColor:
              i.mesh_color === std.mesh_color
                ? `SAS(${getColorName(std.mesh_color)})`
                : getColorName(i.mesh_color),

            beadingColor:
              i.beading_color === std.beading_color
                ? `SAS(${getColorName(std.beading_color)})`
                : getColorName(i.beading_color),

            lining:
              i.lining === std.lining ? `SAS(${std.lining})` : i.lining,

            liningColor:
              i.lining_color === std.lining_color
                ? `SAS(${getColorName(std.lining_color)})`
                : getColorName(i.lining_color),
          };
        })
      );

      console.log("🧩 FINAL PARSED DETAILS →", details);

      setPreviewData({
        id: data.favouriteOrder.id,
        manufacturingEmailAddress: data.manufacturingEmailAddress,
        orderCancellationDate: data.orderCancellationDate,
        orderReceivedDate: data.orderReceivedDate,
        orderType: "Fresh",
        purchaseOrderNo: data.purchaeOrderNo,
        name: data.retailer_name,
        email: data.retailer_email,
        details,
        ppt_path: data.ppt_path || data.favouriteOrder.ppt_path || "",
      });

      await fetchPPT(data.favouriteOrder.id);

      /** 🔥 PREVIEW LOG */
      console.log("📄 FINAL PREVIEW DATA →", {
        ...previewData,
        details
      });

      /** ------------------- STOCK ORDER ------------------- **/
   /** ------------------- STOCK ORDER ------------------- **/
/** ------------------- STOCK ORDER ------------------- **/
} else {
  console.log("📌 ORDER TYPE = STOCK");
  console.log("🆔 STOCK ORDER ID =", data.Stock_order.id);

  const stock = await getRetailerAdminStockOrderDetails(
    data.Stock_order.id,
    1
  );

  console.log("📦 RAW STOCK ORDER DATA →", stock);

  // 🔥 ADD THESE 2 LINES
  console.log("📌 STOCK ORDER DETAILS →", stock.details);
  console.log("📌 BARCODE FOUND? →", stock.details?.[0]?.barcode);

  const d = stock.details[0];

  setPreviewData({
    id: data.Stock_order.id,
    manufacturingEmailAddress: data.manufacturingEmailAddress,
    orderCancellationDate: data.orderCancellationDate,
    orderReceivedDate: data.orderReceivedDate,
    orderType: "Stock",
    purchaseOrderNo: data.purchaeOrderNo,

    details: [
      {
        quantity: d.quantity,
        size: `${d.size}/${d.quantity}`,
        styleNo: d.productCode,

        // 🔥 BARCODE
        barcode: d.barcode,

        size_country: d.size_country,
        image: await convertWebPToJPG(d.image),
       color: d.color || "Stock",
    meshColor: d.mesh_color || "Stock",
    beadingColor: d.beading_color || "Stock",
    lining: d.lining || "Stock",
    liningColor: d.lining_color || "Stock",
      },
    ],

    ppt_path: d.ppt_path || data.ppt_path || "",
  });

  await fetchPPT(data.Stock_order.id);
}


  } catch (error) {
    console.error("❌ FAILED TO LOAD RETAILER ORDER", error);
    toast.error("Failed to load retailer order");
  }
};


  /** ********** SEND EMAIL ********** **/
  const sendMail = async () => {
    if (!previewData) return;
    const res = await Stock({ orderData: previewData });
    res?.success
      ? toast.success("Email sent successfully")
      : toast.error("Failed to send email");
  };

  return (
    <div className="my-2 flex gap-4">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            onClick={data.orderSource === "regular" ? fetchData : fetchDetails}
          >
            Preview / Mail <File className="ml-2" />
          </Button>
        </SheetTrigger>

        <SheetContent className="min-w-full overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Order Details PDF Preview</SheetTitle>
            <SheetDescription>
              This is what will be emailed to the customer.
            </SheetDescription>
          </SheetHeader>

          {!previewData && <p className="mt-8 text-center">Loading...</p>}

       {previewData && (
  <>
    

{/* 📌 Upload Custom PPT */}
<div className="mt-6 border p-4 rounded-lg bg-gray-50">
  <h3 className="text-md font-semibold mb-3">Upload Custom PPT</h3>

  <input
    type="file"
    accept=".pptx"
    className="block w-full text-sm border rounded p-2"
    onChange={(e) => setFile(e.target.files?.[0] || null)}
  />

  {file && (
    <p className="text-xs mt-2 text-gray-600">
      Selected: <strong>{file.name}</strong>
    </p>
  )}

  <Button
    disabled={!file || uploading}
    className="mt-3 w-full bg-purple-600 text-white"
    onClick={async () => {
      if (!file) return;
      setUploading(true);

      const orderId = previewData?.id || data?.id;
      if (!orderId) return toast.error("Order ID Missing!");

      const formData = new FormData();
      formData.append("ppt", file);
      formData.append("orderId", String(orderId));

      const res = await fetch(API_URL + "/upload-ppt", {
        method: "POST",
        body: formData,
      });

      const rp = await res.json();

      if (rp.success) {
        toast.success("PPT Uploaded Successfully!");

        // UI update (no need to open modal)
        setPreviewData((prev: any) => ({
          ...prev,
          ppt_path: rp.path,
        }));
      } else {
        toast.error(rp.message || "Upload Failed");
      }

      setUploading(false);
    }}
  >
    {uploading ? "Uploading..." : "Upload PPT"}
  </Button>

  {/* 🔥 Always visible section */}
  {previewData?.ppt_path && (
    <div className="mt-4 p-3 rounded-lg bg-green-100 border border-green-600">
      <p className="text-green-800 font-semibold">Uploaded PPT:</p>

      <a
        href={`${API_URL.replace("/api", "")}${previewData.ppt_path}`}
        target="_blank"
        rel="noreferrer"
        className="text-blue-700 underline text-sm"
      >
        {previewData.ppt_path.split("/").pop()}
      </a>
    </div>
  )}
</div>





   <Button onClick={sendMail} loading={loading} className="mt-6 w-full">
  Send Mail <Mail className="ml-2" />
</Button>

<div className="flex justify-end gap-3 py-3">
  {/* PDF Download */}
  <PDFDownloadLink
    document={<FreshOrderPdf orderData={previewData} />}
    fileName={`${previewData.purchaseOrderNo}.pdf`}
  >
    <button className="rounded bg-blue-600 px-4 py-2 text-white">
      Download PDF
    </button>
  </PDFDownloadLink>

  {/* PPT Download */}
  <button
    onClick={() => downloadOrderPPT(previewData)}
    className="rounded bg-green-600 px-4 py-2 text-white"
  >
    Download PPT
  </button>
</div>

<PDFViewer className="mt-4 h-[90vh] w-full" showToolbar={false}>
  <FreshOrderPdf orderData={previewData} />
</PDFViewer>

  </>
)}

        </SheetContent>
      </Sheet>
    </div>
  );
};

export default TableActions;
