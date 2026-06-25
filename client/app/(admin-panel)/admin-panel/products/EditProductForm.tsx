"use client";

import { memo, useEffect } from "react";
import { Loader2, RefreshCw, Edit } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/custom/button";

// import {
//   EditProductFormProps,
//   LINING_OPTIONS,
//   useEditProductSheet,
// } from "./types-hooks";
// import { CurrencyPricingSection , ColourSelectField} from "./edit-product-subcomponents";
import { EditProductFormProps ,LINING_OPTIONS, useEditProductSheet} from "@/components/custom/edit-product/types-hooks";
import { CurrencyPricingSection,ColourSelectField } from "@/components/custom/edit-product/edit-product-subcomponents";
// import {
//   ColourSelectField,
//   CurrencyPricingSection,
// } from "./edit-product-subcomponents";

// ---------------------------------------------------------------------------
// EditProductForm
// ---------------------------------------------------------------------------

const EditProductForm = ({
  categories,
  subCategories,
  currencies,
  data,
}: EditProductFormProps) => {
  const {
    open,
    handleOpenChange,
    colours,
    coloursLoading,
    coloursError,
    loadColoursAndInitialize,
    form,
    fields,
    append,
    remove,
    onSubmit,
    loading,
    showLoading,
    watchedCategoryId,
    watchedLining,
    availableCurrencies,
    currencyMap,
    currencyComboboxOpen,
    toggleCombobox,
  } = useEditProductSheet(data, currencies);

  const filteredSubCategories = subCategories.filter(
    (s) => s.category?.id && Number(watchedCategoryId) === s.category.id,
  );


  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button>
          <Edit />
        </Button>
      </SheetTrigger>

      <SheetContent className="min-w-[100%] overflow-y-auto md:min-w-[50%] lg:min-w-[35%]">
        {/* Header */}
        <SheetHeader className="pr-6">
          <div className="flex items-start justify-between">
            <div>
              <SheetTitle>Edit Product</SheetTitle>
              <SheetDescription>
                Fill in the form below to edit product
              </SheetDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={loadColoursAndInitialize}
              disabled={coloursLoading}
              title="Reload colours and reset form"
              className="ml-4 shrink-0"
            >
              {coloursLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span className="ml-1.5 text-xs">
                {coloursLoading ? "Loading…" : "Reload"}
              </span>
            </Button>
          </div>
        </SheetHeader>

        {/* Error banner */}
        {coloursError && (
          <div className="mt-3 rounded-md border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm text-destructive">
            Colours failed to load.{" "}
            <button
              type="button"
              className="font-medium underline underline-offset-2"
              onClick={loadColoursAndInitialize}
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading overlay */}
        {showLoading && (
          <div className="mt-4 flex items-center justify-center rounded-md border bg-muted/20 p-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">
              Loading product data...
            </span>
          </div>
        )}

        <Form {...form}>
          <form
            className="mt-6 space-y-4"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            {/* Product Code */}
            <FormField
              control={form.control}
              name="productCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Code</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="SD880059"
                      {...field}
                      disabled={showLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Default Price */}
            <FormField
              control={form.control}
              name="productPrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Default Product Price (Euro)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="1000"
                      {...field}
                      disabled={showLoading}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Currency Pricing */}
            <CurrencyPricingSection
              fields={fields}
              control={form.control}
              currencyMap={currencyMap}
              availableCurrencies={availableCurrencies}
              currencyComboboxOpen={currencyComboboxOpen}
              toggleCombobox={toggleCombobox}
              append={append}
              remove={remove}
              showLoading={showLoading}
            />

            {/* Category */}
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select
                    onValueChange={(v) => {
                      field.onChange(v);
                      form.setValue("subCategoryId", "");
                    }}
                    value={field.value}
                    disabled={showLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select the category of this product" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem
                          key={category.id}
                          value={category.id.toString()}
                        >
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Sub-category */}
            {watchedCategoryId && (
              <FormField
                control={form.control}
                name="subCategoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Collection</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={showLoading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select the collection of this product" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {filteredSubCategories.map((col) => (
                          <SelectItem key={col.id} value={col.id.toString()}>
                            {col.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Colour fields */}
            <FormField
              control={form.control}
              name="mesh"
              render={({ field }) => (
                <ColourSelectField
                  label="Mesh Color"
                  placeholder="Select Mesh Color"
                  colours={colours}
                  value={field.value}
                  onChange={field.onChange}
                  disabled={showLoading}
                />
              )}
            />

            <FormField
              control={form.control}
              name="beading"
              render={({ field }) => (
                <ColourSelectField
                  label="Beading Color"
                  placeholder="Select Beading Color"
                  colours={colours}
                  value={field.value}
                  onChange={field.onChange}
                  disabled={showLoading}
                />
              )}
            />

            <FormField
              control={form.control}
              name="beader"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Beader</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter beader name"
                      {...field}
                      disabled={showLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Lining */}
            <FormField
              control={form.control}
              name="lining"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lining</FormLabel>
                  <Select
                    onValueChange={(v) => {
                      field.onChange(v);
                      if (v === "No Lining")
                        form.setValue("liningColor", "No Color");
                    }}
                    value={field.value}
                    disabled={showLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Lining" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {LINING_OPTIONS.map((item) => (
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

            {/* Lining Colour */}
            {watchedLining && watchedLining !== "No Lining" && (
              <FormField
                control={form.control}
                name="liningColor"
                render={({ field }) => (
                  <ColourSelectField
                    label="Lining Color"
                    placeholder="Select Lining Color"
                    colours={colours}
                    value={field.value}
                    onChange={field.onChange}
                    disabled={showLoading}
                  />
                )}
              />
            )}

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Product Description"
                      className="resize-none"
                      disabled={showLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="mt-4 w-full"
              disabled={loading || showLoading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating…
                </>
              ) : (
                "Update Product"
              )}
            </Button>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
};

export default memo(EditProductForm);
