"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormLabel,
  FormField,
  FormMessage,
  FormItem,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { AddLocatorForm, addLocatorFormSchema } from "@/lib/formSchemas";
import useHttp from "@/lib/hooks/usePost";
import { AutocompleteCustom } from "@/components/custom/SearchLocations";


const AddLocator = () => {
  const [open, setOpen] = useState(false);

  const form = useForm<AddLocatorForm>({
    resolver: zodResolver(addLocatorFormSchema),
    defaultValues: {
      name: "",
      proximity: "",
      address: "",
      coordinates: {
        latitude: "",
        longitude: "",
      },
    },
  });

  const { loading, executeAsync } = useHttp("/clients/new");

  const router = useRouter();

  const onSubmit = async (data: AddLocatorForm) => {
    try {
      const response = await executeAsync(data, {}, (error) => {
        toast.error("Failed to add location", {
          description:
            error?.message ?? "Something went wrong, please try again!",
        });
      });

      form.reset();
      setOpen(false);
      toast.success(response.message ?? "location added successfully");
      router.refresh();
    } catch (error: any) {
      console.error(error);
      toast.error("Failed to add location", {
        description:
          error?.message ?? "Something went wrong, please try again!",
      });
    }
  };

  const onChange = async (place: google.maps.places.PlaceResult | null) => {
    if (!place) return;

    if (!place.geometry?.location || !place.formatted_address) {
      return;
    }

    form.setValue("address", place?.formatted_address);

    const latitude = place?.geometry?.location?.lat();
    const longitude = place?.geometry?.location?.lng();

    form.setValue("coordinates", {
      latitude: latitude.toString(),
      longitude: longitude.toString(),
    });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button>
          Add New location <Plus />
        </Button>
      </SheetTrigger>
      <SheetContent className="min-w-[100%] overflow-y-auto md:min-w-[50%] lg:min-w-[35%]">
        <SheetHeader>
          <SheetTitle>Add New Location</SheetTitle>
          <SheetDescription>
            Fill in the form below to add a new Location
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            className="mt-8 space-y-2"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Store Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="proximity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Proximity (in miles)</FormLabel>
                  <FormControl>
                    <Input placeholder="5" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <AutocompleteCustom onPlaceSelect={onChange} />

            <div>
              <Button type="submit" className="mt-4 w-full" disabled={loading}>
                {loading ? "Loading..." : "Add Location"}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
};

export default AddLocator;
