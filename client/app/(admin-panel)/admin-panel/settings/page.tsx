import { ContentLayout } from "@/components/custom/admin-panel/contentLayout";
import ChangeResetPasswordForm from "./ChangeResetPasswordForm";

const AdminSettingsPage = () => {
  return (
    <ContentLayout title="Settings">
      <div className="flex flex-col gap-5">
        <h1 className="text-lg font-semibold md:text-xl">Settings</h1>
        <ChangeResetPasswordForm />
      </div>
    </ContentLayout>
  );
};

export default AdminSettingsPage;
