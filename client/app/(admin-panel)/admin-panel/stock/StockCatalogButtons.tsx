"use client";

import React, { useEffect, useMemo, useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { Download, FileSpreadsheet, Loader2, Mail, Plus, Printer, X } from "lucide-react";
import * as XLSX from "xlsx-js-style";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { getApiUrl } from "@/lib/constants";
import { getCookie } from "@/lib/utils";
import StockCatalogPdf from "./StockCatalogPdf";

type StockCatalogButtonsProps = {
  colours: any[];
  query?: string;
  currencyId?: number;
};

type CatalogMode = "with-price" | "without-price";
type ExportMode = CatalogMode | "excel-with-price" | "excel-without-price";
type StockExportChoice =
  | "catalog-with-price"
  | "catalog-without-price"
  | "excel-with-price"
  | "excel-without-price";

type CustomerEmailOption = {
  id: number | string;
  email: string;
  name: string;
};

const stockExportOptions: {
  value: StockExportChoice;
  label: string;
  description: string;
}[] = [
  {
    value: "catalog-with-price",
    label: "Print Catalog with price",
    description: "Download or email the stock catalog PDF with prices.",
  },
  {
    value: "catalog-without-price",
    label: "Print catalog without price",
    description: "Download or email the stock catalog PDF without prices.",
  },
  {
    value: "excel-with-price",
    label: "Export Excel with price",
    description: "Download or email the stock Excel with prices.",
  },
  {
    value: "excel-without-price",
    label: "Export Excel without price",
    description: "Download or email the stock Excel without prices.",
  },
];

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isPdfFriendlyImage = (imageUrl: string) =>
  /\.(jpe?g|png)(?:$|\?)/i.test(imageUrl);

const getFirstImageUrl = (item: any) => {
  const stockImages = Array.isArray(item?.images) ? item.images : [];
  const productImages = Array.isArray(item?.product?.images)
    ? item.product.images
    : [];

  return (
    [...stockImages, ...productImages].find((image: any) => image?.name)?.name ||
    item?.image ||
    ""
  );
};

const convertImageForPdf = async (
  imageUrl: string,
  objectUrls: string[],
) => {
  if (!imageUrl || isPdfFriendlyImage(imageUrl)) return imageUrl;

  try {
    const response = await fetch(
      `${getApiUrl("image-to-jpeg")}?imageUrl=${encodeURIComponent(
        imageUrl,
      )}&convertToJpeg=true`,
    );

    if (!response.ok) return imageUrl;

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    objectUrls.push(objectUrl);

    return objectUrl;
  } catch {
    return imageUrl;
  }
};

const downloadBlob = (blob: Blob, fileName: string) => {
  const downloadUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = downloadUrl;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 3000);
};

const buildExcelFileName = (showPrice: boolean) => {
  return showPrice
    ? "Excel Stocklist - With Price.xlsx"
    : "Excel Stocklist - Without Price.xlsx";
};

const buildCatalogFileName = (showPrice: boolean) =>
  showPrice
    ? "Stocklist Catalogue - With Price.pdf"
    : "Stocklist Catalogue - Without Price.pdf";

const getColourName = (colours: any[] = [], colourValue?: string | null) => {
  if (!colourValue) return "-";
  return (
    colours.find((colour: any) => colour.hexcode === colourValue)?.name ||
    colourValue
  );
};

const getColourLabel = (
  colours: any[] = [],
  colourValue?: string | null,
  defaultColourValue?: string | null,
) => {
  const resolvedName = getColourName(colours, colourValue);

  if (
    colourValue &&
    defaultColourValue &&
    colourValue === defaultColourValue &&
    resolvedName !== "No Color"
  ) {
    return `SAS(${resolvedName})`;
  }

  return resolvedName;
};

const getLiningLabel = (item: any) => {
  const lining = item?.lining || "-";

  if (
    item?.product?.lining &&
    item.product.lining === item.lining &&
    lining !== "No Lining"
  ) {
    return `SAS(${lining})`;
  }

  return lining;
};

const formatPrice = (value: unknown, item: any) => {
  const price = Number(value);
  if (!Number.isFinite(price)) return "";

  const currency =
    item?.currencyCode ||
    (String(item?.currencySymbol ?? "").trim() || "EUR");

  return `${currency} ${price.toFixed(2)}`;
};

const getCellDisplayLength = (value: unknown) =>
  String(value ?? "")
    .replace(/\s+/g, " ")
    .trim().length;

const getColumnWidths = (worksheet: XLSX.WorkSheet, range: XLSX.Range) => {
  const widths = [];

  for (let column = range.s.c; column <= range.e.c; column += 1) {
    let longestValue = 0;

    for (let row = range.s.r; row <= range.e.r; row += 1) {
      const cell = worksheet[XLSX.utils.encode_cell({ r: row, c: column })];
      longestValue = Math.max(longestValue, getCellDisplayLength(cell?.v));
    }

    widths.push({ wch: Math.max(longestValue + 2, 10) });
  }

  return widths;
};

const styleWorksheet = (worksheet: XLSX.WorkSheet) => {
  const ref = worksheet["!ref"];
  if (!ref) return;

  const range = XLSX.utils.decode_range(ref);

  for (let column = range.s.c; column <= range.e.c; column += 1) {
    const cell = worksheet[XLSX.utils.encode_cell({ r: 0, c: column })];
    if (!cell) continue;

    cell.s = {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "1F2937" } },
      alignment: { horizontal: "center", vertical: "center" },
      border: {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
      },
    };
  }

  for (let row = 1; row <= range.e.r; row += 1) {
    for (let column = range.s.c; column <= range.e.c; column += 1) {
      const cell = worksheet[XLSX.utils.encode_cell({ r: row, c: column })];
      if (!cell) continue;

      cell.s = {
        fill: { fgColor: { rgb: row % 2 === 0 ? "F9FAFB" : "FFFFFF" } },
        alignment: { horizontal: "center", vertical: "center" },
        border: {
          top: { style: "thin" },
          bottom: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" },
        },
      };
    }
  }

  worksheet["!cols"] = getColumnWidths(worksheet, range);
  worksheet["!freeze"] = { xSplit: 0, ySplit: 1 };
};

const buildExcelRows = (
  stock: any[],
  colours: any[],
  showPrice: boolean,
) =>
  stock
    .filter((item: any) => item?.product)
    .map((item: any) => {
      const price = Number(item?.price ?? 0);
      const discountedPrice = Number(item?.discountedPrice ?? price);
      const hasDiscount =
        price > 0 && discountedPrice > 0 && discountedPrice < price;
      const baseRow = {
        "Stock ID": item?.id ?? "",
        "Style No":
          item?.product?.productCode ||
          item?.productCode ||
          item?.styleNo ||
          "",
        Quantity: item?.quantity ?? "",
        Size: `${item?.size ?? "-"} (${item?.size_country ?? "-"})`,
        Source: item?.sourceLocation || "-",
        Mesh: getColourLabel(
          colours,
          item?.mesh_color,
          item?.product?.mesh_color,
        ),
        Beading: getColourLabel(
          colours,
          item?.beading_color,
          item?.product?.beading_color,
        ),
        Lining: getLiningLabel(item),
        "Lining Color": getColourLabel(
          colours,
          item?.lining_color,
          item?.product?.lining_color,
        ),
      };

      if (!showPrice) return baseRow;

      return {
        ...baseRow,
        Price: formatPrice(item?.price, item),
        Discount: `${Number(item?.discount ?? 0)}%`,
        "Final Price": hasDiscount
          ? formatPrice(item?.discountedPrice, item)
          : formatPrice(item?.price, item),
      };
    });

const buildExcelWorkbook = (
  stock: any[],
  colours: any[],
  showPrice: boolean,
) => {
  const rows = buildExcelRows(stock, colours, showPrice);

  if (!rows.length) {
    throw new Error("No stock products found");
  }

  const worksheet = XLSX.utils.json_to_sheet(rows);
  styleWorksheet(worksheet);

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Stock");

  return workbook;
};

const toBase64 = (value: ArrayBuffer | Uint8Array) => {
  const bytes = value instanceof Uint8Array ? value : new Uint8Array(value);
  const chunkSize = 0x8000;
  let binary = "";

  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(
      ...bytes.subarray(index, index + chunkSize),
    );
  }

  return window.btoa(binary);
};

const getCustomerName = (customer: any) =>
  customer?.customerStoreName ||
  customer?.storeName ||
  customer?.name ||
  customer?.contactPerson ||
  "Customer";

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const StockCatalogButtons = ({
  colours,
  query = "",
  currencyId,
}: StockCatalogButtonsProps) => {
  const [loadingMode, setLoadingMode] = useState<ExportMode | null>(null);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [selectedExportChoice, setSelectedExportChoice] =
    useState<StockExportChoice>("catalog-with-price");
  const [customers, setCustomers] = useState<CustomerEmailOption[]>([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [sendingEmail, setSendingEmail] = useState(false);

  const selectedExportIsExcel = selectedExportChoice.startsWith("excel");
  const selectedExportShowPrice =
    selectedExportChoice === "catalog-with-price" ||
    selectedExportChoice === "excel-with-price";
  const selectedCatalogMode: CatalogMode =
    selectedExportChoice === "catalog-without-price"
      ? "without-price"
      : "with-price";

  useEffect(() => {
    if (
      !exportDialogOpen ||
      customers.length ||
      customersLoading
    ) {
      return;
    }

    const fetchCustomers = async () => {
      const token = getCookie("token") || localStorage.getItem("token");
      setCustomersLoading(true);

      try {
        const response = await fetch(getApiUrl("customers"), {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          cache: "no-store",
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message || data?.error || "Failed to load customers",
          );
        }

        const customerOptions = (data?.customers || [])
          .filter((customer: any) => emailPattern.test(customer?.email || ""))
          .map((customer: any) => ({
            id: customer?.id,
            email: normalizeEmail(customer.email),
            name: getCustomerName(customer),
          }));

        setCustomers(customerOptions);
      } catch (error: any) {
        toast.error("Failed to load customers", {
          description: error?.message || "Please try again",
        });
      } finally {
        setCustomersLoading(false);
      }
    };

    fetchCustomers();
  }, [
    customers.length,
    customersLoading,
    exportDialogOpen,
  ]);

  const filteredCustomers = useMemo(() => {
    const queryText = customerSearch.trim().toLowerCase();

    return customers
      .filter((customer) => !selectedEmails.includes(customer.email))
      .filter((customer) => {
        if (!queryText) return true;

        return (
          customer.email.includes(queryText) ||
          customer.name.toLowerCase().includes(queryText)
        );
      })
      .slice(0, 8);
  }, [customerSearch, customers, selectedEmails]);

  const fetchStockCatalog = async () => {
    const token = getCookie("token") || localStorage.getItem("token");
    const params = new URLSearchParams();
    if (query) params.set("query", query);
    if (currencyId) params.set("currencyId", String(currencyId));

    const response = await fetch(
      `${getApiUrl("stock")}${params.toString() ? `?${params.toString()}` : ""}`,
      {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        cache: "no-store",
      },
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.message || data?.error || "Failed to load stock");
    }

    return Array.isArray(data?.stock) ? data.stock : [];
  };

  const openExportDialog = () => {
    setCustomerSearch("");
    setSelectedEmails([]);
    setExportDialogOpen(true);
  };

  const addEmail = (email: string) => {
    const nextEmail = normalizeEmail(email);

    if (!emailPattern.test(nextEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setSelectedEmails((currentEmails) => {
      if (currentEmails.includes(nextEmail)) return currentEmails;
      return [...currentEmails, nextEmail];
    });
    setCustomerSearch("");
  };

  const removeEmail = (email: string) => {
    setSelectedEmails((currentEmails) =>
      currentEmails.filter((currentEmail) => currentEmail !== email),
    );
  };

  const getEmailRecipientsForSend = () => {
    const pendingEmail = normalizeEmail(customerSearch);
    const recipients = [...selectedEmails];

    if (emailPattern.test(pendingEmail) && !recipients.includes(pendingEmail)) {
      recipients.push(pendingEmail);
    }

    return recipients;
  };

  const buildCatalogPdfBlob = async (stock: any[], showPrice: boolean) => {
    const objectUrls: string[] = [];

    try {
      const preparedStock = await Promise.all(
        stock.map(async (item: any) => ({
          ...item,
          catalogImage: await convertImageForPdf(
            getFirstImageUrl(item),
            objectUrls,
          ),
        })),
      );

      return await pdf(
        <StockCatalogPdf
          stock={preparedStock}
          colours={colours}
          showPrice={showPrice}
        /> as any,
      ).toBlob();
    } finally {
      objectUrls.forEach((objectUrl) => URL.revokeObjectURL(objectUrl));
    }
  };

  const handleDownload = async (mode: CatalogMode) => {
    setLoadingMode(mode);

    try {
      const stock = await fetchStockCatalog();

      if (!stock.length) {
        toast.error("No stock products found");
        return;
      }

      const showPrice = mode === "with-price";
      const blob = await buildCatalogPdfBlob(stock, showPrice);

      downloadBlob(blob, buildCatalogFileName(showPrice));

      toast.success("Stock catalog downloaded");
    } catch (error: any) {
      toast.error("Failed to print stock catalog", {
        description: error?.message || "Please try again",
      });
    } finally {
      setLoadingMode(null);
    }
  };

  const handleExcelExport = async (showPrice: boolean) => {
    setLoadingMode(showPrice ? "excel-with-price" : "excel-without-price");

    try {
      const stock = await fetchStockCatalog();

      if (!stock.length) {
        toast.error("No stock products found");
        return;
      }

      const workbook = buildExcelWorkbook(stock, colours, showPrice);
      XLSX.writeFile(workbook, buildExcelFileName(showPrice));
      toast.success("Stock data exported successfully");
    } catch (error: any) {
      toast.error("Failed to export stock data", {
        description: error?.message || "Please try again",
      });
    } finally {
      setLoadingMode(null);
    }
  };

  const handleSendExportEmail = async () => {
    const recipientEmails = getEmailRecipientsForSend();

    if (!recipientEmails.length) {
      toast.error("Please select or enter at least one email");
      return;
    }

    setSendingEmail(true);
    setLoadingMode(
      selectedExportIsExcel
        ? selectedExportShowPrice
          ? "excel-with-price"
          : "excel-without-price"
        : selectedCatalogMode,
    );

    try {
      const token = getCookie("token") || localStorage.getItem("token");
      const stock = await fetchStockCatalog();

      if (!stock.length) {
        toast.error("No stock products found");
        return;
      }

      const fileName = selectedExportIsExcel
        ? buildExcelFileName(selectedExportShowPrice)
        : buildCatalogFileName(selectedExportShowPrice);
      let attachmentData: ArrayBuffer | Uint8Array;

      if (selectedExportIsExcel) {
        const workbook = buildExcelWorkbook(
          stock,
          colours,
          selectedExportShowPrice,
        );
        attachmentData = XLSX.write(workbook, {
          bookType: "xlsx",
          type: "array",
        }) as ArrayBuffer | Uint8Array;
      } else {
        const catalogBlob = await buildCatalogPdfBlob(
          stock,
          selectedExportShowPrice,
        );
        attachmentData = await catalogBlob.arrayBuffer();
      }

      const response = await fetch(getApiUrl("stock-export-email"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          recipients: recipientEmails,
          fileName,
          exportKind: selectedExportIsExcel ? "excel" : "catalog",
          showPrice: selectedExportShowPrice,
          attachmentBase64: toBase64(attachmentData),
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || data?.error || "Failed to send stock export email",
        );
      }

      toast.success(data?.message || "Stock export email sent successfully");
      setExportDialogOpen(false);
      setSelectedEmails([]);
      setCustomerSearch("");
    } catch (error: any) {
      toast.error("Failed to send stock export email", {
        description: error?.message || "Please try again",
      });
    } finally {
      setSendingEmail(false);
      setLoadingMode(null);
    }
  };

  const isLoading = Boolean(loadingMode);
  const currentExcelMode = selectedExportShowPrice
    ? "excel-with-price"
    : "excel-without-price";
  const currentExportMode = selectedExportIsExcel
    ? currentExcelMode
    : selectedCatalogMode;
  const canSendEmail =
    selectedEmails.length > 0 ||
    emailPattern.test(normalizeEmail(customerSearch));

  return (
    <>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Button
          type="button"
          variant="outline"
          onClick={openExportDialog}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          Export
        </Button>
      </div>

      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Export Stock</DialogTitle>
            <DialogDescription>
              Choose export type, then search customer email or enter a custom
              email address.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <span className="text-sm font-medium">Export type</span>
              <div className="grid gap-2 sm:grid-cols-2">
                {stockExportOptions.map((option) => {
                  const isSelected = selectedExportChoice === option.value;
                  const Icon = option.value.startsWith("excel")
                    ? FileSpreadsheet
                    : option.value === "catalog-with-price"
                      ? Printer
                      : Download;

                  return (
                    <label
                      key={option.value}
                      className={`flex cursor-pointer gap-3 rounded-md border p-3 text-sm transition-colors ${
                        isSelected
                          ? "border-primary bg-muted"
                          : "hover:bg-muted/60"
                      }`}
                    >
                      <input
                        type="radio"
                        name="stock-export-option"
                        value={option.value}
                        checked={isSelected}
                        onChange={() => setSelectedExportChoice(option.value)}
                        className="mt-1 h-4 w-4"
                      />
                      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="min-w-0">
                        <span className="block font-medium">
                          {option.label}
                        </span>
                        <span className="mt-1 block text-muted-foreground">
                          {option.description}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <label
                className="text-sm font-medium"
                htmlFor="stock-export-email"
              >
                Email recipients
              </label>
              <div className="flex gap-2">
                <Input
                  id="stock-export-email"
                  value={customerSearch}
                  onChange={(event) => setCustomerSearch(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addEmail(customerSearch);
                    }
                  }}
                  placeholder="Search customer or type email"
                  type="text"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => addEmail(customerSearch)}
                  disabled={!customerSearch.trim()}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add
                </Button>
              </div>

              <div className="max-h-52 overflow-y-auto rounded-md border">
                {customersLoading ? (
                  <div className="flex items-center gap-2 px-3 py-4 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading customers
                  </div>
                ) : filteredCustomers.length ? (
                  filteredCustomers.map((customer) => (
                    <button
                      key={`${customer.id}-${customer.email}`}
                      type="button"
                      className="flex w-full flex-col gap-1 border-b px-3 py-2 text-left text-sm last:border-b-0 hover:bg-muted"
                      onClick={() => addEmail(customer.email)}
                    >
                      <span className="font-medium">{customer.name}</span>
                      <span className="text-muted-foreground">
                        {customer.email}
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-4 text-sm text-muted-foreground">
                    No customer emails found
                  </div>
                )}
              </div>
            </div>

            {selectedEmails.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedEmails.map((email) => (
                  <span
                    key={email}
                    className="inline-flex max-w-full items-center gap-1 rounded-md border bg-muted px-2 py-1 text-sm"
                  >
                    <span className="truncate">{email}</span>
                    <button
                      type="button"
                      className="rounded-sm p-0.5 hover:bg-background"
                      onClick={() => removeEmail(email)}
                      aria-label={`Remove ${email}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:space-x-0">
            {selectedExportIsExcel ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => handleExcelExport(selectedExportShowPrice)}
                disabled={isLoading || sendingEmail}
              >
                {loadingMode === currentExcelMode && !sendingEmail ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                Download Excel
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={() => handleDownload(selectedCatalogMode)}
                disabled={isLoading || sendingEmail}
              >
                {loadingMode === selectedCatalogMode ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                Download Catalog
              </Button>
            )}
            <Button
              type="button"
              onClick={handleSendExportEmail}
              disabled={isLoading || sendingEmail || !canSendEmail}
            >
              {sendingEmail && loadingMode === currentExportMode ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Mail className="mr-2 h-4 w-4" />
              )}
              Send Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default StockCatalogButtons;
