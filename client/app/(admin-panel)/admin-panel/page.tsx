// import { ContentLayout } from "@/components/custom/admin-panel/contentLayout";
// import { DateRangeForm } from "./DateRangeForm";
// import { StatsDisplay } from "./StatsDisplay";
// import { getDashboardData } from "@/lib/data";
// import DashboardCharts from "@/app/(admin-panel)/admin-panel/DashboardCharts";

// const Dashboard = async ({
//   searchParams,
// }: {
//   searchParams?: Promise<{ startDate?: string; endDate?: string }>;
// }) => {
//   const params = await searchParams; // ⬅️ important

//   const startDate =
//     params?.startDate || new Date().toISOString().split("T")[0];
//   const endDate =
//     params?.endDate || new Date().toISOString().split("T")[0];

//   const data = await getDashboardData(startDate, endDate);

//   return (
//     <ContentLayout title="Dashboard">
//       <div className="space-y-6">
//         <DateRangeForm />
//         <DashboardCharts
//           data={data.graphData}
//           startDate={startDate}
//           endDate={endDate}
//         />
//         <StatsDisplay data={data} />
//       </div>
//     </ContentLayout>
//   );
// };
// export default Dashboard;
import { ContentLayout } from "@/components/custom/admin-panel/contentLayout";
import { DateRangeForm } from "./DateRangeForm";
import { getDashboardData } from "@/lib/data";
import DashboardCharts from "@/app/(admin-panel)/admin-panel/DashboardCharts";
import DashboardClient from "./DashboardClient";

const formatDateParam = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const Dashboard = async ({ searchParams }: any) => {
  const params = await searchParams;
  const today = new Date();
  const startOfYear = new Date(today.getFullYear(), 0, 1);
  const startDate = params?.startDate || formatDateParam(startOfYear);
  const endDate = params?.endDate || formatDateParam(today);

  const data = await getDashboardData(startDate, endDate);

  return (
    <ContentLayout title="Dashboard">
      <div className="space-y-6">
        <DateRangeForm />
        <DashboardCharts
          data={data.graphData}
          startDate={startDate}
          endDate={endDate}
        />

        {/* Send data to Client Component */}
        <DashboardClient data={data} />
      </div>
    </ContentLayout>
  );
};

export default Dashboard;
