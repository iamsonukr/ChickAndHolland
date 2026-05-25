import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import ActionButtons from "../pending-orders/ActionButtons";
import { fresh } from "@/lib/utils";
import { formatDateOnlyDisplay } from "@/lib/dateOnly";

/**
 * Shared column widths for the Rejected view.
 * We use slightly wider columns here since there are fewer of them,
 * but keeping the 'Date' and 'Type' widths similar to other tabs for visual harmony.
 */
const COL_WIDTHS = {
  date: "w-[150px]",
  type: "w-[180px]",
  quantity: "w-[120px]",
  amount: "w-[160px]",
  actions: "w-[180px]",
};

const RejectedOrders = ({
  data,
  retailerId,
}: {
  data: any;
  retailerId: number;
}) => {
  return (
    <div className="border rounded-md overflow-hidden">
      <Table className="table-fixed w-full">
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className={`${COL_WIDTHS.date} text-center`}>Date</TableHead>
            <TableHead className={`${COL_WIDTHS.type} text-center`}>Type</TableHead>
            <TableHead className={`${COL_WIDTHS.quantity} text-center`}>Quantity</TableHead>
            <TableHead className={`${COL_WIDTHS.amount} text-center`}>Total Amount</TableHead>
            <TableHead className={`${COL_WIDTHS.actions} text-center`}>Details</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {Array.isArray(data) && data.length > 0 ? (
            data.map((item: any) => (
              <TableRow 
                key={item.id} 
                className="text-center hover:bg-muted/20 transition-colors"
              >
                <TableCell className="font-medium">
                  {formatDateOnlyDisplay(item.formatted_date, "DD-MM-YYYY")}
                </TableCell>

                <TableCell>
                  {item.order_type === "Fresh" ? fresh : item.order_type}
                </TableCell>

                <TableCell className="font-semibold">
                  {item.Total || 0}
                </TableCell>

                <TableCell>
                  <span className="font-medium text-destructive">
                    {item.currencySymbol || "€"}{" "}
                    {parseFloat(item.total_price || 0).toFixed(0)}
                  </span>
                </TableCell>

                <TableCell>
                  <div className="flex justify-center">
                    <ActionButtons
                      id={item.id}
                      retailerId={retailerId}
                      is_approved={item.is_approved}
                      type={item.order_type}
                      comments={item.rejected_comments}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                No rejected orders found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default RejectedOrders;
