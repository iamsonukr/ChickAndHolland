"use client";
import React from "react";

const orderStatusSteps = [
  "Pattern",
  "Khaka",
  "Issue Beading",
  "Beading",
  "Zarkan",
  "Stitching",
  "Balance Pending",
  "Ready to Delivery",
  "Shipped",
];

export default function StatusTimeline({
  status,
}: {
  status: string;
}) {
  const currentStepIndex = orderStatusSteps.indexOf(status);

  return (
    <div className="flex flex-col gap-4 my-6">
      <h2 className="text-lg font-semibold">Order Status Progress</h2>

      <div className="flex flex-col border-l-4 border-gray-300 pl-4 gap-4">
        {orderStatusSteps.map((step, index) => {
          const isCompleted = index <= currentStepIndex;
          return (
            <div key={index} className="relative">
              <div
                className={`w-3 h-3 rounded-full absolute -left-[22px] top-1 ${
                  isCompleted ? "bg-green-600" : "bg-gray-400"
                }`}
              ></div>
              <p
                className={`${
                  isCompleted ? "text-green-700 font-semibold" : "text-gray-500"
                }`}
              >
                {step}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
