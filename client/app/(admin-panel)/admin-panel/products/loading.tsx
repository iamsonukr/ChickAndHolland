import AdminLoaderScreen from "@/components/custom/admin-panel/AdminLoaderScreen";

const ProductsLoading = () => {
  return (
    <AdminLoaderScreen
      className="min-h-[70vh]"
      title="Loading products"
      description="Fetching catalog data, collections, and product management controls."
    />
  );
};

export default ProductsLoading;
