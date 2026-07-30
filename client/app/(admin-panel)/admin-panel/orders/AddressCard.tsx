import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const renderAddressLines = (address: string) =>
  address.split("\n").map((line, index) => {
    const separatorIndex = line.indexOf(":");

    if (separatorIndex < 0) {
      return <p key={`${line}-${index}`}>{line}</p>;
    }

    const label = line.slice(0, separatorIndex + 1);
    const value = line.slice(separatorIndex + 1);

    return (
      <p key={`${line}-${index}`}>
        <span className="font-bold">{label}</span>
        {value}
      </p>
    );
  });

const AddressCard = ({ ad }: { ad: string }) => {
  return (
    <div>
      <Dialog>
        <DialogTrigger asChild>
          <div className="cursor-pointer whitespace-pre-line">
            {renderAddressLines(ad)}
          </div>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="font-bold">Shipping Address</DialogTitle>
          </DialogHeader>
          <div className="break-words">{renderAddressLines(ad)}</div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AddressCard;
