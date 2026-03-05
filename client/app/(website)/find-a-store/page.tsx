// app/find-a-store/page.tsx (or wherever your page file is)

import MapProvider from "@/components/custom/map-provider";
import { getClients } from "@/lib/data";
import FindAStoreClient from "./FindAStoreClient";

export default async function FindAStore() {
  const clients = await getClients({});

  return (
    <MapProvider>
      <FindAStoreClient clientsData={clients} />
    </MapProvider>
  );
}
