import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import ActionButtons from "../pending-orders/ActionButtons";
import { fresh } from "@/lib/utils";
import dayjs from "dayjs";
const RejectedOrders = ({
  data,
  retailerId,
}: {
  data: any;
  retailerId: number;
}) => {
  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="">Date</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Total Amount</TableHead>
            <TableHead className="text-right">Details</TableHead>
          </TableRow>
        </TableHeader>
       <TableBody>
  {Array.isArray(data) && data.length > 0 ? (
    data.map((item: any) => (
      <TableRow key={item.id}>
        <TableCell className="font-medium">
          {dayjs(item.formatted_date).format("DD-MM-YYYY")}
        </TableCell>

        <TableCell>
          {item.order_type === "Fresh" ? fresh : item.order_type}
        </TableCell>

        <TableCell>{item.Total}</TableCell>

        <TableCell>
          {item.currencySymbol
            ? `${item.currencySymbol} ${parseFloat(item.total_price).toFixed(0)}`
            : `€ ${parseFloat(item.total_price).toFixed(0)}`}
        </TableCell>

        <TableCell className="text-right">
          <ActionButtons
            id={item.id}
            retailerId={retailerId}
            is_approved={item.is_approved}
            type={item.order_type}
            comments={item.rejected_comments}
          />
        </TableCell>
      </TableRow>
    ))
  ) : (
    <TableRow>
      <TableCell colSpan={5} className="text-center py-6">
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
