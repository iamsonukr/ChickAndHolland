import { getQuickbookAccessToken } from "@/lib/data";
import Link from "next/link";
import { redirect } from "next/navigation";

const QuickbookCallBack
  = async (
  props: {
    searchParams: Promise<Record<any, any>>
  }
) => {
  const searchParams = await props.searchParams;


  const accessToken = await getQuickbookAccessToken({
    searchParams
  });

  if (accessToken.success) {
    redirect("/admin-panel/quickbook");
  }


  return (
    <div className="mx-auto mt-10 max-w-2xl rounded border border-red-200 bg-red-50 p-6 text-red-800">
      <h1 className="text-lg font-semibold">QuickBooks connection failed</h1>
      <p className="mt-2 text-sm">
        {accessToken.message || "Unable to connect QuickBooks."}
      </p>
      {accessToken.redirectUri && (
        <div className="mt-4 rounded bg-white p-3 text-sm">
          <p className="font-medium">Redirect URI sent to QuickBooks</p>
          <code className="mt-1 block break-all text-xs">
            {accessToken.redirectUri}
          </code>
        </div>
      )}
      <Link
        href="/admin-panel/quickbook"
        className="mt-5 inline-flex rounded bg-red-700 px-4 py-2 text-sm font-medium text-white"
      >
        Back to QuickBooks
      </Link>
    </div>
  );
};

export default QuickbookCallBack;
