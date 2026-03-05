"use client";
import React, { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  getCustomizationDetails,
  getRetailerAcceptedFreshOrderDetails,
  getRetailerAcceptedStockOrderDetails,
} from "@/lib/data";
import { cookies } from "next/headers";
import ProductCard from "@/components/custom/ProductCard";
import { usePathname, useRouter } from "next/navigation";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { cn } from "@/lib/utils";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import useHttp from "@/lib/hooks/usePost";
import EditPayment from "./EditPayment";
import { Euro } from "lucide-react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
function formatDateTime(date: Date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");

  return `${day}-${month}-${year} `;
}

const formSchema = z.object({
  amount: z
    .number({
      coerce: true,
    })
    .min(0),
  type: z.string(),
});

// const OrderStatus = [
//   "Pattern/Khaka",
//   "Beading",
//   "Stitching",
//   "Moved To Delivery",
//   "Delivered",
// ];

// const OrderStatus = [
//   "Pattern/Khaka",
//   "Beading",
//   "Stitching",
//   "Balance Pending",
//   "Ready To Delivery",
//   "Shipped",
// ];
const OrderStatus = [
  "Pattern",
  "Khaka",
  "Issue Beading",
  "Beading",
  "Zarkan",
  "Stitching",
  "Balance Pending",
  "Ready To Delivery",
  "Shipped",
];

interface Product {
  productCode: string;
}

interface OrderItem {
  id: number;
  color: string;
  mesh_color: string;
  beading_color: string;
  lining: string;
  lining_color: string;
  product_size: number;
  quantity: number;
  customization_price: number;
  customization: string;
  size_country: string;
  product: Product;
}
const PaymentType = ["Cash", "Card", "Bank Transfer"];

const updateFormSchema = z.object({
  status: z.string().min(1, { message: "Status is required" }),
  id: z.string().optional(),
  shippingAmount: z
    .number({
      coerce: true,
    })
    .min(0, { message: "Enter valid amount" }),
});

const Details = ({
  id,
  type,
  paymentId,
  retailerId,
  orderId,
}: {
  id: number;
  type: string;
  paymentId: number;
  retailerId: number;
  orderId: number;
}) => {
  const [customizationData, setCustomizationData] = useState<OrderItem[]>();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: 0,
      type: "select",
    },
  });

  const updateForm = useForm<z.infer<typeof updateFormSchema>>({
    resolver: zodResolver(updateFormSchema),
    defaultValues: {
      status: "", // Ensure it's at least an empty string
      id: "", // Ensure it's an empty string
      shippingAmount: 0, // Set a default number
    },
  });

  const { executeAsync: cusChange } = useHttp(
    `/retailer-orders/customization/${orderId}`,
    "PATCH",
  );

  const { executeAsync: addPayment } = useHttp(
    `/retailer-orders/admin/payment-update/${orderId}`,
    "POST",
  );

  const { executeAsync: statusChange } = useHttp(
    `/retailer-orders/admin/status-update/${orderId}`,
    "POST",
  );

  const [data, setData] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currencyInfo, setCurrencyInfo] = useState<{
    symbol: string;
    name: string;
  } | null>(null);

  const [payment, setPayment] = useState([]);
  const [retailerDetails, setRetailerDetails] = useState<any | null>(null);
  const [billAmount, setBillAmount] = useState({
    paid: 0,
    total: 0,
    balance: 0,
    ship: 0,
    product_amount: 0,
    customization: 0,
  });
  const [open, setOpen] = useState(false);
  const [preservedStatus, setPreservedStatus] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  const fetchData = async (statusToRestore?: string | null) => {
    try {
      let fresh;
      if (type == "Stock") {
        fresh = await getRetailerAcceptedStockOrderDetails(
          retailerId,
          id,
          paymentId,
        );
      } else {
        fresh = await getRetailerAcceptedFreshOrderDetails(
          retailerId,
          id,
          paymentId,
        );
      }

      let billAmount = 0;
      let customization = 0;

      for (let index = 0; index < fresh.favourites.length; index++) {
        billAmount =
          billAmount +
          Number(fresh.favourites[index].product_price) *
          Number(fresh.favourites[index].quantity);

        customization =
          customization +
          Number(fresh.favourites[index].customization_price) *
          Number(fresh.favourites[index].quantity);
      }

      setData(fresh.favourites);
      setPayment(fresh.payment);
      setBillAmount(fresh.bill_amount);
      setRetailerDetails(fresh.retailerOrder);

      // Set currency information
      if (fresh.currency) {
        setCurrencyInfo({
          symbol: fresh.currency.symbol,
          name: fresh.currency.name,
        });
      }

      setBillAmount({
        total: Number(fresh.bill_amount),
        product_amount: Number(billAmount),
        paid: Number(fresh.paidAmount),
        balance: Number(fresh.bill_amount) - Number(fresh.paidAmount),
        ship: Number(fresh?.retailerOrder?.shippingAmount),
        customization: Number(customization),
      });
      updateForm.setValue("id", fresh?.retailerOrder?.trackingNo || "");

      const statusToUse = statusToRestore || preservedStatus;
      if (statusToUse) {
        updateForm.setValue("status", statusToUse);
        setPreservedStatus(null);
      } else {
        updateForm.setValue("status", fresh?.retailerOrder?.orderStatus);
      }

      updateForm.setValue(
        "shippingAmount",
        fresh?.retailerOrder?.shippingAmount,
      );

      router.refresh();
    } catch (error) {
      console.log(error);
    }
  };

  const paymentUpdate = async (data: any) => {
    try {
      if (data.amount > billAmount.balance) {
        toast.error("Amount has to be lower or equal to the Balance");
        return;
      } else if (data.amount <= 0) {
        toast.error("Please Enter Valid Amount");
        return;
      } else if (data.type == "select") {
        toast.error("Please Select Payment Method");
        return;
      }

      const currentSelectedStatus = updateForm.getValues("status");
      let statusToPreserve = null;
      if (currentSelectedStatus && currentSelectedStatus !== retailerDetails?.orderStatus) {
        statusToPreserve = currentSelectedStatus;
        setPreservedStatus(currentSelectedStatus);
      }

      await addPayment({
        amount: data.amount,
        payment_type: data.type,
      });
      toast.success("Payment Updated");
      form.setValue("amount", 0);
      form.reset({
        amount: 0,
        type: "select",
      });
      
      fetchData(statusToPreserve);
      router.refresh();
    } catch (error) {
      toast.error("Error Updating Payment");
    }
  };

  const updateRetailerAddress = async () => {
  try {
    const token =
      document.cookie
        ?.split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1] ||
      localStorage.getItem("token");

    if (!token) {
      toast.error("Please login again");
      return;
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/retailer-orders/admin/address-update/${orderId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          address: retailerDetails?.address,
        }),
      }
    );

    const data = await response.json();

    if (data.success) {
      toast.success("Address Updated Successfully");
      await fetchData(); // refresh modal data
      router.refresh(); // refresh table & UI
    } else {
      toast.error(data.message || "Update failed");
    }
  } catch (error) {
    console.error("Update error:", error);
    toast.error("Error Updating Address");
  }
};


  const statusUpdate = async (data: any) => {
    try {
      // const tem = ["Moved To Delivery", "Delivered"];

    // ❌ Payment check ONLY for Shipped
if (data.status === "Shipped" && billAmount.balance !== 0) {
  toast.error("Payment is not paid yet. Cannot ship order.");
  return;
}

// ✅ Ready To Delivery is ALWAYS allowed (even if balance pending)

      if (data.status == "Delivered" && data.id == "") {
        return toast.error("Tracking Id is Required");
      }

      await statusChange({
        status: data.status,
        track_id: data.id,
        shipping: data.shippingAmount || 0,
      });
      toast.success("Order Status Updated");
      setPreservedStatus(null);
      fetchData();
      router.refresh();
    } catch (error) {
      toast.error("Error at Order Status Payment");
    }
  };

  const customizationDetailsFun = async (id: number) => {
    const res = await getCustomizationDetails(id);

    setCustomizationData(res.data);
  };

  const handlePriceChange = (invoiceId: number, newValue: number) => {
    setCustomizationData(
      (prevData) =>
        prevData &&
        prevData.map((invoice) => {
          if (invoice.id === invoiceId) {
            // Calculate new customization_price: new input value * quantity

            return { ...invoice, customization_price: Number(newValue) };
          }
          return invoice;
        }),
    );
  };

  const cusSubmit = async () => {
    const res = await getCustomizationDetails(orderId);

    const dd = res.data;

    if (JSON.stringify(dd) == JSON.stringify(customizationData)) {
      toast.success("Changes Saved");
      return;
    }

    cusChange({
      data: customizationData,
    });
    fetchData();
    router.refresh();
    toast.success("Changes Saved");
    setDialogOpen(false);
  };

  useEffect(() => {
    form.reset();
    updateForm.reset();
  }, [open]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button onClick={fetchData}>Details</Button>
      </SheetTrigger>
      <SheetContent className="!max-w-[98%] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Order Details</SheetTitle>
        </SheetHeader>
        {pathname?.includes("/admin-panel/order-list") &&
          retailerDetails?.orderStatus !== "Delivered" && (
            <Form {...updateForm}>
              <form
                onSubmit={updateForm.handleSubmit(statusUpdate)}
                className="mx-auto py-10"
              >
                <div className="grid grid-cols-12 items-end gap-4">
                  <div className="col-span-3">
                    <FormField
                      control={updateForm.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Change Order Status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {OrderStatus.map((status, index: number) => {
                                return (
                                  <SelectItem value={status} key={index}>
                                    {status}
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>

                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="col-span-3">
                    <FormField
                      control={updateForm.control}
                      name="id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tracking iD</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Tracking ID"
                              type=""
                              {...field}
                            />
                          </FormControl>

                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="col-span-3">
                    <FormField
                      control={updateForm.control}
                      name="shippingAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Shipping Cost</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Shipping Cost"
                              type="number"
                              {...field}
                            />
                          </FormControl>

                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <Button type="submit">Submit</Button>
                </div>
              </form>
            </Form>
          )}

        {!pathname?.includes("/admin-panel/order-list") && (
          <p className="text-lg">
            {" "}
            Tracking NO =
            <span className="text-lg text-blue-700">
              {retailerDetails?.trackingNo}
            </span>
          </p>
        )}
        <div className="my-3">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-2">
              <AccordionTrigger>Retailer Details</AccordionTrigger>
              <AccordionContent>
               {retailerDetails && (
  <div className="flex flex-col gap-4">
    
   

    {/* Address with Editable Input */}
    <div className="flex gap-2 items-center">
      <p className="w-2/12 font-medium">Address:</p>
      <input
        className="bg-[#111] border border-gray-600 px-3 py-2 rounded text-white w-full"
        value={retailerDetails.address || ""}
        onChange={(e) =>
          setRetailerDetails({
            ...retailerDetails,
            address: e.target.value,
          })
        }
      />
      <Button
        onClick={updateRetailerAddress}
        className="bg-white text-black font-semibold"
      >
        Save
      </Button>
    </div>

  </div>
)}

              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-1">
              <AccordionTrigger>
                <p className="">Payment Details</p>
              </AccordionTrigger>
              <AccordionContent>
                {pathname?.includes("/admin-panel/order-list") &&
                  billAmount.balance > 0 && (
                    <div>
                      <Form {...form}>
                        <form
                          onSubmit={form.handleSubmit(paymentUpdate)}
                          className="mx-auto py-2"
                        >
                          <div className="grid grid-cols-12 items-end gap-4">
                            <div className="col-span-4">
                              <FormField
                                control={form.control}
                                name="amount"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Amount</FormLabel>
                                    <FormControl>
                                      <Input
                                        placeholder="0"
                                        type="number"
                                        {...field}
                                      />
                                    </FormControl>

                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            <div className="col-span-4">
                              <FormField
                                control={form.control}
                                name="type"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Payment Type</FormLabel>
                                    <Select
                                      onValueChange={field.onChange}
                                      defaultValue={field.value}
                                    >
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select a Payment Type" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="select">
                                          Select Payment Method
                                        </SelectItem>
                                        {PaymentType.map((item) => (
                                          <SelectItem value={item} key={item}>
                                            {item}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            <Button type="submit" className="col-span-1">
                              Submit
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </div>
                  )}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableCell colSpan={2}>Bill Amount</TableCell>
                      <TableCell className="text-right">
                        {currencyInfo?.symbol || "€"} {billAmount.total}
                      </TableCell>
                    </TableRow>
                    {type !== "stock" ? (
                      <TableRow>
                        <TableCell colSpan={2}>Amount</TableCell>
                        <TableCell className="text-right">
                          {currencyInfo?.symbol || "€"}{" "}
                          {billAmount.product_amount}
                        </TableCell>
                      </TableRow>
                    ) : (
                      <TableRow>
                        <TableCell colSpan={2}>Amount</TableCell>
                        <TableCell className="text-right">
                          {currencyInfo?.symbol || "€"}{" "}
                          {billAmount.total - billAmount.ship}
                        </TableCell>
                      </TableRow>
                    )}

                    {type !== "Stock" && (
                      <TableRow>
                        <TableCell colSpan={2}>Customization</TableCell>
                        <TableCell className="space-y-2 text-right">
                          <p>
                            {" "}
                            {currencyInfo?.symbol || "€"}{" "}
                            {billAmount.customization}
                          </p>

                          <Dialog
                            open={dialogOpen}
                            onOpenChange={setDialogOpen}
                          >
                            {pathname?.includes("/admin-panel/order-list") && (
                              <DialogTrigger asChild>
                                <Button
                                  onClick={() => {
                                    customizationDetailsFun(orderId);
                                  }}
                                >
                                  Edit Customization
                                </Button>
                              </DialogTrigger>
                            )}
                            <DialogContent className="max-h-[90%] max-w-[95%] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Edit Customization</DialogTitle>
                              </DialogHeader>
                              <div className=" ">
                                <Table>
                                  <TableHeader>
                                    <TableRow className="text-nowrap">
                                      <TableHead className="">
                                        Product Code
                                      </TableHead>
                                      <TableHead>Color</TableHead>
                                      <TableHead>Size</TableHead>

                                      <TableHead>Mesh Color</TableHead>
                                      <TableHead>Beading Color</TableHead>
                                      <TableHead>Lining</TableHead>
                                      <TableHead className="">
                                        Lining Color
                                      </TableHead>
                                      <TableHead className="">
                                        Customization
                                      </TableHead>
                                      <TableHead className="">
                                        Customization Price
                                      </TableHead>
                                      <TableHead>Quantity</TableHead>
                                      <TableHead className="text-right">
                                        Action
                                      </TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {customizationData &&
                                      customizationData.map((invoice) => {
                                        const pricePerUnit =
                                          invoice.customization_price *
                                          invoice.quantity || 0;
                                        return (
                                          <TableRow
                                            key={invoice.id}
                                            className="text-nowrap"
                                          >
                                            <TableCell className="font-medium">
                                              {invoice.product.productCode}
                                            </TableCell>
                                            <TableCell>
                                              {invoice.color}
                                            </TableCell>
                                            <TableCell className="text-nowrap">
                                              {invoice.product_size} (
                                              {invoice.size_country})
                                            </TableCell>

                                            <TableCell className="font-medium">
                                              {invoice.mesh_color}
                                            </TableCell>
                                            <TableCell>
                                              {invoice.beading_color}
                                            </TableCell>
                                            <TableCell>
                                              {invoice.lining}
                                            </TableCell>
                                            <TableCell className="">
                                              {invoice.lining_color}
                                            </TableCell>
                                            <TableCell className="">
                                              <HoverCard>
                                                <HoverCardTrigger asChild>
                                                  <div className="w-[100px] truncate">
                                                    {invoice.customization}
                                                  </div>
                                                </HoverCardTrigger>
                                                <HoverCardContent className="w-80">
                                                  {invoice.customization}
                                                </HoverCardContent>
                                              </HoverCard>
                                            </TableCell>
                                            <TableCell className="">
                                              <div className="flex">
                                                {currencyInfo?.symbol || "€"}{" "}
                                                {pricePerUnit}
                                              </div>
                                            </TableCell>
                                            <TableCell className="">
                                              {invoice.quantity}
                                            </TableCell>
                                            <TableCell className="">
                                              <div className="flex w-full items-center justify-end gap-1">
                                                <Input
                                                  type="Number"
                                                  value={
                                                    invoice.customization_price
                                                  }
                                                  onChange={(e) =>
                                                    handlePriceChange(
                                                      invoice.id,
                                                      Number(e.target.value),
                                                    )
                                                  }
                                                  className="h-[30px] w-[80px] border border-black p-0 ps-1"
                                                />
                                              </div>
                                            </TableCell>
                                          </TableRow>
                                        );
                                      })}
                                  </TableBody>
                                </Table>
                              </div>
                              <DialogFooter>
                                <Button type="button" onClick={cusSubmit}>
                                  Save changes
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    )}
                    {billAmount.ship > 0 && (
                      <TableRow>
                        <TableCell colSpan={2}>Shipping Amount</TableCell>
                        <TableCell className="text-right">
                          {currencyInfo?.symbol || "€"} {billAmount.ship}
                        </TableCell>
                      </TableRow>
                    )}

                    <TableRow>
                      <TableCell colSpan={2}>Paid Amount</TableCell>
                      <TableCell className="text-right">
                        {currencyInfo?.symbol || "€"} {billAmount.paid}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={2}>Balance Amount</TableCell>
                      <TableCell className="text-right">
                        {currencyInfo?.symbol || "€"} {billAmount.balance}
                      </TableCell>
                    </TableRow>
                    {/* Show Pay Now button for Retailer Panel if balance exists */}
{!pathname?.includes("/admin-panel/order-list") && billAmount.balance > 0 && (
  <div className="flex justify-center py-4">
    <Button
      onClick={async () => {
        try {
          const token = localStorage.getItem("token");

          if (!token) {
            toast.error("Login required. Please login again!");
            return;
          }

  const response = await fetch(`http://localhost:5001/api/stripe/checkout`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({
    orderId: retailerDetails?.id, // 👈 REAL DB ORDER ID
    amount: billAmount.balance,
    currency: currencyInfo?.symbol === "€" ? "EUR" : "USD",
  }),
});
        const data = await response.json();

          if (data.success && data.url) {
            window.location.href = data.url;
          } else {
            toast.error(data?.msg || "Unable to start checkout");
          }
        } catch (error) {
          toast.error("Stripe Payment failed!");
        }
      }}
    >
      Pay Balance
    </Button>
  </div>
)}



                  </TableHeader>
                </Table>

                <div className="flex justify-center border-b-2">
                  <p className="pt-6 text-center text-xl">Payment History</p>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-bold text-black">
                        Date
                      </TableHead>
                      <TableHead className="font-bold text-black">
                        Type
                      </TableHead>
                      <TableHead className="text-right font-bold text-black">
                        Paid Amount
                      </TableHead>
                      {pathname?.includes("/admin-panel/order-list") && (
                        <TableHead className="text-right font-bold text-black">
                          Action
                        </TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody className="w-full">
                    {payment?.map((invoice: any) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">
                          {formatDateTime(invoice.createdAt)}
                        </TableCell>
                        <TableCell>{invoice.paymentMethod}</TableCell>
                        <TableCell className="text-right">
                          {currencyInfo?.symbol || "€"} {invoice.amount}
                        </TableCell>
                        {pathname?.includes("/admin-panel/order-list") && (
                          <TableCell className="p-0 text-right">
                            <EditPayment
                              id={invoice.id}
                              fun={fetchData}
                              balance={billAmount.balance}
                              paid={invoice.amount}
                            />
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        <SheetFooter>
          <SheetClose asChild></SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default Details;
// components/retailer/orders/Details.tsx
// "use client";
// import React, { useCallback, useEffect, useState } from "react";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import {
//   Sheet,
//   SheetClose,
//   SheetContent,
//   SheetDescription,
//   SheetFooter,
//   SheetHeader,
//   SheetTitle,
//   SheetTrigger,
// } from "@/components/ui/sheet";
// import {
//   getCustomizationDetails,
//   getRetailerAcceptedFreshOrderDetails,
//   getRetailerAcceptedStockOrderDetails,
// } from "@/lib/data";
// import { usePathname, useRouter } from "next/navigation";
// import {
//   Accordion,
//   AccordionContent,
//   AccordionItem,
//   AccordionTrigger,
// } from "@/components/ui/accordion";
// import {
//   Table,
//   TableBody,
//   TableCaption,
//   TableCell,
//   TableFooter,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";

// import { toast } from "sonner";
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import * as z from "zod";
// import { cn } from "@/lib/utils";

// import {
//   Form,
//   FormControl,
//   FormDescription,
//   FormField,
//   FormItem,
//   FormLabel,
//   FormMessage,
// } from "@/components/ui/form";

// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "@/components/ui/dialog";
// import useHttp from "@/lib/hooks/usePost";
// import EditPayment from "./EditPayment";
// import { Euro, CreditCard, Loader2, CheckCircle, XCircle } from "lucide-react";
// import {
//   HoverCard,
//   HoverCardContent,
//   HoverCardTrigger,
// } from "@/components/ui/hover-card";

// function formatDateTime(date: Date) {
//   const d = new Date(date);
//   const year = d.getFullYear();
//   const month = String(d.getMonth() + 1).padStart(2, "0");
//   const day = String(d.getDate()).padStart(2, "0");
//   return `${day}-${month}-${year}`;
// }

// const formSchema = z.object({
//   amount: z
//     .number({
//       coerce: true,
//     })
//     .min(0),
//   type: z.string(),
// });

// const OrderStatus = [
//   "Pattern",
//   "Khaka",
//   "Issue Beading",
//   "Beading",
//   "Zarkan",
//   "Stitching",
//   "Balance Pending",
//   "Ready to Delivery",
//   "Shipped",
// ];

// interface Product {
//   productCode: string;
// }

// interface OrderItem {
//   id: number;
//   color: string;
//   mesh_color: string;
//   beading_color: string;
//   lining: string;
//   lining_color: string;
//   product_size: number;
//   quantity: number;
//   customization_price: number;
//   customization: string;
//   size_country: string;
//   product: Product;
// }

// const PaymentType = ["Cash", "Card", "Bank Transfer"];

// const updateFormSchema = z.object({
//   status: z.string().min(1, { message: "Status is required" }),
//   id: z.string().optional(),
//   shippingAmount: z
//     .number({
//       coerce: true,
//     })
//     .min(0, { message: "Enter valid amount" }),
// });

// const Details = ({
//   id,
//   type,
//   paymentId,
//   retailerId,
//   orderId,
// }: {
//   id: number;
//   type: string;
//   paymentId: number;
//   retailerId: number;
//   orderId: number;
// }) => {
//   const [customizationData, setCustomizationData] = useState<OrderItem[]>();
//   const form = useForm<z.infer<typeof formSchema>>({
//     resolver: zodResolver(formSchema),
//     defaultValues: {
//       amount: 0,
//       type: "select",
//     },
//   });

//   const updateForm = useForm<z.infer<typeof updateFormSchema>>({
//     resolver: zodResolver(updateFormSchema),
//     defaultValues: {
//       status: "",
//       id: "",
//       shippingAmount: 0,
//     },
//   });

//   const { executeAsync: cusChange } = useHttp(
//     `/retailer-orders/customization/${orderId}`,
//     "PATCH",
//   );

//   const { executeAsync: addPayment } = useHttp(
//     `/retailer-orders/admin/payment-update/${orderId}`,
//     "POST",
//   );

//   const { executeAsync: statusChange } = useHttp(
//     `/retailer-orders/admin/status-update/${orderId}`,
//     "POST",
//   );

//   const [data, setData] = useState([]);
//   const [dialogOpen, setDialogOpen] = useState(false);
//   const [currencyInfo, setCurrencyInfo] = useState<{
//     symbol: string;
//     name: string;
//   } | null>(null);

//   const [payment, setPayment] = useState([]);
//   const [retailerDetails, setRetailerDetails] = useState<any | null>(null);
//   const [billAmount, setBillAmount] = useState({
//     paid: 0,
//     total: 0,
//     balance: 0,
//     ship: 0,
//     product_amount: 0,
//     customization: 0,
//   });
//   const [open, setOpen] = useState(false);
//   const [preservedStatus, setPreservedStatus] = useState<string | null>(null);
//   const [isProcessingPayment, setIsProcessingPayment] = useState(false);
//   const [paymentWindow, setPaymentWindow] = useState<Window | null>(null);
  
//   const pathname = usePathname();
//   const router = useRouter();

//   const fetchData = async (statusToRestore?: string | null) => {
//     try {
//       let fresh;
//       if (type == "Stock") {
//         fresh = await getRetailerAcceptedStockOrderDetails(
//           retailerId,
//           id,
//           paymentId,
//         );
//       } else {
//         fresh = await getRetailerAcceptedFreshOrderDetails(
//           retailerId,
//           id,
//           paymentId,
//         );
//       }

//       let billAmount = 0;
//       let customization = 0;

//       for (let index = 0; index < fresh.favourites.length; index++) {
//         billAmount += Number(fresh.favourites[index].product_price) * Number(fresh.favourites[index].quantity);
//         customization += Number(fresh.favourites[index].customization_price) * Number(fresh.favourites[index].quantity);
//       }

//       setData(fresh.favourites);
//       setPayment(fresh.payment);
//       setRetailerDetails(fresh.retailerOrder);

//       // Set currency information
//       if (fresh.currency) {
//         setCurrencyInfo({
//           symbol: fresh.currency.symbol,
//           name: fresh.currency.name,
//         });
//       }

//       // Calculate payment totals
//       const totalPaid = fresh.paidAmount || 0;
//       const totalAmount = Number(fresh.bill_amount);
//       const balance = totalAmount - totalPaid;

//       setBillAmount({
//         total: totalAmount,
//         product_amount: Number(billAmount),
//         paid: Number(totalPaid),
//         balance: Number(balance),
//         ship: Number(fresh?.retailerOrder?.shippingAmount) || 0,
//         customization: Number(customization),
//       });

//       updateForm.setValue("id", fresh?.retailerOrder?.trackingNo || "");
      
//       const statusToUse = statusToRestore || preservedStatus;
//       if (statusToUse) {
//         updateForm.setValue("status", statusToUse);
//         setPreservedStatus(null);
//       } else {
//         updateForm.setValue("status", fresh?.retailerOrder?.orderStatus);
//       }

//       updateForm.setValue(
//         "shippingAmount",
//         fresh?.retailerOrder?.shippingAmount || 0,
//       );

//       router.refresh();
//     } catch (error) {
//       console.log(error);
//       toast.error("Failed to fetch order details");
//     }
//   };

//   const paymentUpdate = async (data: any) => {
//     try {
//       if (data.amount > billAmount.balance) {
//         toast.error("Amount has to be lower or equal to the Balance");
//         return;
//       } else if (data.amount <= 0) {
//         toast.error("Please Enter Valid Amount");
//         return;
//       } else if (data.type == "select") {
//         toast.error("Please Select Payment Method");
//         return;
//       }

//       const currentSelectedStatus = updateForm.getValues("status");
//       let statusToPreserve = null;
//       if (currentSelectedStatus && currentSelectedStatus !== retailerDetails?.orderStatus) {
//         statusToPreserve = currentSelectedStatus;
//         setPreservedStatus(currentSelectedStatus);
//       }

//       await addPayment({
//         amount: data.amount,
//         payment_type: data.type,
//       });
//       toast.success("Payment Updated");
//       form.setValue("amount", 0);
//       form.reset({
//         amount: 0,
//         type: "select",
//       });
      
//       fetchData(statusToPreserve);
//       router.refresh();
//     } catch (error) {
//       toast.error("Error Updating Payment");
//     }
//   };

//   const statusUpdate = async (data: any) => {
//     try {
//       const tem = ["Ready To Delivery", "Shipped"];

//       if (tem.includes(data.status) && billAmount.balance != 0) {
//         toast.error("Payment is not paid yet");
//         return;
//       }

//       if (data.status == "Shipped" && !data.id) {
//         return toast.error("Tracking ID is Required");
//       }

//       await statusChange({
//         status: data.status,
//         track_id: data.id,
//         shipping: data.shippingAmount || 0,
//       });
//       toast.success("Order Status Updated");
//       setPreservedStatus(null);
//       fetchData();
//       router.refresh();
//     } catch (error) {
//       toast.error("Error updating order status");
//     }
//   };

//   const customizationDetailsFun = async (id: number) => {
//     try {
//       const res = await getCustomizationDetails(id);
//       setCustomizationData(res.data);
//     } catch (error) {
//       toast.error("Failed to load customization details");
//     }
//   };

//   const handlePriceChange = (invoiceId: number, newValue: number) => {
//     setCustomizationData(
//       (prevData) =>
//         prevData &&
//         prevData.map((invoice) => {
//           if (invoice.id === invoiceId) {
//             return { ...invoice, customization_price: Number(newValue) };
//           }
//           return invoice;
//         }),
//     );
//   };

//   const cusSubmit = async () => {
//     try {
//       const res = await getCustomizationDetails(orderId);
//       const dd = res.data;

//       if (JSON.stringify(dd) == JSON.stringify(customizationData)) {
//         toast.success("Changes Saved");
//         return;
//       }

//       await cusChange({
//         data: customizationData,
//       });
//       fetchData();
//       router.refresh();
//       toast.success("Changes Saved");
//       setDialogOpen(false);
//     } catch (error) {
//       toast.error("Failed to save customization");
//     }
//   };

//   const handleStripePayment = async () => {
//     try {
//       setIsProcessingPayment(true);
//       const token = localStorage.getItem("token");
//       if (!token) {
//         toast.error("Please login to make payment");
//         setIsProcessingPayment(false);
//         return;
//       }

//       if (billAmount.balance <= 0) {
//         toast.error("No balance to pay");
//         setIsProcessingPayment(false);
//         return;
//       }

//       // Call Stripe checkout endpoint
//       const response = await fetch(
//         `${process.env.NEXT_PUBLIC_API_URL}/stripe/checkout`,
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${token}`,
//           },
//           body: JSON.stringify({
//             orderId: retailerDetails?.id,
//             amount: billAmount.balance,
//             currency: currencyInfo?.name === "Euro" ? "EUR" : "USD",
//           }),
//         }
//       );

//       const data = await response.json();

//       if (!data.success) {
//         toast.error(data.msg || "Payment initialization failed");
//         setIsProcessingPayment(false);
//         return;
//       }

//       if (data.url) {
//         // Open Stripe checkout in new window
//         const width = 600;
//         const height = 700;
//         const left = (window.screen.width - width) / 2;
//         const top = (window.screen.height - height) / 2;

//         const newWindow = window.open(
//           data.url,
//           "StripeCheckout",
//           `width=${width},height=${height},top=${top},left=${left},resizable=yes,scrollbars=yes`
//         );

//         if (!newWindow) {
//           toast.error("Please allow popups for payment");
//           setIsProcessingPayment(false);
//           return;
//         }

//         setPaymentWindow(newWindow);

//         // Poll for payment completion
//         const checkInterval = setInterval(async () => {
//           try {
//             if (newWindow.closed) {
//               clearInterval(checkInterval);
//               setIsProcessingPayment(false);
//               setPaymentWindow(null);
              
//               // Verify payment was successful
//               const statusResponse = await fetch(
//                 `${process.env.NEXT_PUBLIC_API_URL}/stripe/payment-status/${data.sessionId}`,
//                 {
//                   headers: {
//                     Authorization: `Bearer ${token}`,
//                   },
//                 }
//               );
              
//               const statusData = await statusResponse.json();
              
//               if (statusData.success && statusData.stripeStatus === "paid") {
//                 toast.success("Payment successful!");
//                 fetchData();
//                 router.refresh();
//               } else {
//                 toast.info("Payment window closed");
//               }
//               return;
//             }
//           } catch (error) {
//             console.error("Error checking payment:", error);
//           }
//         }, 2000);

//         // Auto-stop checking after 10 minutes
//         setTimeout(() => {
//           clearInterval(checkInterval);
//           if (!newWindow.closed) {
//             newWindow.close();
//           }
//           setIsProcessingPayment(false);
//           setPaymentWindow(null);
//           fetchData(); // Refresh data anyway
//           router.refresh();
//         }, 600000);
//       }
//     } catch (error) {
//       console.error("Payment error:", error);
//       toast.error("Payment failed. Please try again.");
//       setIsProcessingPayment(false);
//     }
//   };

//   useEffect(() => {
//     form.reset();
//     updateForm.reset();
//   }, [open]);

//   useEffect(() => {
//     // Clean up payment window on unmount
//     return () => {
//       if (paymentWindow && !paymentWindow.closed) {
//         paymentWindow.close();
//       }
//     };
//   }, [paymentWindow]);

//   return (
//     <Sheet open={open} onOpenChange={setOpen}>
//       <SheetTrigger asChild>
//         <Button onClick={fetchData}>Details</Button>
//       </SheetTrigger>
//       <SheetContent className="!max-w-[98%] overflow-y-auto">
//         <SheetHeader>
//           <SheetTitle>
//             Order Details - #{retailerDetails?.purchaeOrderNo}
//           </SheetTitle>
//         </SheetHeader>
        
//         {pathname?.includes("/admin-panel/order-list") &&
//           retailerDetails?.orderStatus !== "Shipped" && (
//             <Form {...updateForm}>
//               <form
//                 onSubmit={updateForm.handleSubmit(statusUpdate)}
//                 className="mx-auto py-6"
//               >
//                 <div className="grid grid-cols-12 items-end gap-4">
//                   <div className="col-span-3">
//                     <FormField
//                       control={updateForm.control}
//                       name="status"
//                       render={({ field }) => (
//                         <FormItem>
//                           <FormLabel>Status</FormLabel>
//                           <Select
//                             onValueChange={field.onChange}
//                             defaultValue={field.value}
//                           >
//                             <FormControl>
//                               <SelectTrigger>
//                                 <SelectValue placeholder="Change Order Status" />
//                               </SelectTrigger>
//                             </FormControl>
//                             <SelectContent>
//                               {OrderStatus.map((status, index: number) => (
//                                 <SelectItem value={status} key={index}>
//                                   {status}
//                                 </SelectItem>
//                               ))}
//                             </SelectContent>
//                           </Select>
//                           <FormMessage />
//                         </FormItem>
//                       )}
//                     />
//                   </div>

//                   <div className="col-span-3">
//                     <FormField
//                       control={updateForm.control}
//                       name="id"
//                       render={({ field }) => (
//                         <FormItem>
//                           <FormLabel>Tracking ID</FormLabel>
//                           <FormControl>
//                             <Input
//                               placeholder="Tracking ID"
//                               type="text"
//                               {...field}
//                             />
//                           </FormControl>
//                           <FormMessage />
//                         </FormItem>
//                       )}
//                     />
//                   </div>

//                   <div className="col-span-3">
//                     <FormField
//                       control={updateForm.control}
//                       name="shippingAmount"
//                       render={({ field }) => (
//                         <FormItem>
//                           <FormLabel>Shipping Cost</FormLabel>
//                           <FormControl>
//                             <Input
//                               placeholder="Shipping Cost"
//                               type="number"
//                               {...field}
//                             />
//                           </FormControl>
//                           <FormMessage />
//                         </FormItem>
//                       )}
//                     />
//                   </div>
//                   <Button type="submit" className="col-span-3">
//                     Update Status
//                   </Button>
//                 </div>
//               </form>
//             </Form>
//           )}

//         {!pathname?.includes("/admin-panel/order-list") && retailerDetails?.trackingNo && (
//           <div className="my-4 p-3 bg-blue-50 rounded-lg">
//             <p className="text-lg">
//               Tracking NO:{" "}
//               <span className="text-lg text-blue-700 font-semibold">
//                 {retailerDetails?.trackingNo}
//               </span>
//             </p>
//           </div>
//         )}
        
//         <div className="my-3">
//           <Accordion type="single" collapsible className="w-full">
//             <AccordionItem value="item-2">
//               <AccordionTrigger>Retailer Details</AccordionTrigger>
//               <AccordionContent>
//                 {retailerDetails && (
//                   <div className="flex flex-col space-y-3">
//                     <div className="flex gap-2">
//                       <p className="w-32 font-medium">Address:</p>
//                       <p>{retailerDetails.address || "Not provided"}</p>
//                     </div>
//                     <div className="flex gap-2">
//                       <p className="w-32 font-medium">Email:</p>
//                       <p>{retailerDetails.manufacturingEmailAddress}</p>
//                     </div>
//                     <div className="flex gap-2">
//                       <p className="w-32 font-medium">Order Date:</p>
//                       <p>{formatDateTime(retailerDetails.orderReceivedDate)}</p>
//                     </div>
//                   </div>
//                 )}
//               </AccordionContent>
//             </AccordionItem>
            
//             <AccordionItem value="item-1">
//               <AccordionTrigger>
//                 <p className="">Payment Details</p>
//               </AccordionTrigger>
//               <AccordionContent>
//                 {/* Admin Payment Form */}
//                 {pathname?.includes("/admin-panel/order-list") &&
//                   billAmount.balance > 0 && (
//                     <div className="mb-6 p-4 border rounded-lg bg-gray-50">
//                       <h3 className="font-semibold mb-3">Admin Payment Entry</h3>
//                       <Form {...form}>
//                         <form
//                           onSubmit={form.handleSubmit(paymentUpdate)}
//                           className="mx-auto"
//                         >
//                           <div className="grid grid-cols-12 items-end gap-4">
//                             <div className="col-span-4">
//                               <FormField
//                                 control={form.control}
//                                 name="amount"
//                                 render={({ field }) => (
//                                   <FormItem>
//                                     <FormLabel>Amount</FormLabel>
//                                     <FormControl>
//                                       <Input
//                                         placeholder="0"
//                                         type="number"
//                                         {...field}
//                                       />
//                                     </FormControl>
//                                     <FormMessage />
//                                   </FormItem>
//                                 )}
//                               />
//                             </div>

//                             <div className="col-span-4">
//                               <FormField
//                                 control={form.control}
//                                 name="type"
//                                 render={({ field }) => (
//                                   <FormItem>
//                                     <FormLabel>Payment Type</FormLabel>
//                                     <Select
//                                       onValueChange={field.onChange}
//                                       defaultValue={field.value}
//                                     >
//                                       <FormControl>
//                                         <SelectTrigger>
//                                           <SelectValue placeholder="Select Payment Type" />
//                                         </SelectTrigger>
//                                       </FormControl>
//                                       <SelectContent>
//                                         <SelectItem value="select">
//                                           Select Method
//                                         </SelectItem>
//                                         {PaymentType.map((item) => (
//                                           <SelectItem value={item} key={item}>
//                                             {item}
//                                           </SelectItem>
//                                         ))}
//                                       </SelectContent>
//                                     </Select>
//                                     <FormMessage />
//                                   </FormItem>
//                                 )}
//                               />
//                             </div>
//                             <Button type="submit" className="col-span-2">
//                               Record Payment
//                             </Button>
//                           </div>
//                         </form>
//                       </Form>
//                     </div>
//                   )}

//                 {/* Payment Summary */}
//                 <Table>
//                   <TableHeader>
//                     <TableRow>
//                       <TableCell colSpan={2} className="font-semibold">
//                         Bill Summary
//                       </TableCell>
//                       <TableCell className="text-right font-semibold">
//                         Amount
//                       </TableCell>
//                     </TableRow>
//                   </TableHeader>
//                   <TableBody>
//                     <TableRow>
//                       <TableCell colSpan={2}>Total Amount</TableCell>
//                       <TableCell className="text-right">
//                         {currencyInfo?.symbol || "€"} {billAmount.total.toFixed(2)}
//                       </TableCell>
//                     </TableRow>
                    
//                     {type !== "Stock" && (
//                       <TableRow>
//                         <TableCell colSpan={2}>Product Amount</TableCell>
//                         <TableCell className="text-right">
//                           {currencyInfo?.symbol || "€"} {billAmount.product_amount.toFixed(2)}
//                         </TableCell>
//                       </TableRow>
//                     )}
                    
//                     {type !== "Stock" && billAmount.customization > 0 && (
//                       <TableRow>
//                         <TableCell colSpan={2}>Customization</TableCell>
//                         <TableCell className="text-right">
//                           {currencyInfo?.symbol || "€"} {billAmount.customization.toFixed(2)}
//                         </TableCell>
//                       </TableRow>
//                     )}
                    
//                     {billAmount.ship > 0 && (
//                       <TableRow>
//                         <TableCell colSpan={2}>Shipping</TableCell>
//                         <TableCell className="text-right">
//                           {currencyInfo?.symbol || "€"} {billAmount.ship.toFixed(2)}
//                         </TableCell>
//                       </TableRow>
//                     )}
                    
//                     <TableRow className="bg-gray-50">
//                       <TableCell colSpan={2} className="font-semibold">
//                         Paid Amount
//                       </TableCell>
//                       <TableCell className="text-right font-semibold">
//                         {currencyInfo?.symbol || "€"} {billAmount.paid.toFixed(2)}
//                       </TableCell>
//                     </TableRow>
                    
//                     <TableRow className="bg-gray-50">
//                       <TableCell colSpan={2} className="font-semibold">
//                         Balance Amount
//                       </TableCell>
//                       <TableCell className="text-right font-semibold">
//                         {currencyInfo?.symbol || "€"} {billAmount.balance.toFixed(2)}
//                       </TableCell>
//                     </TableRow>
//                   </TableBody>
//                 </Table>

//                 {/* Stripe Payment Button for Retailer Panel */}
//                 {!pathname?.includes("/admin-panel/order-list") && billAmount.balance > 0 && (
//                   <div className="mt-6 p-4 border rounded-lg bg-blue-50">
//                     <div className="flex flex-col items-center space-y-4">
//                       <div className="text-center">
//                         <h3 className="font-semibold text-lg">Pay Your Balance</h3>
//                         <p className="text-sm text-gray-600">
//                           Secure payment via Stripe
//                         </p>
//                       </div>
                      
//                       <Button
//                         onClick={handleStripePayment}
//                         disabled={isProcessingPayment}
//                         className="w-full max-w-md gap-2"
//                       >
//                         {isProcessingPayment ? (
//                           <>
//                             <Loader2 className="h-4 w-4 animate-spin" />
//                             Processing Payment...
//                           </>
//                         ) : (
//                           <>
//                             <CreditCard className="h-4 w-4" />
//                             Pay {currencyInfo?.symbol || "€"}{billAmount.balance.toFixed(2)} via Stripe
//                           </>
//                         )}
//                       </Button>
                      
//                       <p className="text-xs text-gray-500 text-center">
//                         You will be redirected to Stripe's secure payment page
//                       </p>
//                     </div>
//                   </div>
//                 )}

//                 {/* Customization Edit Dialog */}
//                 {type !== "Stock" && (
//                   <div className="mt-6">
//                     <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
//                       {pathname?.includes("/admin-panel/order-list") && (
//                         <DialogTrigger asChild>
//                           <Button
//                             onClick={() => customizationDetailsFun(orderId)}
//                             variant="outline"
//                           >
//                             Edit Customization
//                           </Button>
//                         </DialogTrigger>
//                       )}
//                       <DialogContent className="max-h-[90%] max-w-[95%] overflow-y-auto">
//                         <DialogHeader>
//                           <DialogTitle>Edit Customization</DialogTitle>
//                         </DialogHeader>
//                         <div className="overflow-auto">
//                           <Table>
//                             <TableHeader>
//                               <TableRow className="text-nowrap">
//                                 <TableHead>Product Code</TableHead>
//                                 <TableHead>Color</TableHead>
//                                 <TableHead>Size</TableHead>
//                                 <TableHead>Mesh Color</TableHead>
//                                 <TableHead>Beading Color</TableHead>
//                                 <TableHead>Lining</TableHead>
//                                 <TableHead>Lining Color</TableHead>
//                                 <TableHead>Customization</TableHead>
//                                 <TableHead>Customization Price</TableHead>
//                                 <TableHead>Quantity</TableHead>
//                                 <TableHead className="text-right">Action</TableHead>
//                               </TableRow>
//                             </TableHeader>
//                             <TableBody>
//                               {customizationData &&
//                                 customizationData.map((invoice) => {
//                                   const pricePerUnit =
//                                     invoice.customization_price *
//                                     invoice.quantity || 0;
//                                   return (
//                                     <TableRow key={invoice.id} className="text-nowrap">
//                                       <TableCell className="font-medium">
//                                         {invoice.product.productCode}
//                                       </TableCell>
//                                       <TableCell>{invoice.color}</TableCell>
//                                       <TableCell className="text-nowrap">
//                                         {invoice.product_size} ({invoice.size_country})
//                                       </TableCell>
//                                       <TableCell className="font-medium">
//                                         {invoice.mesh_color}
//                                       </TableCell>
//                                       <TableCell>{invoice.beading_color}</TableCell>
//                                       <TableCell>{invoice.lining}</TableCell>
//                                       <TableCell>{invoice.lining_color}</TableCell>
//                                       <TableCell>
//                                         <HoverCard>
//                                           <HoverCardTrigger asChild>
//                                             <div className="w-[100px] truncate cursor-help">
//                                               {invoice.customization}
//                                             </div>
//                                           </HoverCardTrigger>
//                                           <HoverCardContent className="w-80">
//                                             {invoice.customization}
//                                           </HoverCardContent>
//                                         </HoverCard>
//                                       </TableCell>
//                                       <TableCell>
//                                         <div className="flex">
//                                           {currencyInfo?.symbol || "€"} {pricePerUnit.toFixed(2)}
//                                         </div>
//                                       </TableCell>
//                                       <TableCell>{invoice.quantity}</TableCell>
//                                       <TableCell>
//                                         <div className="flex w-full items-center justify-end gap-1">
//                                           <Input
//                                             type="number"
//                                             value={invoice.customization_price}
//                                             onChange={(e) =>
//                                               handlePriceChange(
//                                                 invoice.id,
//                                                 Number(e.target.value)
//                                               )
//                                             }
//                                             className="h-[30px] w-[80px] border border-gray-300 p-0 ps-1"
//                                           />
//                                         </div>
//                                       </TableCell>
//                                     </TableRow>
//                                   );
//                                 })}
//                             </TableBody>
//                           </Table>
//                         </div>
//                         <DialogFooter>
//                           <Button type="button" onClick={cusSubmit}>
//                             Save Changes
//                           </Button>
//                         </DialogFooter>
//                       </DialogContent>
//                     </Dialog>
//                   </div>
//                 )}

//                 {/* Payment History */}
//                 <div className="mt-8">
//                   <div className="flex justify-center border-b-2 mb-4">
//                     <p className="text-xl font-semibold">Payment History</p>
//                   </div>

//                   {payment && payment.length > 0 ? (
//                     <Table>
//                       <TableHeader>
//                         <TableRow>
//                           <TableHead className="font-semibold">Date</TableHead>
//                           <TableHead className="font-semibold">Method</TableHead>
//                           <TableHead className="font-semibold">Status</TableHead>
//                           <TableHead className="text-right font-semibold">
//                             Amount
//                           </TableHead>
//                           {pathname?.includes("/admin-panel/order-list") && (
//                             <TableHead className="text-right font-semibold">
//                               Actions
//                             </TableHead>
//                           )}
//                         </TableRow>
//                       </TableHeader>
//                       <TableBody>
//                         {payment.map((invoice: any) => {
//                           const isStripe = invoice.paymentMethod === "Stripe";
//                           const paymentDetails = JSON.parse(invoice.paymentDetails || "{}");
//                           const status = invoice.paymentStatus || paymentDetails.status || "unknown";
                          
//                           return (
//                             <TableRow key={invoice.id}>
//                               <TableCell className="font-medium">
//                                 {formatDateTime(invoice.createdAt)}
//                               </TableCell>
//                               <TableCell>
//                                 <div className="flex items-center gap-2">
//                                   {isStripe ? (
//                                     <>
//                                       <CreditCard className="h-4 w-4" />
//                                       <span>Stripe</span>
//                                     </>
//                                   ) : (
//                                     <span>{invoice.paymentMethod}</span>
//                                   )}
//                                 </div>
//                               </TableCell>
//                               <TableCell>
//                                 <div className="flex items-center gap-2">
//                                   {status === "completed" ? (
//                                     <>
//                                       <CheckCircle className="h-4 w-4 text-green-500" />
//                                       <span className="text-green-600">Completed</span>
//                                     </>
//                                   ) : status === "pending" ? (
//                                     <>
//                                       <Loader2 className="h-4 w-4 text-yellow-500 animate-spin" />
//                                       <span className="text-yellow-600">Pending</span>
//                                     </>
//                                   ) : (
//                                     <>
//                                       <XCircle className="h-4 w-4 text-red-500" />
//                                       <span className="text-red-600">{status}</span>
//                                     </>
//                                   )}
//                                 </div>
//                               </TableCell>
//                               <TableCell className="text-right">
//                                 {currencyInfo?.symbol || "€"} {invoice.amount.toFixed(2)}
//                               </TableCell>
//                               {pathname?.includes("/admin-panel/order-list") && (
//                                 <TableCell className="p-0 text-right">
//                                   <EditPayment
//                                     id={invoice.id}
//                                     fun={fetchData}
//                                     balance={billAmount.balance}
//                                     paid={invoice.amount}
//                                   />
//                                 </TableCell>
//                               )}
//                             </TableRow>
//                           );
//                         })}
//                       </TableBody>
//                     </Table>
//                   ) : (
//                     <div className="text-center py-8 text-gray-500">
//                       No payment history found
//                     </div>
//                   )}
//                 </div>
//               </AccordionContent>
//             </AccordionItem>
//           </Accordion>
//         </div>

//         <SheetFooter>
//           <SheetClose asChild>
//             <Button variant="outline">Close</Button>
//           </SheetClose>
//         </SheetFooter>
//       </SheetContent>
//     </Sheet>
//   );
// };

// export default Details;