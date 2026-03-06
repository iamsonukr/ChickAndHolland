"use client";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { SizeCountry, sizes } from "@/lib/formSchemas";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import useHttp from "@/lib/hooks/usePost";
import { useRouter } from "next/navigation";
import EnquireProducts from "@/components/custom/website/EnquireProducts";
import { Input } from "@/components/ui/input";
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
import * as z from "zod";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { getProductColours } from "@/lib/data";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CustomizedImage } from "@/components/custom/CustomizedImage";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const lining = [
  "No Lining",
  "Fully Stitched Lined",
  "Full Separate Lining",
  "Separate Short Lining",
  "Waist to Hips Stitched Lining",
];

const formSchema = z.object({
  productDetails: z.array(
    z.object({
      size: z.string().min(1, { message: "Size is required" }),
      color: z.string().min(1, { message: "Color is required" }),
      Quantity: z
        .number({ coerce: true })
        .min(1, { message: "Quantity is required" })
        .max(24),
      size_country: z.string().min(1, { message: "Size Country is required" }),
      customization: z.string().optional(),
      mesh: z.string().min(1, { message: "Mesh Color is required" }),
      beading: z.string().min(1, { message: "Beading Color is required" }),
      lining: z.string().min(1, { message: "Lining is required" }),
      liningColor: z.string().min(1, { message: "Lining Color is required" }),
      addLining: z.boolean().optional(),
      files: z
        .array(
          z
            .instanceof(File)
            .refine((file) => file.size <= 20 * 1024 * 1024, {
              message: "File size must be less than 20MB",
            })
            .refine((file) => file.type.startsWith("image/"), {
              message: "Only images are allowed",
            }),
        )
        .max(2, { message: "Max is 2 images" })
        .optional(),
    }),
  ),
});

const sizeOptions: Record<string, number[]> = {
  EU: [32, 34, 36, 38, 40, 42, 44, 46, 48, 50, 52, 54, 56, 58, 60],
  US: [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28],
  IT: [36, 38, 40, 42, 44, 46, 48, 50, 52, 54, 56, 58, 60, 62, 64],
  UK: [4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32],
};

const ActionButtons = ({
  productDetails,
  isRetailer,
  isLoggedIn,
  retailerId,
  favourites,
  userType,
}: {
  productDetails: any;
  isRetailer: boolean;
  isLoggedIn: boolean;
  retailerId: string | undefined;
  favourites: any[];
  userType: string;
}) => {
  const sizeCountryArray = Object.entries(SizeCountry).map(([key, value]) => ({
    value: key,
    label: value,
  })) as { value: keyof typeof SizeCountry; label: string }[];

  const [colorChatDialog, setColorChartDialog] = useState(false);
  const [open, setOpen] = useState(false);
  const [colors, setColors] = useState<any[]>([]);
  const [alreadyFavourite, setAlreadyFavourite] = useState(false);
  const [colorChart, setColorChart] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      productDetails: [
        {
          color: "",
          Quantity: 1,
          size: "",
          size_country: sizeCountryArray[0].value,
          customization: "",
          beading: productDetails.beading_color,
          lining: productDetails.lining,
          liningColor: productDetails.lining_color,
          mesh: productDetails.mesh_color,
          addLining: false,
          files: [],
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "productDetails",
  });

  const watch = form.watch("productDetails");

  // ✅ Fix: separate hook for cart — was incorrectly using addFavourites
  const { executeAsync: addToCart, loading: addToCartLoading } =
    useHttp(`/cart/add`);

  const { executeAsync: addFavourites, loading: addFavouritesLoading } =
    useHttp(`/favourites`);

  const { executeAsync: removeFavourites, loading: removeFavouritesLoading } =
    useHttp(`/favourites`, "DELETE");

  const router = useRouter();

  // ✅ Fix: fetch colors only once on mount
  useEffect(() => {
    const getcolors = async () => {
      const colours = await getProductColours({});
      setColors(colours.productColours);
    };
    getcolors();
  }, []);

  // ✅ Fix: separate effect for favourite state — no longer tied to color fetching
  useEffect(() => {
    if (isLoggedIn && isRetailer) {
      setAlreadyFavourite(
        favourites.map((fv) => fv.product.id).includes(productDetails.id),
      );
    } else {
      setAlreadyFavourite(favourites.includes(productDetails.productCode));
    }
  }, [isLoggedIn, isRetailer, favourites, productDetails.id]);

  // Fetch color chart
  useEffect(() => {
    const loadChart = async () => {
      try {
        const res = await fetch(`${API_URL}/color-chart`, { cache: "no-store" });
        const data = await res.json();
        setColorChart(data.imageUrl || null);
        setLastUpdated(data.updatedAt || data.createdAt || null);
      } catch (err) {
        console.error(err);
      }
    };
    loadChart();
  }, []);

  const addColorQuantity = () => {
    append({
      color: "",
      Quantity: 1,
      size: "",
      size_country: sizeCountryArray[0].value,
      beading: productDetails.beading_color,
      lining: productDetails.lining,
      liningColor: productDetails.lining_color,
      mesh: productDetails.mesh_color,
      customization: "",
      addLining: false,
      files: [],
    });
  };

  // ✅ Fix: removed e.preventDefault() — react-hook-form handles it
  // ✅ Fix: lining "No Lining" check now correctly iterates productDetails
  // ✅ Fix: using addToCart instead of addFavourites
  const action = form.handleSubmit(async (data) => {
    // Fix lining color per item
    const productDetailsWithoutFiles = data.productDetails.map((detail) => ({
      size: detail.size,
      color: detail.color,
      Quantity: detail.Quantity,
      size_country: detail.size_country,
      customization: detail.customization,
      mesh: detail.mesh,
      beading: detail.beading,
      lining: detail.lining,
      liningColor: detail.lining === "No Lining" ? "No Color" : detail.liningColor,
      addLining: detail.addLining,
    }));

    const formData = new FormData();
    formData.append("retailerId", retailerId || "");
    formData.append("productId", productDetails.id);
    formData.append("productDetails", JSON.stringify(productDetailsWithoutFiles));

    // Append files separately
    data.productDetails.forEach((detail, index) => {
      if (detail.files && detail.files.length > 0) {
        detail.files.forEach((file) => {
          formData.append(`files[${index}][]`, file);
        });
      }
    });

    const response = await addToCart(formData, {}, () => {
      toast.error("Add to cart failed", {
        description: "Something went wrong, please try again later",
      });
    });

    if (response?.success) {
      toast.success("Successfully added to cart");
      form.reset();
      setOpen(false);
      router.refresh();
    }
  });

  const customerWithOutLog = () => {
    if (!alreadyFavourite) {
      document.cookie = `favourites=${JSON.stringify([
        ...favourites,
        productDetails.productCode,
      ])}; path=/`;
    } else {
      document.cookie = `favourites=${JSON.stringify(
        favourites.filter((id: number) => id !== productDetails.productCode),
      )}; path=/`;
    }
    router.refresh();
  };

  const getColourBasedOnId = (id: number) => {
    return colors.find((colour: any) => colour.id === id)?.hexcode;
  };

  const getColourBasedOnhex = (hex: string) => {
    return colors.find((colour: any) => colour.hexcode === hex)?.name;
  };

  return (
    <div className="mt-4 flex flex-col gap-2">
      {!isLoggedIn && (
        <>
          <EnquireProducts
            productCodes={productDetails.productCode}
            buttonText={"Enquire Now"}
            disabled={false}
          />
          <Button
            className="!p-8 md:!p-0"
            onClick={customerWithOutLog}
            variant={"default"}
            disabled={addFavouritesLoading || removeFavouritesLoading}
          >
            Add to my Favorites
          </Button>
        </>
      )}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          {isLoggedIn && userType !== "ADMIN" && (
            <Button
              className="!p-8 md:!p-0"
              onClick={() => form.reset()}
              variant={"default"}
              // ✅ Fix: disable button while cart request is in flight
              disabled={addToCartLoading}
            >
              {addToCartLoading ? "Adding..." : "Add to my Cart"}
            </Button>
          )}
        </SheetTrigger>
        <SheetContent className="!min-w-[90%] !max-w-[90%] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Add Cart</SheetTitle>
            <SheetDescription asChild>
              <div className="flex justify-between">
                <div className="text-sm text-muted-foreground space-y-1">
                  <span>
                    After Size 48:{" "}
                    <b>49-52 - 20%, 53-56 - 40%, 57-60 - 60%</b> price
                    increasing will be there respectively.
                  </span>
                  <span>SAS: Same as sample</span>
                </div>
                <button
                  type="button"
                  className="cursor-pointer text-base font-semibold text-blue-500 underline"
                  onClick={() => setColorChartDialog(true)}
                >
                  Color Chart
                </button>
              </div>
            </SheetDescription>
          </SheetHeader>

          <Form {...form}>
            <form
              className="mx-auto space-y-2 py-10"
              onSubmit={action}
            >
              {fields.map((item, index) => (
                <div
                  className="rounded-md border border-gray-200 p-2"
                  key={item.id}
                >
                  <div className="flex">
                    <p className="flex h-[20px] w-[20px] items-center justify-center rounded-full bg-black p-1 text-center text-white">
                      {index + 1}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
                    {/* SIZE COUNTRY */}
                    <FormField
                      control={form.control}
                      name={`productDetails.${index}.size_country`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Size Country</FormLabel>
                          <Select
                            onValueChange={(val) => {
                              field.onChange(val);
                              form.setValue(`productDetails.${index}.size`, "");
                            }}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Size Country" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.keys(sizeOptions).map((country) => (
                                <SelectItem key={country} value={country}>
                                  {country}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* SIZE */}
                    <FormField
                      control={form.control}
                      name={`productDetails.${index}.size`}
                      render={({ field }) => {
                        // ✅ Fix: typed key lookup
                        const country = form.getValues(`productDetails.${index}.size_country`);
                        const options = sizeOptions[country as keyof typeof sizeOptions] || [];
                        return (
                          <FormItem>
                            <FormLabel>Select Size</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select Size" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {options.map((s) => (
                                  <SelectItem key={s} value={String(s)}>
                                    {s}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />

                    {/* COLOR */}
                    <FormField
                      control={form.control}
                      name={`productDetails.${index}.color`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Select Color</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Color" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value={"SAS"}>
                                <div className="flex gap-1">
                                  SAS (
                                  <div className="flex items-center">
                                    <p
                                      className="mx-1 h-4 w-4 rounded-full"
                                      style={{
                                        backgroundColor: productDetails.mesh_color,
                                        border: "1px solid #000",
                                      }}
                                    />
                                    {getColourBasedOnhex(productDetails.mesh_color)}
                                  </div>
                                  )
                                </div>
                              </SelectItem>
                              <SelectItem value={"custom"}>Custom</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* CUSTOM COLOR OPTIONS */}
                    {watch[index]?.color === "custom" && (
                      <>
                        {/* MESH COLOR */}
                        <FormField
                          control={form.control}
                          name={`productDetails.${index}.mesh`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Mesh Color</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select Mesh Color" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value={productDetails.mesh_color}>
                                    <div className="flex gap-1">
                                      SAS (
                                      <div className="flex items-center">
                                        <p
                                          className="mx-1 h-4 w-4 rounded-full"
                                          style={{
                                            backgroundColor: productDetails.mesh_color,
                                            border: "1px solid #000",
                                          }}
                                        />
                                        {getColourBasedOnhex(productDetails.mesh_color)}
                                      </div>
                                      )
                                    </div>
                                  </SelectItem>
                                  {colors
                                    .filter((i: any) => i.hexcode !== productDetails.mesh_color)
                                    .map((colour: any) => (
                                      <SelectItem key={colour.id} value={getColourBasedOnId(colour.id)}>
                                        <div className="flex items-center">
                                          <div
                                            className="h-4 w-4 rounded-full"
                                            style={{
                                              backgroundColor: getColourBasedOnId(colour.id),
                                              border: "1px solid #000",
                                            }}
                                          />
                                          <span className="ml-2">{colour.name}</span>
                                        </div>
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* BEADING COLOR */}
                        <FormField
                          control={form.control}
                          name={`productDetails.${index}.beading`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Beading Color</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select Beading Color" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value={productDetails.beading_color}>
                                    <div className="flex gap-1">
                                      SAS (
                                      <div className="flex items-center">
                                        <p
                                          className="mx-1 h-4 w-4 rounded-full"
                                          style={{
                                            backgroundColor: productDetails.beading_color,
                                            border: "1px solid #000",
                                          }}
                                        />
                                        {getColourBasedOnhex(productDetails.beading_color)}
                                      </div>
                                      )
                                    </div>
                                  </SelectItem>
                                  {colors
                                    .filter((i: any) => i.hexcode !== productDetails.beading_color)
                                    .map((colour: any) => (
                                      <SelectItem key={colour.id} value={getColourBasedOnId(colour.id)}>
                                        <div className="flex items-center">
                                          <div
                                            className="h-4 w-4 rounded-full"
                                            style={{
                                              backgroundColor: getColourBasedOnId(colour.id),
                                              border: "1px solid #000",
                                            }}
                                          />
                                          <span className="ml-2">{colour.name}</span>
                                        </div>
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* ADD LINING CHECKBOX */}
                        <div className={`flex ${watch[index]?.addLining ? "items-end" : "items-center"}`}>
                          <FormField
                            control={form.control}
                            name={`productDetails.${index}.addLining`}
                            render={({ field }) => (
                              <FormItem className="flex h-fit items-center gap-2 rounded-md border px-2">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value ?? false}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                <p className="text-xs">
                                  Would You Like To Add Lining To This Product?
                                </p>
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* LINING OPTIONS */}
                        {watch[index]?.addLining && (
                          <>
                            <FormField
                              control={form.control}
                              name={`productDetails.${index}.lining`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Lining</FormLabel>
                                  <Select
                                    onValueChange={(val) => {
                                      field.onChange(val);
                                      if (val === "No Lining") {
                                        form.setValue(`productDetails.${index}.liningColor`, "No Color");
                                      }
                                    }}
                                    defaultValue={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select Lining" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value={productDetails.lining}>
                                        SAS ({productDetails.lining})
                                      </SelectItem>
                                      {lining
                                        .filter((i) => i !== productDetails.lining)
                                        .map((item) => (
                                          <SelectItem key={item} value={item}>
                                            {item}
                                          </SelectItem>
                                        ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            {watch[index]?.lining !== "No Lining" && (
                              <FormField
                                control={form.control}
                                name={`productDetails.${index}.liningColor`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Lining Color</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select Lining Color" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value={productDetails.lining_color}>
                                          <div className="flex gap-1">
                                            SAS (
                                            <div className="flex items-center">
                                              <p
                                                className="mx-1 h-4 w-4 rounded-full"
                                                style={{
                                                  backgroundColor: productDetails.lining_color,
                                                  border: "1px solid #000",
                                                }}
                                              />
                                              {getColourBasedOnhex(productDetails.lining_color)}
                                            </div>
                                            )
                                          </div>
                                        </SelectItem>
                                        {colors
                                          .filter((i: any) => i.hexcode !== productDetails.lining_color)
                                          .map((colour: any) => (
                                            <SelectItem key={colour.id} value={getColourBasedOnId(colour.id)}>
                                              <div className="flex items-center">
                                                <div
                                                  className="h-4 w-4 rounded-full"
                                                  style={{
                                                    backgroundColor: getColourBasedOnId(colour.id),
                                                    border: "1px solid #000",
                                                  }}
                                                />
                                                <span className="ml-2">{colour.name}</span>
                                              </div>
                                            </SelectItem>
                                          ))}
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            )}
                          </>
                        )}
                      </>
                    )}

                    {/* QUANTITY */}
                    <FormField
                      control={form.control}
                      name={`productDetails.${index}.Quantity`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantity</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="1" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* CUSTOMIZATION */}
                    <FormField
                      control={form.control}
                      name={`productDetails.${index}.customization`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Customization</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="customization"
                              className="resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* REFERENCE IMAGES */}
                    <FormField
                      control={form.control}
                      name={`productDetails.${index}.files`}
                      render={({ field: { value, onChange, ...field } }) => (
                        <FormItem>
                          <FormLabel>Reference Images</FormLabel>
                          <FormControl>
                            <Input
                              type="file"
                              multiple
                              onChange={(e) => {
                                const files = e.target.files;
                                if (files) onChange(Array.from(files));
                              }}
                              accept="image/*"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="mt-2 flex gap-4">
                    {fields.length < 20 && (
                      <Button onClick={addColorQuantity} type="button">
                        Add
                      </Button>
                    )}
                    {index > 0 && (
                      <Button
                        variant={"destructive"}
                        type="button"
                        onClick={() => remove(index)}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              ))}

              <Button type="submit" className="w-full" disabled={addToCartLoading}>
                {addToCartLoading ? "Submitting..." : "Submit"}
              </Button>
            </form>
          </Form>

          <SheetFooter>
            <SheetClose asChild />
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* COLOR CHART DIALOG */}
      <Dialog open={colorChatDialog} onOpenChange={setColorChartDialog}>
        <DialogContent className="w-full min-w-[70%]">
          <DialogHeader>
            <DialogTitle>Color Chart</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-center">
            {lastUpdated && (
              <div className="flex items-center justify-center gap-4 mt-[-10px] mb-10">
                <span className="h-[1px] bg-gray-300 flex-1 max-w-[120px] mb-1" />
                <span className="text-2xl font-extrabold text-gray-800 tracking-wide">
                  {new Date(lastUpdated).getFullYear()}
                </span>
                <span className="h-[1px] bg-gray-300 flex-1 max-w-[120px]" />
              </div>
            )}
            <div className="rounded-xl overflow-hidden shadow-lg border border-gray-200">
              <CustomizedImage
                src={colorChart}
                alt="Color Chart"
                unoptimized
                className="w-full max-h-[80vh] object-contain bg-white"
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ActionButtons;