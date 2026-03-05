import { renderToBuffer } from "@react-pdf/renderer";
import FreshOrderPdf from "./FreshOrderPdf";

export async function generateOrderPdf(orderData: any): Promise<Buffer> {
  // 👇 FreshOrderPdf already returns <Document />
  const document = FreshOrderPdf({ orderData });

  return await renderToBuffer(document as any);
}
