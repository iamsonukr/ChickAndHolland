"use client";

import { APIProvider } from "@vis.gl/react-google-maps";
import { GOOGLE_MAPS_API_KEY } from "@/lib/constants";

export default function MapProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>{children}</APIProvider>;
}
