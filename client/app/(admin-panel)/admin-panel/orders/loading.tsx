import AdminLoaderScreen from "@/components/custom/admin-panel/AdminLoaderScreen";

const OrdersLoading = () => {
  return (
    <AdminLoaderScreen
      className="min-h-[70vh]"
      title="Loading orders"
      description="Fetching the latest orders, customers, and order management tools."
    />
  );
};

export default OrdersLoading;
