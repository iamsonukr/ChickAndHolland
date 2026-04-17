"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Search, MapPin } from "lucide-react";

export default function SearchAddressBox({ onLocationSelect, onFilter }) {
  const [searchText, setSearchText] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const handleSearch = () => {
    onFilter(searchText);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        {/* Left search icon */}
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>

        <input
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyPress={handleKeyPress}
          className={`w-full rounded-xl border-2 pl-10 pr-10 py-4 transition-all duration-300 bg-white/80 backdrop-blur-sm
            ${isFocused
              ? "border-gray-500 ring-2 ring-gray-200 scale-[1.02]"
              : "border-gray-200 scale-100"
            }`}
          placeholder="Search store, city, country, postal code..."
        />

        {/* Right pin icon */}
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <MapPin className="h-5 w-5 text-gray-400" />
        </div>
      </div>

      <Button
        className="w-full py-3 rounded-xl bg-gradient-to-r from-gray-600 to-gray-900 hover:from-gray-700 hover:to-black text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
        onClick={handleSearch}
      >
        <Search className="w-4 h-4 mr-2" />
        Search Locations
      </Button>
    </div>
  );
}