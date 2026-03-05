"use client";

import { useState } from "react";
import SearchAddressBox from "@/components/custom/map/SearchAddressBox";
import AllMaps from "@/components/custom/map/AllMaps";

export default function FindAStoreClient({ clientsData }) {
  const [searchLocation, setSearchLocation] = useState(null);
  const [filteredStores, setFilteredStores] = useState(
    clientsData.mapClients
  );

  const getDistanceInKm = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) => {
  const R = 6371; // Earth radius (km)
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

  const [selectedStore, setSelectedStore] = useState(null);
const handlePincodeSearch = async (pincode: string) => {
  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${pincode}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
    );

    const data = await res.json();
    if (!data.results?.length) return;

    const location = data.results[0].geometry.location;
    setSearchLocation(location);

    const nearby = clientsData.mapClients
      .map((store) => {
        const distance = getDistanceInKm(
          location.lat,
          location.lng,
          Number(store.latitude),
          Number(store.longitude)
        );

        return {
          ...store,
          distance: Number(distance.toFixed(1)), // ⭐ add distance
        };
      })
      .filter((s) => s.distance <= 100) // 100 KM radius
      .sort((a, b) => a.distance - b.distance); // nearest first

    setFilteredStores(nearby);

    if (nearby.length) setSelectedStore(nearby[0]);
  } catch (err) {
    console.error("Pincode search failed", err);
  }
};


  const handleFilter = async (text: string) => {
  if (!text) {
    setFilteredStores(clientsData.mapClients);
    setSelectedStore(null);
    return;
  }

  // ✅ check if pincode
  const isPincode = /^\d{6}$/.test(text.trim());

  if (isPincode) {
    handlePincodeSearch(text);
    return;
  }

  // 🔹 normal text search
  const t = text.toLowerCase();
  const results = clientsData.mapClients.filter((s) =>
    `${s.name} ${s.address} ${s.city_name} ${s.country}`
      .toLowerCase()
      .includes(t)
  );

  setFilteredStores(results);
};


  const handleStoreSelect = (store) => {
    setSelectedStore(store);
    setSearchLocation({
      lat: parseFloat(store.latitude),
      lng: parseFloat(store.longitude),
    });
  };

  return (
    <div className="w-full bg-gradient-to-br from-slate-50 to-gray-50 min-h-screen mt-5">

      {/* HEADER */}
      <div className="pt-3 pb-3 text-center bg-white shadow-sm">
        <h1 className="text-3xl sm:text-4xl font-bold font-adornstoryserif text-black">
          OUR RETAILERS
        </h1>
      </div>

      {/* MAIN WRAPPER */}
      <div
        className="
          mt-6
          grid
          grid-cols-1
          lg:grid-cols-[380px_1fr]
          h-auto
          lg:min-h-[700px]
          max-w-8xl
          mx-auto
          rounded-2xl
          overflow-hidden
          shadow-xl
          border
          border-gray-200
        "
      >
        {/* MAP (TOP ON MOBILE) */}
       <div
  className="
    order-1
    lg:order-2
    h-[320px]
    sm:h-[400px]
    lg:h-[700px]
    w-full
    relative
    bg-gray-100
  "
>
<div className="w-full h-full">

          <AllMaps
            storeLocations={filteredStores}
            isAdminPanel={false}
            searchLocation={searchLocation}
            selectedStore={selectedStore}
          />
          </div>

        </div>

        {/* LEFT PANEL */}
        <div className="order-2 lg:order-1 bg-white flex flex-col">

          {/* SEARCH */}
          <div className="p-4 border-b">
            <SearchAddressBox
              onLocationSelect={(coords) => setSearchLocation(coords)}
              onFilter={handleFilter}
            />
          </div>

          {/* COUNT */}
          <div className="px-4 py-2 text-sm font-medium text-gray-700 border-b">
            Found {filteredStores.length}{" "}
            {filteredStores.length === 1 ? "store" : "stores"}
          </div>


          {/* STORE LIST */}
          <div className="flex-1 lg:overflow-y-auto overflow-visible">
            <div className="p-4 space-y-3">
             {filteredStores.map((store, index) => (
  <div
    key={index}
    onClick={() => handleStoreSelect(store)}
    className={`
      p-3 sm:p-4
      rounded-xl
      border
      cursor-pointer
      transition
      ${
        selectedStore?.id === store.id
          ? "border-black bg-gray-50"
          : "border-gray-200"
      }
    `}
  >
    <h3 className="font-semibold text-base sm:text-lg">
      {store.name}
    </h3>

    <p className="text-sm text-gray-600 mt-1">
      {store.address}
    </p>

    <p className="text-sm text-gray-600">
      {store.city_name}, {store.country}
    </p>

    {/* ⭐ DISTANCE */}
    {store.distance !== undefined && (
      <p className="mt-2 text-sm font-medium text-blue-600">
        📍 {store.distance} km away
      </p>
    )}

    <button
      className="mt-2 text-sm font-medium text-black hover:underline"
      onClick={(e) => {
        e.stopPropagation();
        handleStoreSelect(store);
      }}
    >
      View on Map →
    </button>
  </div>
))}


              {filteredStores.length === 0 && (
                <div className="text-center py-10 text-gray-500">
                  No stores found
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
