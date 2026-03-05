import React from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Details from "./Details";
import { fresh } from "@/lib/utils";
import dayjs from "dayjs";
const DeliveredOrders = ({ data, id }: { data: any[]; id: number }) => {

  return (
    <div>
      {" "}
      <Table>
        <TableHeader>
          <TableRow className="text-center">
            <TableHead className="">Date</TableHead>
            <TableHead className="text-nowrap">Order Id</TableHead>
            <TableHead className="text-nowrap">Order Type</TableHead>
            <TableHead className="text-nowrap">Status</TableHead>
            <TableHead className="text-nowrap">Tracking ID</TableHead>
            <TableHead className="text-nowrap">Order Date</TableHead>
            <TableHead className="text-nowrap">Paid</TableHead>
            <TableHead className="text-nowrap">Balance</TableHead>
            <TableHead>Details</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data &&
            data.map((item: any) => (
              <TableRow className="text-nowrap">
                <TableCell className="font-medium">
                   {dayjs(item.formatted_date).format("DD-MM-YYYY")}
                 
                </TableCell>
                <TableCell>{item.order_id}</TableCell>
                <TableCell>
                  {item.type == "Fresh" ? fresh : item.type}
                </TableCell>
                <TableCell>{item.orderStatus}</TableCell>
                <TableCell>{item.trackingNo}</TableCell>
                <TableCell>
                  {dayjs(item.orderReceivedDate).format("DD-MM-YYYY")}
                </TableCell>
                <TableCell>
                  {item.currencySymbol
                    ? `${item.currencySymbol} ${parseFloat(item.paid_amount).toFixed(0)}`
                    : `€ ${parseFloat(item.paid_amount).toFixed(0)}`}
                </TableCell>
                <TableCell>
                  {item.currencySymbol
                    ? `${item.currencySymbol} ${parseFloat(item.balance).toFixed(0)}`
                    : `€ ${parseFloat(item.balance).toFixed(0)}`}
                </TableCell>
                <TableCell>
                  <Details
                    id={
                      item.stockOrderId
                        ? item.stockOrderId
                        : item.favouriteOrderId
                    }
                    retailerId={id}
                    type={item.type}
                    paymentId={item.payment_id}
                    orderId={item.order_id}
                  />
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default DeliveredOrders;
