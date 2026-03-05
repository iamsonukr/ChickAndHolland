"use client";
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
import { Button } from "@/components/ui/button";
import { Landmark, CreditCard } from "lucide-react";
import { memo, useEffect, useState } from "react";
import { getBankDetails } from "@/lib/data";

const CustomerBankDetails = ({ data }: { data: any }) => {
  const [bankData, setBankData] = useState<{
    account: string;
    bankName: string;
    branch: string;
    ifc: string;
    retailerId: string;
    address: string;
    card_address: string;
    card?: string;
    card_name?: string;
    exp?: string;
  } | null>();

  const fetchDetails = async () => {
    try {
      const bankDetails = await getBankDetails(data.retailer.id);
      setBankData({
        ...bankDetails.data,
        card: bankDetails.data.card,
        exp: bankDetails.data.exp,
      });
    } catch (error) {
      setBankData(null);
      console.log(error);
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          className="flex items-center gap-2"
          title="View Bank Details"
          onClick={fetchDetails}
        >
          <Landmark className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Bank Details</SheetTitle>
          <SheetDescription>Customer banking information</SheetDescription>
        </SheetHeader>

        {bankData ? (
          <div className="space-y-4 py-6">
            {/* Bank Account Card */}
            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <Landmark className="h-5 w-5 text-blue-500" />
                <h3 className="font-semibold text-gray-800">Bank Account</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Bank Name</span>
                  <span className="font-medium text-gray-900">
                    {bankData.bankName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Account Number</span>
                  <span className="font-medium text-gray-900">
                    {bankData.account}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Swift Code</span>
                  <span className="font-medium text-gray-900">
                    {bankData.ifc}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Branch</span>
                  <span className="font-medium text-gray-900">
                    {bankData.branch}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Address</span>
                  <span className="font-medium text-gray-900">
                    {bankData.address}
                  </span>
                </div>
              </div>
            </div>

            {/* Card Details Card (if available) */}
            {bankData.card && (
              <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-green-500" />
                  <h3 className="font-semibold text-gray-800">Card Details</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Card Name</span>
                    <span className="font-medium text-gray-900">
                      {bankData.card_name ?? "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Card Number</span>
                    <span className="font-medium text-gray-900">
                      {bankData.card}
                    </span>
                  </div>
                  {bankData.exp && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Expiry</span>
                      <span className="font-medium text-gray-900">
                        {bankData.exp}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Address</span>
                    <span className="font-medium text-gray-900">
                      {bankData.card_address}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="py-6 text-center text-gray-500">
            Details Not Provided
          </div>
        )}
        <SheetFooter>
          <SheetClose asChild>
            <Button variant="outline">Close</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default memo(CustomerBankDetails);
