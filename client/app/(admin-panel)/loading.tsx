import AdminLoaderScreen from "@/components/custom/admin-panel/AdminLoaderScreen";

const Loader = () => {
  return (
    <AdminLoaderScreen
      className="min-h-dvh"
      title="Loading admin panel"
      description="Preparing your dashboard, live counts, and workspace tools."
    />
  );
};

export default Loader;
