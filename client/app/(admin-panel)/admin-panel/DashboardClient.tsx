"use client";

import { StatsDisplay } from "./StatsDisplay";

export default function DashboardClient({ data }: { data: any }) {
  return <StatsDisplay data={data} />;
}
