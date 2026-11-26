import { ContentLayout } from "@/components/custom/admin-panel/contentLayout";
import { DateRangeForm } from "./DateRangeForm";
import { getDashboardData, getOrderStageCounts } from "@/lib/data";
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
  const validDate = (value: unknown): value is string => {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
      return false;
    const date = new Date(`${value}T00:00:00Z`);
    return (
      !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
    );
  };
  const from = validDate(params?.startDate)
    ? params.startDate
    : formatDateParam(startOfYear);
  const to = validDate(params?.endDate)
    ? params.endDate
    : formatDateParam(today);
  const [startDate, endDate] = from <= to ? [from, to] : [to, from];

  const [data, orderStageCounts] = await Promise.all([
    getDashboardData(startDate, endDate),
    getOrderStageCounts({ dateFrom: startDate, dateTo: endDate }),
  ]);
  const dashboardData = {
    ...data,
    total: {
      ...data.total,
      total_quantity: orderStageCounts?.allStatusCount ?? null,
    },
  };

  return (
    <ContentLayout title="Dashboard">
      <div className="space-y-6">
        <DateRangeForm startDateValue={startDate} endDateValue={endDate} />
        <DashboardCharts
          data={data.graphData}
          startDate={startDate}
          endDate={endDate}
        />

        {/* Send data to Client Component */}
        <DashboardClient data={dashboardData} />
      </div>
    </ContentLayout>
  );
};

export default Dashboard;
