export default async function PaymentSuccessPage({ params }: any) {
  const { id } = await params; // ✅ FIXED
  const orderId = id;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100 p-4">
      <div className="w-full max-w-md shadow-xl bg-white p-6 rounded-xl">
        <h1 className="text-2xl font-bold mb-4">Payment Successful</h1>

        <p>Your order has been approved automatically.</p>

        <div className="mt-4 bg-gray-100 p-3 rounded-lg">
          <p className="text-sm text-gray-500">Order Reference</p>
          <p className="font-semibold">{orderId}</p>
        </div>

        <div className="flex gap-3 mt-6">
          <a href="/retailer-panel/my-orders" className="w-full">
            <button className="w-full bg-black text-white p-3 rounded-lg">
              Go to My Orders
            </button>
          </a>

          <a href="/retailer-panel/dashboard" className="w-full">
            <button className="w-full border p-3 rounded-lg">
              Go to Dashboard
            </button>
          </a>
        </div>

        <p className="text-xs text-gray-500 mt-4">
          A confirmation email has been sent to your email.
        </p>
      </div>
    </div>
  );
}
