// app/find-a-store/page.tsx (or wherever your page file is)

import type { Metadata } from "next";
import MapProvider from "@/components/custom/map-provider";
import { getClients } from "@/lib/data";
import FindAStoreClient from "./FindAStoreClient";

export const metadata: Metadata = {
  title: "Find a Store | Chic & Holland",
  description:
    "Locate your nearest Chic & Holland boutique or find where to purchase our designer couture collections.",
};

export default async function FindAStore() {
  const clients = await getClients({});

  return (
    <MapProvider>
      <FindAStoreClient clientsData={clients} />
    </MapProvider>
  );
}
