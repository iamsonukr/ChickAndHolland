import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CustomizedImage } from "./CustomizedImage";

export function SizeChartDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="my-2 w-full bg-black outline-none">
          Size Chart
        </Button>
      </DialogTrigger>
    <DialogContent className="">
  <DialogHeader>
    <DialogTitle className="sr-only">Size Chart</DialogTitle>
  </DialogHeader>

  <div>
    <CustomizedImage
      src="https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/size-chart/image1.jpeg"
      alt="Size Chart"
      unoptimized
      className=""
    />
  </div>
</DialogContent>

    </Dialog>
  );
}
