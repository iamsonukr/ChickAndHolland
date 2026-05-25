import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Details from "./Details";
import { fresh } from "@/lib/utils";
import { formatDateOnlyDisplay } from "@/lib/dateOnly";

// Match these exactly with your main page for perfect alignment across tabs
const COL_WIDTHS = {
  date: "w-[110px]",
  orderId: "w-[130px]",
  type: "w-[150px]",
  status: "w-[130px]",
  tracking: "w-[150px]",
  amount: "w-[100px]",
  actions: "w-[120px]",
};

const DeliveredOrders = ({ data, id }: { data: any[]; id: number }) => {
  return (
    <div className="border rounded-md">
      <Table className="table-fixed w-full">
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className={`${COL_WIDTHS.date} text-center`}>Date</TableHead>
            <TableHead className={`${COL_WIDTHS.orderId} text-center`}>Order Id</TableHead>
            <TableHead className={`${COL_WIDTHS.type} text-center`}>Order Type</TableHead>
            <TableHead className={`${COL_WIDTHS.status} text-center`}>Status</TableHead>
            <TableHead className={`${COL_WIDTHS.tracking} text-center`}>Tracking ID</TableHead>
            <TableHead className={`${COL_WIDTHS.date} text-center`}>Order Date</TableHead>
            <TableHead className={`${COL_WIDTHS.amount} text-center`}>Paid</TableHead>
            <TableHead className={`${COL_WIDTHS.amount} text-center`}>Balance</TableHead>
            <TableHead className={`${COL_WIDTHS.actions} text-center`}>Details</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data && data.length > 0 ? (
            data.map((item: any) => (
              <TableRow 
                key={item.order_id || item.stockOrderId || item.favouriteOrderId} 
                className="text-center hover:bg-muted/20"
              >
                <TableCell className="truncate">
                  {formatDateOnlyDisplay(item.formatted_date, "DD-MM-YYYY")}
                </TableCell>
                
                <TableCell className="font-medium">{item.order_id}</TableCell>
                
                <TableCell>
                  {item.type === "Fresh" ? fresh : item.type}
                </TableCell>
                
                <TableCell>
                   <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {item.orderStatus}
                  </span>
                </TableCell>
                
                <TableCell className="truncate">{item.trackingNo || "-"}</TableCell>
                
                <TableCell>
                  {formatDateOnlyDisplay(
                    item.orderReceivedDate ?? item.received_date,
                    "DD-MM-YYYY",
                  )}
                </TableCell>
                
                <TableCell>
                  {item.currencySymbol || "€"} {parseFloat(item.paid_amount || 0).toFixed(0)}
                </TableCell>
                
                <TableCell>
                  {item.currencySymbol || "€"} {parseFloat(item.balance || 0).toFixed(0)}
                </TableCell>
                
                <TableCell>
                  <Details
                    id={item.stockOrderId || item.favouriteOrderId}
                    retailerId={id}
                    type={item.type}
                    paymentId={item.payment_id}
                    orderId={item.order_id}
                  />
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={9} className="h-24 text-center">
                No delivered orders found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default DeliveredOrders;
