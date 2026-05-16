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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Calendar as CalendarIcon, Plus } from "lucide-react";
import { UseFormReturn, FieldArrayWithId } from "react-hook-form";
import dayjs from "dayjs";
import { cn } from "@/lib/utils";

import MultipleSelector, { Option } from "@/components/custom/multi-selector";
import { CreateOrderForm, ColorType, SizeCountry } from "@/lib/formSchemas";
import { UploadedFileType } from "@/hooks/useCreateOrder";
import StyleItem from "@/components/CreateOrder/StyleItem";
import { UploadOrderFile } from "@/components/CreateOrder/UploadOrderFile";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CreateOrderFormFieldsProps {
  form: UseFormReturn<CreateOrderForm>;
  fields: FieldArrayWithId<CreateOrderForm, "styles">[];
  fullComponentWatch: CreateOrderForm["styles"];
  colors: any[];
  colorTypeArray: { value: keyof typeof ColorType; label: string }[];
  sizeCountryArray: { value: keyof typeof SizeCountry; label: string }[];
  formattedCustomers: Option[];
  customOrderType: string;
  setCustomOrderType: (val: string) => void;
  orderTypeArrayState: { value: string; label: string }[];
  setOrderTypeArrayState: React.Dispatch<
    React.SetStateAction<{ value: string; label: string }[]>
  >;
  loading: boolean;
  previewLoading: boolean;
  submitLabel?: string;
  // upload
  uploadedFile: File | null;
  uploadedFileType: UploadedFileType;
  setUploadedFile: (file: File | null) => void;
  // actions
  onSubmit: (data: CreateOrderForm) => Promise<void>;
  onSaveDraft: (data: CreateOrderForm) => Promise<void>;
  onPreviewSubmit: (data: CreateOrderForm) => Promise<void>;
  onErrors: () => void;
  addStyle: () => void;
  onRemove: (index: number) => void;
  getColourBasedOnId: (id: number) => string | undefined;
  getColourBasedOnhex: (hex: string) => string | undefined;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CreateOrderFormFields({
  form,
  fields,
  fullComponentWatch,
  colors,
  colorTypeArray,
  sizeCountryArray,
  formattedCustomers,
  customOrderType,
  setCustomOrderType,
  orderTypeArrayState,
  setOrderTypeArrayState,
  loading,
  previewLoading,
  submitLabel = "Create Order",
  uploadedFile,
  uploadedFileType,
  setUploadedFile,
  onSubmit,
  onSaveDraft,
  onPreviewSubmit,
  onErrors,
  addStyle,
  onRemove,
  getColourBasedOnId,
  getColourBasedOnhex,
}: CreateOrderFormFieldsProps) {
  return (
    <Form {...form}>
      <form
        className="mt-8 grid grid-cols-1 gap-2 md:grid-cols-3"
        onSubmit={form.handleSubmit(onSubmit, onErrors)}
      >
        {/* ── Customer ── */}
        <FormField
          control={form.control}
          name="customerId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Customer</FormLabel>
              {/* @ts-ignore */}
              <MultipleSelector
                {...field}
                defaultOptions={formattedCustomers}
                placeholder="Select Customer"
                onSearch={async (value) =>
                  formattedCustomers.filter((c) =>
                    c.label.toLowerCase().includes(value.toLowerCase()),
                  )
                }
                loadingIndicator={<p className="text-muted-foreground">Loading...</p>}
                emptyIndicator={<p className="text-muted-foreground">No results found</p>}
                maxSelected={1}
              />
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ── Purchase Order No ── */}
        <FormField
          control={form.control}
          name="purchaseOrderNo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Purchase Order No</FormLabel>
              <FormControl>
                <Input placeholder="PO#CUSTOMER 1" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ── Manufacturing Email ── */}
        <FormField
          control={form.control}
          name="manufacturingEmailAddress"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Manufacturing Email</FormLabel>
              <FormControl>
                <Input placeholder="johndoe@email.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ── Order Type ── */}
        <FormField
          control={form.control}
          name="orderType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Order Type</FormLabel>
              <Select
                value={field.value}
                onValueChange={(value) => {
                  field.onChange(value);
                  if (value === "CUSTOM") setCustomOrderType("");
                }}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Order Type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {orderTypeArrayState.map((type) => (
                    <SelectItem value={type.value} key={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {field.value === "CUSTOM" && (
                <div className="mt-2 space-y-2">
                  <Input
                    placeholder="Enter custom order type"
                    value={customOrderType}
                    onChange={(e) => setCustomOrderType(e.target.value)}
                  />
                  <Button
                    type="button"
                    className="w-fit"
                    onClick={async () => {
                      const newValue = customOrderType.trim();
                      if (!newValue) return;
                      setOrderTypeArrayState((prev) => [
                        ...prev.filter((x) => x.value !== "CUSTOM"),
                        { value: newValue, label: newValue },
                        { value: "CUSTOM", label: "Custom" },
                      ]);
                      form.setValue("orderType", newValue, {
                        shouldValidate: true,
                        shouldDirty: true,
                        shouldTouch: true,
                      });
                      await form.trigger("orderType");
                    }}
                  >
                    Save
                  </Button>
                </div>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ── Order Received Date ── */}
        <FormField
          control={form.control}
          name="orderReceivedDate"
          render={({ field }) => (
            <FormItem className="flex flex-col gap-2.5">
              <FormLabel>Order Received Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className={cn(
                        "pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground",
                      )}
                    >
                      {field.value ? (
                        dayjs(field.value).format("DD MMMM YYYY")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ── Order Shipping Date ── */}
        <FormField
          control={form.control}
          name="orderCancellationDate"
          render={({ field }) => (
            <FormItem className="flex flex-col gap-2.5">
              <FormLabel>Order Shipping Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className={cn(
                        "pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground",
                      )}
                    >
                      {field.value ? (
                        dayjs(field.value).format("DD MMMM YYYY")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ── Address ── */}
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem className="md:col-span-3">
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Textarea placeholder="Amsterdam" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ── Styles list ── */}
        <div className="!mt-4 space-y-2 md:col-span-3">
          <div className="flex items-center justify-between">
            <Label>Styles</Label>
            <Button variant="secondary" onClick={addStyle} type="button">
              Add Style <Plus className="ml-1 h-4 w-4" />
            </Button>
          </div>

          {fullComponentWatch.map((_, index) => (
            <StyleItem
              key={fields[index]?.id ?? index}
              form={form}
              index={index}
              fieldId={fields[index]?.id ?? String(index)}
              colors={colors}
              colorTypeArray={colorTypeArray}
              sizeCountryArray={sizeCountryArray}
              fullComponentWatch={fullComponentWatch}
              canRemove={fields.length > 1}
              onRemove={onRemove}
              getColourBasedOnId={getColourBasedOnId}
              getColourBasedOnhex={getColourBasedOnhex}
            />
          ))}
        </div>

        {/* ── Upload section ── */}
        <div className="!mt-6 md:col-span-3">
          <Separator className="mb-5" />
          <div className="mb-2 flex items-center justify-between">
            <div>
              <Label>Upload order document</Label>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Optional — replaces the auto-generated PDF / PPT in the preview and on
                submit.
              </p>
            </div>
          </div>
          <UploadOrderFile
            uploadedFile={uploadedFile}
            uploadedFileType={uploadedFileType}
            onFileSelect={setUploadedFile}
          />
        </div>

        {/* ── Form action buttons ── */}
        <div className="mt-4 flex items-center gap-2 md:col-span-3">
          {/*
           * Hide "Preview Order" when the user has uploaded their own file —
           * there is nothing server-generated to preview; the shell shows the
           * upload instead.
           */}
          {!uploadedFile && (
            <Button
              type="button"
              className="flex-1"
              variant="outline"
              onClick={form.handleSubmit(onPreviewSubmit, onErrors)}
              disabled={previewLoading}
            >
              {previewLoading ? "Loading..." : "Preview Order"}
            </Button>
          )}
          <Button
            type="button"
            className="flex-1"
            variant="secondary"
            onClick={form.handleSubmit(onSaveDraft, onErrors)}
            disabled={loading}
          >
            {loading ? "Loading..." : "Save as Draft"}
          </Button>
          <Button
            type="submit"
            className={cn("flex-1", uploadedFile && "w-full")}
            disabled={loading}
          >
            {loading ? "Loading..." : submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
}
