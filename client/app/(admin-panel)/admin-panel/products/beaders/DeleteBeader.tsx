"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Delete } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/custom/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import useHttp from "@/lib/hooks/usePost";

const DeleteBeader = ({ beaderId }: { beaderId: number }) => {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { executeAsync, loading } = useHttp(`/beaders/${beaderId}`, "DELETE");

  const handleDelete = async () => {
    try {
      await executeAsync();
      toast.success("Deleted Beader Successfully");
      setOpen(false);
      router.refresh();
    } catch {
      toast.error("Something went wrong, please try again later", {
        className: "bg-destructive",
      });
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="icon" aria-label="Delete beader">
          <Delete className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete this
            beader from the dropdown list.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button onClick={handleDelete} loading={loading} disabled={loading}>
              Continue
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteBeader;
