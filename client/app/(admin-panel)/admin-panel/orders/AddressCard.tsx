import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const AddressCard = ({ ad }: { ad: string }) => {
  return (
    <div>
        <Dialog>
        <DialogTrigger asChild>
          <p className="whitespace-pre-line">{ad}</p>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Address</DialogTitle>
          </DialogHeader>
          <div className="whitespace-pre-line break-words">{ad}</div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AddressCard;
