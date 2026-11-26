"use client";

import * as React from "react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const chartConfig = {
  views: { label: "Orders" },
  order_count: {
    label: "Orders",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

export default function DashboardCharts({
  data,
  startDate,
  endDate,
}: {
  data: any;
  startDate?: string;
  endDate?: string;
}) {
  const [activeChart, setActiveChart] =
    React.useState<keyof typeof chartConfig>("order_count");

  // 🧮 Helper for human-friendly description
  const formattedRange = React.useMemo(() => {
    if (!startDate || !endDate) return "No date range selected";

    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T00:00:00`);
    const today = new Date();

    // Helper to compare just the date (ignore time)
    const isSameDay = (a: Date, b: Date) =>
      a.toDateString() === b.toDateString();

    const formatDate = (date: Date) =>
      date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });

    const diffDays =
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24) + 1;

    // 🔹 Match with common presets
    if (isSameDay(start, today) && isSameDay(end, today)) {
      return "for Today";
    }
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (isSameDay(start, yesterday) && isSameDay(end, yesterday)) {
      return "for Yesterday";
    }
    if (isSameDay(end, today) && diffDays === 7) return "for Last 7 Days";
    if (isSameDay(end, today) && diffDays === 14) return "for Last 14 Days";
    if (isSameDay(end, today) && diffDays === 30) return "for Last 30 Days";

    // This Month
    const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    if (isSameDay(start, firstOfMonth) && isSameDay(end, today)) {
      return "for This Month";
    }

    // This Year
    const firstOfYear = new Date(today.getFullYear(), 0, 1);
    if (isSameDay(start, firstOfYear) && isSameDay(end, today)) {
      return "for This Year";
    }

    // 🗓 Default custom range
    return `from ${formatDate(start)} – ${formatDate(end)}`;
  }, [startDate, endDate]);

  return (
    <Card>
      <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-4 py-4 sm:px-6 sm:py-6">
          <CardTitle>Total Orders</CardTitle>
          <CardDescription>
            Showing total orders {formattedRange}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[220px] w-full sm:h-[250px]"
        >
          <BarChart
            accessibilityLayer
            data={data}
            margin={{ left: 12, right: 12 }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="order_date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
              }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="w-[150px]"
                  nameKey="views"
                  labelFormatter={(value) =>
                    new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  }
                />
              }
            />
            <Bar dataKey={activeChart} fill={`var(--color-${activeChart})`} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
