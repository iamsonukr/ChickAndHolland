"use client";

import { Button } from "@/components/ui/button";
import { Delete, UploadCloud } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { getQuickbookStatus } from "@/lib/data";
import { useRouter } from "next/navigation";
import useHttp from "@/lib/hooks/usePost";
import Link from "next/link";

const ImportQuickbook = () => {

  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { executeAsync, loading } = useHttp(`/quickbook/import-customers`, "POST");
  const [res, setRes] = useState<any>(null);

  return (
    <>
      <AlertDialog open={open} onOpenChange={(change) => {
        setOpen(change);
        setRes(null);
      }}>
        {/*<AlertDialogTrigger asChild>*/}
        {/*  <Button variant={"destructive"} size={"icon"}>*/}
        {/*    <Delete />*/}
        {/*  </Button>*/}
        {/*</AlertDialogTrigger>*/}
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              The existing customers will not be changed, and the new customers will be imported.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            {/*<AlertDialogAction asChild>*/}
            <Button
              onClick={async () => {
                try {
                  const res = await executeAsync();
                  setRes(res);
                  if (res.success) {
                    toast(res.message);
                  }
                  // setOpen(false);
                  router.refresh();
                } catch (err) {
                  toast.error(
                    "Something went wrong, please try again later",
                    {
                      className: "bg-destructive"
                    }
                  );
                }
              }}
              // loading={loading}
              disabled={loading}
            >
              {loading ? "Loading..." : "Continue"}
            </Button>
            {/*</AlertDialogAction>*/}
          </AlertDialogFooter>
          {res?.stats.failedCustomers && (
            <div className={"flex text-sm  flex-col gap-2"}>
              <p className={"text-destructive"}>These customers were failed to import automatically, please import them
                manually:</p>
              <ul className={"list-disc mx-4"}>
                {res.stats.failedCustomers.map((fc:any) => (
                  <li key={fc.id}>
                    {fc.name} - {fc.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </AlertDialogContent>
      </AlertDialog>

      <Button variant={"outline"} className={"space-x-2"} onClick={async () => {
        const res = await getQuickbookStatus();
        if (res.connected) {
         
          setOpen(true);
        } else {
          toast.error(<>
            <p>Please <Link href={"/admin-panel/quickbook"} className={"text-blue-500"}>Login</Link> to quickbook to
              import customers</p>
          </>);
        }
      }}>
        Import From Quickbook <UploadCloud className={"ml-2"} />
      </Button>
    </>

  );
};

export default ImportQuickbook;