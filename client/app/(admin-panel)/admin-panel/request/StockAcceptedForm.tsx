"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Calendar as CalendarIcon,
  ChevronDown,
  Delete,
  Plus,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import { Control, useFieldArray, useForm } from "react-hook-form";
import useHttp from "@/lib/hooks/usePost";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CreateStockOrderForm,
  createStockOrderFormSchema,
} from "@/lib/formSchemas";
import { ColorType, OrderType, SizeCountry, sizes } from "@/lib/formSchemas";
import dayjs from "dayjs";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { v4 as uuidv4 } from "uuid";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import MultipleSelector, { Option } from "@/components/custom/multi-selector";
import {
  getLatestRegularOrder,
  getLatestRetailerOrder,
  getProductColorsCheck,
  getProductColours,
  getRetailerAdminStockOrderDetails,
  searchStyleNumbers,
} from "@/lib/data";
import OrderCustomerPdf from "@/app/(admin-panel)/admin-panel/orders/OrderCustomerPdf";
import { PDFDownloadLink, PDFViewer } from "@react-pdf/renderer";
import Link from "next/link";
import StockOrdersPdf from "./StockOrdersPdf";
import FreshOrderPdf from "./FreshOrderPdf";
import RetailerPdf from "./RetailerPdf";

const StockAcceptedForm = ({ id }: { id: number }) => {
  const [open, setOpen] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [customers, setCustomers] = useState<any>();
  const [currencyInfo, setCurrencyInfo] = useState<{
    symbol: string;
    name: string;
  } | null>(null);

 const { executeAsync: mailex } = useHttp(
  "/stock-email",
  "POST",
  true
);

  const getLatestPurchaseOrder = async () => {
  const token = localStorage.getItem("token");
  if (!token) return null; // Prevent 401 crash

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/latest-po`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) return null;
  return await res.json();
};



  const { loading, error, executeAsync } = useHttp(
    "/retailer-orders/admin/accepted/stock-order",
  );





  const [colours, setColours] = useState([] as any);
  const router = useRouter();

  const fetchData = async () => {
    try {
      const res = await getRetailerAdminStockOrderDetails(id, 0);

      console.log("stock accept form ", res.details[0]);

      setCustomers(res.details[0]);

      // Set currency information from the response
      if (res.details[0] && res.details[0].currencySymbol) {
        setCurrencyInfo({
          symbol: res.details[0].currencySymbol,
          name: res.details[0].currencyName,
        });
      }
    } catch (error) {
      console.log(error);
    }
  };

  const form = useForm<CreateStockOrderForm>({
  resolver: zodResolver(createStockOrderFormSchema),
  defaultValues: {
      orderId: id,   // ⭐ MOST IMPORTANT

    purchaseOrderNo: "",
    manufacturingEmailAddress: "",
    estimate: "",
    invoice: "",
    orderReceivedDate: null,
    orderCancellationDate: null,
    address: "",
    customerId: "",
    styleNo: "",
    size: "",
    quantity: "0",
    advance: "0",
    shipping: 0,
    beadingColor: "",
    lining: "",
    liningColor: "",
    meshColor: "",
    total_amount: 0,
    product_amount: 0
  },
});


const onSubmit = async (data: CreateStockOrderForm) => {
  try {
    // -----------------------------
    // 1️⃣ ZOD SAFE DATA
    // -----------------------------
    const preData = {
      email: data.manufacturingEmailAddress,
      received_date: `${data.orderReceivedDate}`,
      orderCancellationDate: `${data.orderCancellationDate}`,
      address: data.address,
      customerId: data.customerId,
      styleNo: data.styleNo,
      size: data.size,
      quantity: data.quantity,
      image: customers?.image,
      color: customers?.color,
      retailerId: customers?.retailer_id,
      stock_id: customers?.stock_id,
      size_country: customers.size_country,
      id: customers?.id,
      advance: data.advance,
      invoice: data.invoice,
      estimate: data.estimate,
      shipping: data.shipping,
      total_amount: data.total_amount,
    };

    // -----------------------------
    // 2️⃣ SEND ORDER TO BACKEND
    // -----------------------------
    const response = await executeAsync({ data: preData });

    if (!response.success) {
      toast.error("Failed to add order");
      return;
    }

    // -----------------------------
    // 3️⃣ SET BACKEND GENERATED PO
    // -----------------------------
    if (response.purchaseOrderNo) {
      form.setValue("purchaseOrderNo", response.purchaseOrderNo);
    }

    // -----------------------------
    // 4️⃣ COLOR SAS LOGIC FIX (DEFINE BEFORE USING)
    // -----------------------------
    let str = data.size;
    let regex = /\((.*?)\)/;
    let match: any = regex.exec(str);
    let valueInBraces = match?.[1];

    let SasCheck = await productColorSAS(customers.product_id);

    const meshColorDisplay =
      customers.mesh_color === SasCheck.mesh_color
        ? `SAS( ${findColorName(customers.mesh_color)} )`
        : data.meshColor;

    const beadingColorDisplay =
      customers.beading_color === SasCheck.beading_color
        ? `SAS( ${findColorName(customers.beading_color)} )`
        : data.beadingColor;

    const liningDisplay =
      customers.lining === SasCheck.lining
        ? `SAS( ${customers.lining} )`
        : data.lining;

    const liningColorDisplay =
      customers.lining_color === SasCheck.lining_color
        ? `SAS( ${findColorName(customers.lining_color)} )`
        : data.liningColor;

    // -----------------------------
    // 5️⃣ NOW SAFE PREVIEW DATA
    // -----------------------------
    const preview = {
      manufacturingEmailAddress: data.manufacturingEmailAddress,
      orderCancellationDate: data.orderCancellationDate,
      orderReceivedDate: data.orderReceivedDate,
      orderType: "Stock",
      purchaseOrderNo: response.purchaseOrderNo,
      details: [
        {
          quantity: data.quantity,
          size: `${data.size.split("(")[0].trim()}/${data.quantity}`,
          styleNo: data.styleNo,
          color: "Stock",
          size_country: valueInBraces,
          image: await convertWebPToJPG(customers.image),
          meshColor: meshColorDisplay,
          beadingColor: beadingColorDisplay,
          lining: liningDisplay,
          liningColor: liningColorDisplay,
          comments: "",
        },
      ],
    };

    setPreviewData(preview);

    // -----------------------------
    // 6️⃣ SEND EMAIL
    // -----------------------------
    await StockEmail(preview);

    // -----------------------------
    // 7️⃣ SUCCESS
    // -----------------------------
    toast.success(response.message ?? "Order Added Successfully!");

    form.reset({
      purchaseOrderNo: response.purchaseOrderNo,
    });

    setOpen(false);
    router.refresh();

  } catch (err: any) {
    toast.error("Failed to add order", {
      description: err?.message ?? "Something went wrong",
    });
  }
};


  

  const productColorSAS = async (id: number) => {
    const res = await getProductColorsCheck(id);
    return res.data;
  };
  const findColorName = (hex: string) => {
    return colours.find((i: any) => i.hexcode == hex)?.name;
  };

  const onPreviewSubmit = async (data: CreateStockOrderForm) => {
    let str = data.size;
    let regex = /\((.*?)\)/;
    let match: any = regex.exec(str);
    let valueInBraces = match[1];
    let SasCheck = await productColorSAS(customers.product_id);

    const meshColorDisplay =
      customers.mesh_color === SasCheck.mesh_color
        ? `SAS( ${findColorName(customers.mesh_color)} )`
        : data.meshColor;

    const beadingColorDisplay =
      customers.beading_color === SasCheck.beading_color
        ? `SAS( ${findColorName(customers.beading_color)} )`
        : data.beadingColor;

    const liningDisplay =
      customers.lining === SasCheck.lining
        ? `SAS( ${customers.lining} )`
        : data.lining;

    const liningColorDisplay =
      customers.lining_color === SasCheck.lining_color
        ? ` SAS( ${findColorName(customers.lining_color)} )`
        : data.liningColor;

    const preData = {
      customerId: data.customerId,
      manufacturingEmailAddress: data.manufacturingEmailAddress,
      orderCancellationDate: data.orderCancellationDate,
      orderReceivedDate: data.orderReceivedDate,
      orderType: "Stock",
      purchaseOrderNo: data.purchaseOrderNo,
      details: [
        {
          quantity: data.quantity,
          size: `${data.size.split("(")[0].trim()}/${data.quantity}`,
          styleNo: data.styleNo,
          size_country: valueInBraces,
          color: "Stock",
          image: convertWebPToJPG(customers?.image),
          meshColor: meshColorDisplay,
          beadingColor: beadingColorDisplay,
          lining: liningDisplay,
          liningColor: liningColorDisplay,
        },
      ],
    };

    setPreviewData(preData);
  };

  const onErrors = (errors: any) => {
    toast.error("Failed to add order", {
      description: "Make sure all fields are filled correctly",
    });
  };

  const coloursFun = async () => {
    const colours = await getProductColours({});

    setColours(colours.productColours);
  };




useEffect(() => {
  coloursFun();
  form.reset();

  if (customers) {
    const invoice = `INVOICE_${uuidv4().replace(/-/g, "").substring(0, 4)}`;
    const estimate = `EB_${uuidv4().replace(/-/g, "").substring(0, 4)}`;

    form.setValue("customerId", customers.name);
    form.setValue("manufacturingEmailAddress", "rubyinc@hotmail.com");
    form.setValue("orderReceivedDate", new Date(customers.received));
    form.setValue("address", customers.storeAddress);
    form.setValue("styleNo", customers.productCode);
    form.setValue("size", `${customers.size} (${customers.size_country})`);
    form.setValue("quantity", customers.quantity);
    form.setValue("estimate", estimate);
    form.setValue("invoice", invoice);
    form.setValue("total_amount", Math.round(customers.total_price));
    form.setValue("product_amount", Math.round(customers.total_price));

    form.setValue(
      "meshColor",
      colours.find((colour: any) => colour.hexcode === customers.mesh_color)
        ?.name,
    );
    form.setValue(
      "beadingColor",
      colours.find((colour: any) => colour.hexcode === customers.beading_color)
        ?.name,
    );
    form.setValue("lining", customers.lining);
    form.setValue(
      "liningColor",
      colours.find((colour: any) => colour.hexcode === customers.lining_color)
        ?.name,
    );

    // 🚀 Generate PO No AFTER customer details are ready
  }

  setPreviewData(null);
}, [customers]);


  const formChange = () => {
    setTimeout(() => {
      const shipping = Number(form.getValues("shipping")) || 0;

      // let total_amount = form.getValues("total_amount");

      const total = Math.round(Number(customers?.total_price)) + shipping;

      form.setValue("total_amount", total);
    }, 200);
  };
const StockEmail = async (preDatas: any) => {
  try {
    console.log("📧 MAIL TO →", preDatas.manufacturingEmailAddress);

    const res = await mailex({ orderData: preDatas });

    if (res?.success) {
      toast.success("Email sent successfully");
    } else {
      toast.error("Mail API failed");
    }
  } catch (err: any) {
    console.error("❌ MAIL ERROR →", err);
    toast.error("Mail failed", {
      description: err?.message || "SMTP / API error",
    });
  }
};

  // console.log(customers)

  return (
    <div>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button onClick={fetchData}>Accept</Button>
        </SheetTrigger>
        <SheetContent className="min-w-[100%] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Stock order</SheetTitle>
            <SheetDescription>
              Fill in the form below to Stock Order
            </SheetDescription>
          </SheetHeader>

          <Form {...form}>
            <form
              className="mt-8 grid grid-cols-1 gap-2 md:grid-cols-3"
              onSubmit={form.handleSubmit(onSubmit, onErrors)}
            >
              <FormField
                control={form.control}
                name="customerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer</FormLabel>
                <Input className="cursor-not-allowed bg-gray-200" placeholder="Customer Name" {...field} readOnly />



                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="purchaseOrderNo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purchase Order No</FormLabel>
                   <FormControl>
  <Input
    placeholder="PO#VICTORIA"
    {...field}
    value={field.value ?? ""}
    readOnly
    className="cursor-not-allowed bg-gray-200"
  />
</FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="estimate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estimate No</FormLabel>
                    <FormControl>
<Input placeholder="PO#VICTORIA" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="invoice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Invoice No</FormLabel>
                    <FormControl>
<Input placeholder="PO#VICTORIA" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="manufacturingEmailAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Manufacturing Email</FormLabel>
                    <FormControl>
                      <Input placeholder="johndoe@email.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="orderReceivedDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2.5">
                    <FormLabel>Order Received Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground",
                            )}
                          >
                            {field.value ? (
                              dayjs(field.value).format("DD MMMM YYYY")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                          disabled
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="orderCancellationDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2.5">
                    <FormLabel>Order Shipping Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground",
                            )}
                          >
                            {field.value ? (
                              dayjs(field.value).format("DD MMMM YYYY")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                          disabled={(date) => date < new Date()}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="shipping"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Shipping Cost</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="0"
                        {...field}
                        type="number"
                        onChange={(e: any) => {
                          field.onChange(e);
                          formChange();
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="product_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="0"
                        {...field}
                        type="number"
                        readOnly
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="total_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Amount</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="0"
                        {...field}
                        type="number"
                        readOnly
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="advance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Advance Amount</FormLabel>
                    <FormControl>
                      <Input placeholder="0" {...field} type="number" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem className={"md:col-span-3"}>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Amsterdam" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`styleNo` as any}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Style No{" "}
                      <Link
                        href={`/product/${customers?.product_id}`}
                        className="text-blue-700"
                        target="_blank"
                      >
                        ({customers?.productCode})
                      </Link>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="johndoe@email.com"
                        {...field}
                        readOnly
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={"meshColor"}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mesh Color</FormLabel>

                    <FormControl>
                      <Input placeholder="100" {...field} readOnly />
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={"beadingColor"}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Beading Color</FormLabel>

                    <FormControl>
                      <Input placeholder="100" {...field} readOnly />
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={"liningColor"}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lining Color</FormLabel>

                    <FormControl>
                      <Input placeholder="100" {...field} readOnly />
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={"lining"}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lining</FormLabel>

                    <FormControl>
                      <Input placeholder="100" {...field} readOnly />
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`size` as any}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Size</FormLabel>

                    <FormControl>
                      <Input
                        placeholder="johndoe@email.com"
                        {...field}
                        readOnly
                      />
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`quantity` as any}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input placeholder="100" {...field} readOnly />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className={"mt-4 flex items-center gap-2 md:col-span-3"}>
                <Button
                  type={"button"}
                  className={"flex-1"}
                  variant={"outline"}
                  //         onClick={async () => {
                  //   // console.log(form.getValues());
                  //   // if (form.formState.isValid) {
                  //   //   // executePreviewAsync(form.getValues());
                  //   //   await onPreviewSubmit(form.getValues());
                  //   // } else {
                  //   //   console.log(form.formState.errors);
                  //   //   toast.error("Failed to add order", {
                  //   //     description: "Make sure all fields are filled correctly"
                  //   //   });
                  //   // }
                  //   form.handleSubmit(onPreviewSubmit, onErrors);
                  // }}
                  onClick={form.handleSubmit(onPreviewSubmit, onErrors)}
                  // disabled={previewLoading}
                >
                  {" "}
                  Preview Order{" "}
                </Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? "Loading..." : "Accept Order"} (
                  {currencyInfo?.symbol || "€"}{" "}
                  {Math.round(customers?.total_price || 0)})
                </Button>
              </div>
            </form>
          </Form>

        {previewData && (
<>
  <div className="bg-white p-4 border rounded-md mb-4">
    <h2 className="text-lg font-bold mb-3 text-pink-600">
      Edit Order Before Download
    </h2>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      
      {/* Customer */}
      <div>
        <label className="text-black text-sm">Customer</label>
        <input
          className="border w-full p-2 rounded bg-white"
          value={form.watch("customerId")}
          onChange={(e) => {
            form.setValue("customerId", e.target.value);
            onPreviewSubmit(form.getValues());
          }}
        />
      </div>

      {/* PO No */}
      <div>
        <label className="text-black text-sm">PO Number</label>
        <input
          className="border w-full p-2 rounded bg-white"
          value={form.watch("purchaseOrderNo")}
          onChange={(e) => {
            form.setValue("purchaseOrderNo", e.target.value);
            onPreviewSubmit(form.getValues());
          }}
        />
      </div>

      {/* Invoice No */}
      <div>
        <label className="text-black text-sm">Invoice</label>
        <input
          className="border w-full p-2 rounded bg-white"
          value={form.watch("invoice")}
          onChange={(e) => {
            form.setValue("invoice", e.target.value);
            onPreviewSubmit(form.getValues());
          }}
        />
      </div>

      {/* Estimate */}
      <div>
        <label className="text-black text-sm">Estimate</label>
        <input
          className="border w-full p-2 rounded bg-white"
          value={form.watch("estimate")}
          onChange={(e) => {
            form.setValue("estimate", e.target.value);
            onPreviewSubmit(form.getValues());
          }}
        />
      </div>

      {/* Address */}
      <div className="md:col-span-2">
        <label className="text-black text-sm">Address</label>
        <textarea
          className="border w-full p-2 rounded bg-white"
          value={form.watch("address")}
          onChange={(e) => {
            form.setValue("address", e.target.value);
            onPreviewSubmit(form.getValues());
          }}
        />
      </div>

     

     

      




      
      
    </div>
  </div>


    <div className="flex justify-end py-3">
     <PDFDownloadLink
  document={<FreshOrderPdf orderData={previewData} />}
  fileName={`${previewData.purchaseOrderNo}.pdf`}
>

        <button className="rounded bg-blue-600 px-4 py-2 text-white shadow">
          Download PDF
        </button>
      </PDFDownloadLink>
    </div>

   <PDFViewer className="mt-2 h-full w-full" showToolbar={false}>
  <FreshOrderPdf orderData={previewData} />
</PDFViewer>

  </>
)}

        </SheetContent>
      </Sheet>
    </div>
  );
};

export default StockAcceptedForm;

export const convertWebPToJPG = async (webpUrl: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous"; // Handle CORS if image is from different origin

    img.onload = () => {
      // Create canvas
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;

      // Draw image on canvas
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }
      ctx.drawImage(img, 0, 0);

      // Convert to JPG
      try {
        const jpgUrl = canvas.toDataURL("image/jpeg", 0.9); // 0.9 is quality
        resolve(jpgUrl);
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = (error) => {
      reject(error);
    };

    img.src = webpUrl;
  });
};
