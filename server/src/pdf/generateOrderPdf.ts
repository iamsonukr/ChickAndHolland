import { renderToBuffer } from "@react-pdf/renderer";
import FreshOrderPdf from "./FreshOrderPdf";
import { assertPdfPieceDetails } from "../lib/orderPdfValidation";

export async function generateOrderPdf(orderData: any): Promise<Buffer> {
  assertPdfPieceDetails(orderData?.details);
  // 👇 FreshOrderPdf already returns <Document />
  const document = FreshOrderPdf({ orderData });

  return await renderToBuffer(document as any);
}
