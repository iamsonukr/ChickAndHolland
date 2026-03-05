"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
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
import {
  AddCustomerForm as AddCustomerFormType,
  addCustomerFormSchema,
} from "@/lib/formSchemas";
import useHttp from "@/lib/hooks/usePost";
import { AutocompleteCustom } from "@/components/custom/SearchLocations";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const AddCustomerForm = ({ 
  countries, 
  currencies 
}: { 
  countries: any[]; 
  currencies: any[]; 
}) => {
  const [open, setOpen] = useState(false);

  const form = useForm<AddCustomerFormType>({
    resolver: zodResolver(addCustomerFormSchema),
    defaultValues: {
      name: "",
      storeName: "",
      proximity: "",
      address: "",
      city_name: "",
      coordinates: {
        latitude: "",
        longitude: "",
      },
      website: "",
      contactPerson: "",
      email: "",
      phoneNumber: "",
      country_id: "",
      currency_id: "",
    },
  });

  const { loading, error, executeAsync } = useHttp("/customers");

  const router = useRouter();

  const onSubmit = async (data: AddCustomerFormType) => {
    try {
      const response = await executeAsync(data);

      if (error) {
        return toast.error("Failed to add customer");
      }

      form.reset();
      form.setValue("country_id", "");
      form.setValue("currency_id", "");
      setOpen(false);
      toast.success(response.message ?? "Customer added successfully");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Failed to add customer");
    }
  };

  const onChange = async (place: google.maps.places.PlaceResult | null) => {
    if (!place) return;

    if (!place.geometry?.location || !place.formatted_address) {
      return;
    }

    const city = place.address_components?.find((component) => {
      return (
        component.types.includes("locality") ||
        component.types.includes("administrative_area_level_2")
      );
    });

    const city_name = city?.long_name || place.name;

    // form.setValue("city_name", city_name as string);
    form.setValue("address", place?.formatted_address);

    const latitude = place?.geometry?.location?.lat();
    const longitude = place?.geometry?.location?.lng();

    form.setValue("coordinates", {
      latitude: latitude.toString(),
      longitude: longitude.toString(),
    });
  };

  console.log(countries);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button>
          Add New Customer <Plus />
        </Button>
      </SheetTrigger>
      <SheetContent className="min-w-[100%] overflow-y-auto md:min-w-[50%] lg:min-w-[35%]">
        <SheetHeader>
          <SheetTitle>Add New Customer</SheetTitle>
          <SheetDescription>
            Fill in the form below to add a new customer
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
                  <FormLabel>Customer Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="storeName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Store Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Rainbow Store" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <AutocompleteCustom
              onPlaceSelect={onChange}
              placeholder={"Select Address of the Customer"}
              label={"Address of the Customer"}
            />
            <FormField
              control={form.control}
              name="city_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City Name</FormLabel>
                  <FormControl>
                    <Input placeholder="City" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="country_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Country" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem
                          key={country.id.toString()}
                          value={country.id.toString()}
                        >
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select the Country where this customer is located.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="currency_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Currency</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Currency" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {currencies.map((currency) => (
                        <SelectItem
                          key={currency.id.toString()}
                          value={currency.id.toString()}
                        >
                          <div className="flex items-center gap-2">
                            <span>{currency.name}</span>
                            <span className="text-xs text-gray-500">
                              ({currency.code})
                            </span>
                            <span className="text-xs font-medium text-blue-600">
                              {currency.symbol}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select the Currency for this customer. This will determine pricing on product pages.
                  </FormDescription>
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
              name="website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website</FormLabel>
                  <FormControl>
                    <Input placeholder="https://rainbowstore.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contactPerson"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Person</FormLabel>
                  <FormControl>
                    <Input placeholder="Chiron" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="rainbowstore@olympians.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="971841878487" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <Button type="submit" className="mt-4 w-full" disabled={loading}>
                {loading ? "Loading..." : "Add Customer"}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
};

export default AddCustomerForm;
