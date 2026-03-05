import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { API_URL } from "@/lib/constants";

export async function PUT(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  // token is stored in cookie (same as in lib/data.ts)
  const token = (await cookies()).get("token")?.value || "";

  const backendRes = await fetch(
    `${API_URL}/retailer-orders/qr-scan-update/${params.id}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await backendRes.json();

  return NextResponse.json(data, { status: backendRes.status });
}
