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

export async function prepareSelectedOrderPdfs(
  orders: PdfOrderSelection[],
  apiUrl: string,
  token: string,
  signal: AbortSignal,
  generatePdf = async (
    order: PdfOrderSelection,
    apiUrl: string,
    token: string,
    signal: AbortSignal,
  ): Promise<File> => {
    const { generateSelectedOrderPdf } =
      await import("@/app/(admin-panel)/admin-panel/orders/generateSelectedOrderPdf");
    return generateSelectedOrderPdf(order, apiUrl, token, signal);
  },
): Promise<File[]> {
  if (!orders.length) throw new Error("Select at least one order.");
  const files: File[] = [];
  // Generate sequentially: the PDF renderer and image conversion share resources.
  for (const order of orders) {
    signal.throwIfAborted();
    const label = `${order.orderType} order #${order.id}`;
    try {
      const file = await generatePdf(order, apiUrl, token, signal);
      signal.throwIfAborted();
      const document = await PDFDocument.load(await file.arrayBuffer());
      if (!document.getPageCount()) throw new Error("Empty PDF");
      files.push(file);
    } catch (error) {
      signal.throwIfAborted();
      throw new Error(
        `Could not generate the PDF for ${label}: ${error instanceof Error ? error.message : "Please retry."}`,
      );
    }
  }
  signal.throwIfAborted();
  return files;
}

export async function shareSelectedOrderPdfs(
  files: File[],
): Promise<"shared" | "cancelled" | "downloaded"> {
  if (!files.length) throw new Error("Select at least one order.");
  const data = { files };
  if (navigator.share && navigator.canShare?.(data)) {
    try {
      // Called before any await so the share menu retains the user's click activation.
      await navigator.share(data);
      return "shared";
    } catch (error) {
      if ((error as DOMException)?.name === "AbortError") return "cancelled";
      throw new Error(
        "Sharing could not open. Please retry or use Download PDFs.",
      );
    }
  }
  downloadSelectedOrderPdfs(files);
  return "downloaded";
}

export function downloadSelectedOrderPdfs(files: File[]) {
  for (const file of files) {
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }
}
