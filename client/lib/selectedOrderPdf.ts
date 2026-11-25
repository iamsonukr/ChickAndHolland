import { PDFDocument } from "pdf-lib";

export type PdfOrderSelection = {
  id: number;
  orderType: string;
  orderSource?: string;
};

export const selectedOrderPdfSource = (order: PdfOrderSelection) =>
  order.orderSource === "retailer" ||
  (!order.orderSource && ["Fresh", "Stock"].includes(order.orderType))
    ? "retailer"
    : "order";

export async function prepareSelectedOrderPdf(
  orders: PdfOrderSelection[],
  apiUrl: string,
  token: string,
  signal: AbortSignal,
  generatePdf = async (
    order: PdfOrderSelection,
    apiUrl: string,
    token: string,
    signal: AbortSignal,
  ): Promise<ArrayBuffer> => {
    const { generateSelectedOrderPdf } =
      await import("@/app/(admin-panel)/admin-panel/orders/generateSelectedOrderPdf");
    return generateSelectedOrderPdf(order, apiUrl, token, signal);
  },
): Promise<File> {
  if (!orders.length) throw new Error("Select at least one order.");
  const merged = orders.length > 1 ? await PDFDocument.create() : null;
  let singleBytes: ArrayBuffer | undefined;
  // Generate sequentially: the PDF renderer and image conversion share resources.
  for (const order of orders) {
    signal.throwIfAborted();
    const label = `${order.orderType} order #${order.id}`;
    let bytes: ArrayBuffer;
    try {
      bytes = await generatePdf(order, apiUrl, token, signal);
    } catch (error) {
      signal.throwIfAborted();
      throw new Error(
        `Could not generate the PDF for ${label}: ${error instanceof Error ? error.message : "Please retry."}`,
      );
    }
    try {
      const document = await PDFDocument.load(bytes);
      if (!document.getPageCount()) throw new Error("Empty PDF");
      if (merged) {
        const pages = await merged.copyPages(
          document,
          document.getPageIndices(),
        );
        pages.forEach((page) => merged.addPage(page));
      } else {
        singleBytes = bytes;
      }
    } catch {
      throw new Error(
        `The PDF for ${label} could not be combined. Please retry.`,
      );
    }
  }
  signal.throwIfAborted();
  const content = merged
    ? new Uint8Array(await merged.save()).buffer
    : singleBytes!;
  return new File(
    [content],
    orders.length === 1
      ? `order-${selectedOrderPdfSource(orders[0])}-${orders[0].id}.pdf`
      : `selected-orders-${orders.length}.pdf`,
    { type: "application/pdf" },
  );
}

export async function shareSelectedOrderPdf(
  file: File,
): Promise<"shared" | "cancelled" | "downloaded"> {
  const data = { files: [file] };
  if (navigator.share && navigator.canShare?.(data)) {
    try {
      // Called before any await so the share menu retains the user's click activation.
      await navigator.share(data);
      return "shared";
    } catch (error) {
      if ((error as DOMException)?.name === "AbortError") return "cancelled";
      throw new Error(
        "Sharing could not open. Please retry or use Download PDF.",
      );
    }
  }
  downloadSelectedOrderPdf(file);
  return "downloaded";
}

export function downloadSelectedOrderPdf(file: File) {
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = file.name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
