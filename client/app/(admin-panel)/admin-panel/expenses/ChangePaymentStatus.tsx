"use client";

import { TableCell } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import useHttp from "@/lib/hooks/usePost";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";

const ChangePaymentStatus = ({ data }: { data: any }) => {
  const { executeAsync, loading } = useHttp(`/expenses/${data.id}`, "PATCH");
  const router = useRouter();
  const currentStatus = data.isPaid === 0 ? "0" : "1";

  const handleChange = async (value: string) => {
    if (value === currentStatus) return;
    try {
      await executeAsync({ isPaid: Number(value) });
      toast("Changed Payment Status Successfully");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Failed to change payment status");
    }
  };

  return (
    <TableCell
      className={cn(
        data.isPaid == 0 ? "text-red-500" : "text-green-500",
        "cursor-pointer",
      )}
    >
      <Select defaultValue={currentStatus} onValueChange={handleChange}>
        <SelectTrigger>
          {data.isPaid == 0 ? "Pending" : "Paid"}{" "}
          {data[data.isPaid == 0 ? "Pending" : "Paid"] &&
            dayjs(data[data.isPaid == 0 ? "Pending" : "Paid"]).format(
              "MMMM D, YYYY",
            )}
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="0">
            <div className="flex w-full justify-between">
              Pending{" "}
              {data.Pending && dayjs(data.Pending).format("MMMM D, YYYY")}
            </div>
          </SelectItem>
          <SelectItem value="1">
            <div className="flex w-full justify-between">
              Paid {data.Paid && dayjs(data.Paid).format("MMMM D, YYYY")}
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </TableCell>
  );
};

export default ChangePaymentStatus;
