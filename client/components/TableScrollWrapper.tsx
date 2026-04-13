"use client";

import React, { useRef, useEffect, useState } from "react";

export default function TableScrollWrapper({ children }: { children: React.ReactNode }) {
  const topRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [contentWidth, setContentWidth] = useState(0);

  useEffect(() => {
    const updateWidth = () => {
      if (!bottomRef.current) return;
      const table = bottomRef.current.querySelector("table");
      setContentWidth(table ? table.scrollWidth : 0);
    };

    updateWidth();

    const resizeObserver = new ResizeObserver(updateWidth);
    const table = bottomRef.current?.querySelector("table");

    if (bottomRef.current) resizeObserver.observe(bottomRef.current);
    if (table) resizeObserver.observe(table);

    window.addEventListener("resize", updateWidth);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateWidth);
    };
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
      <div className="pointer-events-none mb-1 hidden h-4 overflow-hidden sm:block">
        <div
          ref={topRef}
          className="pointer-events-auto h-4 overflow-x-auto"
          onScroll={handleTopScroll}
        >
          <div style={{ width: contentWidth }} className="h-1" />
        </div>
      </div>

      <div
        ref={bottomRef}
        onScroll={handleBottomScroll}
        className="w-full overflow-x-auto"
      >
        {children}
      </div>
    </div>
  );
}
