import { ContentLayout } from "@/components/custom/admin-panel/contentLayout";
import LoginButton from "@/app/(admin-panel)/admin-panel/quickbook/LoginButton";
import { getQuickbookStatus } from "@/lib/data";
import Link from "next/link";

const QuickBooks = async () => {
  const quickBookStatus = await getQuickbookStatus();


  return (
    <ContentLayout title={"Quickbooks"}>
      <div className="flex flex-col gap-8">
        {!quickBookStatus.connected ? (
          <LoginButton />
        ) : (
          <p className={"text-xl text-primary"}>
            You are logged in to quickbook, you can import customers <Link
            href={"/admin-panel/customers"} className={"text-blue-400"}>here</Link>
          </p>
        )}
      </div>
    </ContentLayout>
  );
};

export default QuickBooks;