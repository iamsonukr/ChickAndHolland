import { NextRequest, NextResponse } from "next/server";
import { createFreshOrderPpt } from "@/lib/ppt/createFreshOrderPpt";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const orderData = body.orderData;

    if (!orderData) {
      return NextResponse.json(
        { success: false, message: "orderData is required" },
        { status: 400 }
      );
    }

    const arrayBuffer = await createFreshOrderPpt(orderData);
    const nodeBuffer = Buffer.from(new Uint8Array(arrayBuffer));

    return new NextResponse(nodeBuffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "Content-Disposition": `attachment; filename="${orderData.purchaseOrderNo || "order"}.pptx"`,
      },
    });
  } catch (err: any) {
    console.error("PPT generation error:", err);
    return NextResponse.json(
      { success: false, message: err?.message || "Error generating PPT" },
      { status: 500 }
    );
  }
}
