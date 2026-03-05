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

import ProductDetailsSheet from "@/components/custom/productCardDetails";
import OrderDetails from "../pending-orders/OrderDetails";

const DetailOrder = ({
  id,
  retailerId,
  type,
}: {
  id: number;
  retailerId: number;
  type: string;
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

  useEffect(() => {}, [id, type]);
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

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {data.map((item: any, index: number) => {
              return (
                <div
                  key={index}
                  className="h-70 flex flex-col gap-2 space-y-2 rounded-lg border shadow-sm"
                >
                  {type == "Fresh" ? (
                    <>
                      <img
                        className="h-[100%] object-fill"
                        src={item?.product?.images[0]?.name}
                        alt="profile-picture"
                      />
                      <ProductDetailsSheet data={item} />
                    </>
                  ) : (
                    <>
                      <img
                        className="h-[100%] object-fill"
                        src={item.image_name}
                        alt="profile-picture"
                      />
                      <OrderDetails data={item} />
                    </>
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

export default DetailOrder;
