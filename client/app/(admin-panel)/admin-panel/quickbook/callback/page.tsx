import { getQuickbookAccessToken } from "@/lib/data";
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

  // if (accessToken.success) {
  redirect("/admin-panel/quickbook");
  // }


  return (
    <>
      Access Token: {JSON.stringify(accessToken)}
    </>
  );
};

export default QuickbookCallBack;