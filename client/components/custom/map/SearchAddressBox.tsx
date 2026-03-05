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
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="space-y-4">
      <div className={`relative transition-all duration-300 ${isFocused ? 'scale-105' : 'scale-100'}`}>
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyPress={handleKeyPress}
          className="w-full rounded-xl border-2 border-gray-200 pl-10 pr-4 py-4 focus:border-gray-500 focus:ring-2 focus:ring-gray-200 transition-all duration-300 bg-white/80 backdrop-blur-sm"
          placeholder="Search store, city, country, postal code..."
        />
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
          <MapPin className="h-5 w-5 text-gray-400" />
        </div>
      </div>

      <Button 
        className="w-full py-3 rounded-xl bg-gradient-to-r from-gray-600 to-black-600 hover:from-black-700 hover:to-gray-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
        onClick={handleSearch}
      >
        <Search className="w-4 h-4 mr-2" />
        Search Locations
      </Button>
    </div>
  );
}