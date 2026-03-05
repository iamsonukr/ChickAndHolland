"use client";

import React, { useRef, useEffect, useState } from "react";

export default function TableScrollWrapper({ children }: { children: React.ReactNode }) {
  const topRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [contentWidth, setContentWidth] = useState(0);

  useEffect(() => {
    if (bottomRef.current) {
      const table = bottomRef.current.querySelector("table");
      if (table) setContentWidth(table.scrollWidth);
    }
  }, [children]);

  const handleTopScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (bottomRef.current) {
      bottomRef.current.scrollLeft = (e.target as HTMLDivElement).scrollLeft;
    }
  };

  const handleBottomScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (topRef.current) {
      topRef.current.scrollLeft = (e.target as HTMLDivElement).scrollLeft;
    }
  };

  return (
    <div className="w-full">

      {/* ----- TOP SCROLLBAR ----- */}
      <div className="pointer-events-none overflow-hidden h-4 mb-1">
        <div
          ref={topRef}
          className="pointer-events-auto overflow-x-auto h-4"
          onScroll={handleTopScroll}
        >
          <div style={{ width: contentWidth }} className="h-1"></div>
        </div>
      </div>

      {/* ----- TABLE + BOTTOM SCROLLBAR ----- */}
      <div
        ref={bottomRef}
        onScroll={handleBottomScroll}
        className="overflow-x-auto"
      >
        {children}
      </div>

    </div>
  );
}
