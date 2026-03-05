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
import { Edit } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { AddLocatorForm, addLocatorFormSchema } from "@/lib/formSchemas";
import useHttp from "@/lib/hooks/usePost";
import { AutocompleteCustom } from "@/components/custom/SearchLocations";

const EditLocator = ({ data }: { data: any }) => {
  const [open, setOpen] = useState(false);

  const form = useForm<AddLocatorForm>({
    resolver: zodResolver(addLocatorFormSchema),
    defaultValues: {
      name: "",
      proximity: "",
      address: "",
      city_name: "",
      coordinates: {
        latitude: "",
        longitude: "",
      },
    },
  });

  const { loading, error, executeAsync } = useHttp(
    `/clients/new/${data?.id}`,
    "PUT",
  );

  const router = useRouter();

  const onSubmit = async (data: AddLocatorForm) => {
    try {
      const response = await executeAsync(data);

      if (error) {
        return toast.error("Failed to edit expense");
      }

      form.reset();
      setOpen(false);
      toast.success(response.message ?? "location edited successfully");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Failed to edit location");
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

  useEffect(() => {
    form.setValue("name", data.name);
    form.setValue("proximity", data.proximity.toString());
    form.setValue("address", data.address);
    form.setValue("city_name", data.city_name);

    form.setValue("coordinates", {
      latitude: data.latitude,
      longitude: data.longitude,
    });
  }, [data]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant={"outline"} size={"icon"}>
          <Edit />
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
            onSubmit={form.handleSubmit(onSubmit, (errors) => {
              console.log(errors);
            })}
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
            <FormField
              control={form.control}
              name="city_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter city name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <AutocompleteCustom
              onPlaceSelect={onChange}
              defaultValue={data?.address}
            />

            <div>
              <Button type="submit" className="mt-4 w-full" disabled={loading}>
                {loading ? "Loading..." : "Update Location"}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
};

export default EditLocator;
