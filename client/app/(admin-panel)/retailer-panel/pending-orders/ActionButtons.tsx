"use client";

import { useEffect, useState } from "react";
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
  getRetailerOrderDetails,
  getRetailerStockOrderDetails,
} from "@/lib/data";
import ProductCard from "@/components/custom/ProductCard";
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
import OrderDetails from "./OrderDetails";
import ProductDetailsSheet from "@/components/custom/productCardDetails";
import { Euro } from "lucide-react";

const invoices = [
  {
    invoice: "INV001",
    paymentStatus: "Paid",
    totalAmount: "$250.00",
    paymentMethod: "Credit Card",
  },
  {
    invoice: "INV002",
    paymentStatus: "Pending",
    totalAmount: "$150.00",
    paymentMethod: "PayPal",
  },
  {
    invoice: "INV003",
    paymentStatus: "Unpaid",
    totalAmount: "$350.00",
    paymentMethod: "Bank Transfer",
  },
  {
    invoice: "INV004",
    paymentStatus: "Paid",
    totalAmount: "$450.00",
    paymentMethod: "Credit Card",
  },
  {
    invoice: "INV005",
    paymentStatus: "Paid",
    totalAmount: "$550.00",
    paymentMethod: "PayPal",
  },
  {
    invoice: "INV006",
    paymentStatus: "Pending",
    totalAmount: "$200.00",
    paymentMethod: "Bank Transfer",
  },
  {
    invoice: "INV007",
    paymentStatus: "Unpaid",
    totalAmount: "$300.00",
    paymentMethod: "Credit Card",
  },
];

const ActionButtons = ({
  id,
  retailerId,
  is_approved,
  type,
  comments,
}: {
  id: number;
  retailerId: number;
  is_approved: number;
  type: string;
  comments?: string;
}) => {
  const [data, setData] = useState([]);

  const fetchData = async () => {
    try {
      let res;
      {
        type == "Fresh"
          ? (res = await getRetailerOrderDetails(retailerId, id))
          : (res = await getRetailerStockOrderDetails(retailerId, id));
      }
      setData(res.favourites);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {}, [id, type, is_approved]);
  return (
    <div>
      <Sheet>
        <SheetTrigger asChild>
          <Button onClick={fetchData}>Details</Button>
        </SheetTrigger>
        <SheetContent className="!max-w-[95%] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Order Details</SheetTitle>
          </SheetHeader>
          {is_approved == 3 && (
            <div className="my-2">
              <p className="text-xl underline">Rejected Comments</p>
              <p className="text-lg"> {comments}</p>
            </div>
          )}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-6">
            {data.map((item: any) => {
              return (
                <div
                  key={item.id}
                  className="h-70 flex flex-col gap-2 space-y-2 rounded-lg border shadow-sm"
                >
                  {type == "Fresh" ? (
                    <div className="relative">
                      <div className="absolute right-1 top-1 flex flex-col items-end">
                        <p className="bg-[#000000ba] px-1 text-white">
                          {item.product.productCode}
                        </p>
                        <p className="mt-1 w-fit bg-[#000000ba] px-1 text-white">
                          {item.currencySymbol ? `${item.currencySymbol} ${parseFloat(item.unitPrice || 0).toFixed(2)}` : `€ ${item.product.price}`}
                        </p>
                      </div>
                      <img
                        className="aspect-square h-full w-full object-cover"
                        src={item.product.images[0].name}
                        alt="profile-picture"
                      />
                      <div className="mt-2">
                        <ProductDetailsSheet data={item} />
                      </div>
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="absolute right-1 top-1 flex flex-col items-end">
                        <p className="bg-[#000000ba] px-1 text-white">
                          {item.productCode}
                        </p>
                        <p className="mt-1 w-fit bg-[#000000ba] px-1 text-white">
                          {item.currencySymbol ? `${item.currencySymbol} ${parseFloat(item.unitPrice || 0).toFixed(2)}` : `€ ${item.price}`}
                        </p>
                      </div>
                      <img
                        className="aspect-square h-full w-full object-cover"
                        src={item.image_name}
                        alt="profile-picture"
                      />
                      <div className="mt-2">
                        <OrderDetails data={item} />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <SheetFooter>
            {/* <SheetClose asChild>
              <Button type="submit">Save changes</Button>
            </SheetClose> */}
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default ActionButtons;
