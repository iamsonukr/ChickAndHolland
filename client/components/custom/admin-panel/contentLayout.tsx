import { Navbar } from "@/components/custom/admin-panel/navbar";
import { cookies } from "next/headers";

interface ContentLayoutProps {
  title: string;
  children: React.ReactNode;
}

export async function ContentLayout({ title, children }: ContentLayoutProps) {
  const userType = (await cookies()).get("userType")?.value;
  const rolePermissions = (await cookies()).get("rolePermissions")?.value;

  const userDetails = {
    userType,
    rolePermissions
  };

  return (
    <div className="min-w-0">
      <Navbar title={title} userDetails={userDetails} />
      <div className="min-w-0 pb-8 pt-3 sm:pt-4">{children}</div>
    </div>
  );
}
