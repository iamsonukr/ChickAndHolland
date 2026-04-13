import AdminLoaderScreen from "@/components/custom/admin-panel/AdminLoaderScreen";

const AdminWorkspaceLoading = () => {
  return (
    <AdminLoaderScreen
      className="min-h-[70vh]"
      title="Loading admin workspace"
      description="Fetching the latest admin data, reports, and management tools."
    />
  );
};

export default AdminWorkspaceLoading;
