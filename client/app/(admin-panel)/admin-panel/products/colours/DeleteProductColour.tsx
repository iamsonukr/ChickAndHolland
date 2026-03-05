'use client'

import { useState } from "react";
import { Button } from "@/components/custom/button";
import { Delete } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import useHttp from "@/lib/hooks/usePost";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction
} from "@/components/ui/alert-dialog";

interface DeleteProductColourProps {
  colourId: number; // Assuming each colour has a unique ID
}

const DeleteProductColour = ({ colourId }: DeleteProductColourProps) => {
  const [open, setOpen] = useState(false);
  const { loading, error, executeAsync } = useHttp(`/product-colours/${colourId}` , "DELETE");
  const router = useRouter();

  const handleDelete = async () => {
    try {
      await executeAsync();
      toast.success("Deleted Colour Successfully");
      router.refresh();
    } catch (err) {
      toast.error("Something went wrong, please try again later", {
        className: "bg-destructive"
      });
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant={"destructive"} size={"icon"}>
          <Delete />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete this colour.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              onClick={handleDelete}
              loading={loading}
              disabled={loading}
            >
              Continue
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteProductColour;
