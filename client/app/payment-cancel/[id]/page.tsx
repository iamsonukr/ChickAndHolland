export default async function PaymentCancelPage({ params }: any) {
  const { id } = await params;  // ✅ FIXED
  const orderId = id;

  return (
    <div className="min-h-screen flex items-center justify-center p-10">
      <div>
        <h1 className="text-3xl font-bold text-red-600">Payment Cancelled</h1>

        <div className="mt-4 bg-gray-100 p-3 rounded-lg">
          <p className="text-sm text-gray-500">Order Reference</p>
          <p className="font-semibold">{orderId}</p>
        </div>

        <a href="/retailer-panel/my-orders" className="block mt-6">
          <button className="bg-black text-white px-4 py-2 rounded-lg">
            Back to My Orders
          </button>
        </a>
      </div>
    </div>
  );
}
