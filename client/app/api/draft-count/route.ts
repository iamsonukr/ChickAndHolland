import { NextResponse } from "next/server";
import { getOrders } from "@/lib/data";

export async function GET() {
  try {
    const res = await getOrders({ page: 1, publishStatus: "draft" });
    const count = res?.totalCount ?? res?.orders?.length ?? 0;
    return NextResponse.json({ count });
  } catch (error) {
    console.error("/api/draft-count error", error);
    return NextResponse.json({ count: 0 }, { status: 500 });
  }
}
