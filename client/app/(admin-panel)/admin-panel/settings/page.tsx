import { ContentLayout } from "@/components/custom/admin-panel/contentLayout";
import ChangeResetPasswordForm from "./ChangeResetPasswordForm";
import ChangeEditPasswordForm from "./ChangeEditPasswordForm";

const AdminSettingsPage = () => {
  return (
    <ContentLayout title="Settings">
      <div className="flex flex-col gap-5">
        <h1 className="text-lg font-semibold md:text-xl">Settings</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ChangeResetPasswordForm />
          <ChangeEditPasswordForm />
        </div>
      </div>
    </ContentLayout>
  );
};

export default AdminSettingsPage;
