"use client";

import { InfoWindow, Map, Marker, useMap } from "@vis.gl/react-google-maps";
import { useEffect, useMemo, useState, useCallback } from "react";

interface StoreLocation {
  id?: string;
  latitude: string;
  longitude: string;
  name: string;
  city_name?: string;
  address?: string;
  phone?: string;
}

const AllMaps = ({
  storeLocations,
  isAdminPanel = false,
  searchLocation,
  selectedStore,
}: {
  storeLocations: StoreLocation[];
  isAdminPanel?: boolean;
  searchLocation?: { lat: number; lng: number };
  selectedStore?: StoreLocation | null;
}) => {
  const [hoveredMarkerId, setHoveredMarkerId] = useState<number | null>(null);
  const [activeMarker, setActiveMarker] = useState<number | null>(null);
  const [showInfoWindow, setShowInfoWindow] = useState<number | null>(null);
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false);

  const center = useMemo(() => {
    if (searchLocation) return searchLocation;
    if (!storeLocations.length) return { lat: 0, lng: 0 };
    
    const totalLat = storeLocations.reduce((acc, s) => acc + Number(s.latitude), 0);
    const totalLng = storeLocations.reduce((acc, s) => acc + Number(s.longitude), 0);
    return { 
      lat: totalLat / storeLocations.length, 
      lng: totalLng / storeLocations.length 
    };
  }, [storeLocations, searchLocation]);

  const map = useMap();

  // Check if Google Maps is loaded
  useEffect(() => {
    const checkGoogleMaps = () => {
      if (typeof window !== 'undefined' && window.google && window.google.maps) {
        setIsGoogleMapsLoaded(true);
      }
    };

    checkGoogleMaps();
    
    // If not loaded immediately, check again after a short delay
    const timer = setTimeout(checkGoogleMaps, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // Enhanced map movement with smooth transitions
  useEffect(() => {
    if (searchLocation && map && isGoogleMapsLoaded) {
      setTimeout(() => {
        map.setCenter(searchLocation);
        map.setZoom(14);
      }, 300);
    }
  }, [searchLocation, map, isGoogleMapsLoaded]);

  // Handle selected store from list
  useEffect(() => {
    if (selectedStore && map && isGoogleMapsLoaded) {
      const storeIndex = storeLocations.findIndex(
        store => store.id === selectedStore.id || 
        (store.latitude === selectedStore.latitude && store.longitude === selectedStore.longitude)
      );
      
      if (storeIndex !== -1) {
        setActiveMarker(storeIndex);
        setShowInfoWindow(storeIndex);
        setTimeout(() => {
          map.setCenter({
            lat: Number(selectedStore.latitude),
            lng: Number(selectedStore.longitude)
          });
          map.setZoom(15);
        }, 400);
      }
    }
  }, [selectedStore, map, storeLocations, isGoogleMapsLoaded]);

  const handleMarkerClick = useCallback((index: number) => {
    setActiveMarker(index);
    setShowInfoWindow(index);
    setHoveredMarkerId(null);
  }, []);

  const handleMarkerHover = useCallback((index: number | null) => {
    setHoveredMarkerId(index);
    // Only show info window on hover if no active marker is selected
    if (index !== null && activeMarker === null) {
      setShowInfoWindow(index);
    }
  }, [activeMarker]);

  const handleCloseInfoWindow = useCallback(() => {
    setShowInfoWindow(null);
    setActiveMarker(null);
    setHoveredMarkerId(null);
  }, []);

  // Custom SVG marker icons - Simplified version without Google Maps objects
  const getMarkerIcon = (index: number) => {
    if (!isGoogleMapsLoaded) return null;

    const isActive = activeMarker === index;
    const isHovered = hoveredMarkerId === index;
    
    let fillColor = '#DC2626'; // Default red
    let scale = 1;
    
    if (isActive) {
      fillColor = '#2563EB'; // Blue for active
      scale = 1.3;
    } else if (isHovered) {
      fillColor = '#EF4444'; // Lighter red for hover
      scale = 1.15;
    }

    // SVG for location pin
    const pinSvg = `
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2Z" 
              fill="${fillColor}" 
              stroke="white" 
              stroke-width="1.5"/>
        <circle cx="12" cy="9" r="3" fill="white"/>
      </svg>
    `;

    try {
      return {
        url: `data:image/svg+xml;base64,${btoa(pinSvg)}`,
        scaledSize: new window.google.maps.Size(40 * scale, 40 * scale),
        anchor: new window.google.maps.Point(20 * scale, 40 * scale),
      };
    } catch (error) {
      console.warn('Google Maps not available for marker creation');
      return null;
    }
  };

  // Simple marker using path (more reliable)
  const getSimpleMarkerIcon = (index: number) => {
    if (!isGoogleMapsLoaded) return null;

    const isActive = activeMarker === index;
    const isHovered = hoveredMarkerId === index;
    
    let fillColor = '#DC2626'; // Red
    let scale = 1;
    
    if (isActive) {
      fillColor = '#2563EB'; // Blue
      scale = 1.4;
    } else if (isHovered) {
      fillColor = '#EF4444'; // Light red
      scale = 1.2;
    }

    try {
      return {
        path: window.google.maps.SymbolPath.CIRCLE,
        fillColor: fillColor,
        fillOpacity: 1,
        strokeColor: '#FFFFFF',
        strokeWeight: 2,
        scale: 8 * scale,
        anchor: null,
      };
    } catch (error) {
      console.warn('Google Maps not available for simple marker');
      return null;
    }
  };

  const handleMapLoad = useCallback(() => {
    setIsGoogleMapsLoaded(true);
  }, []);

  // Get animation safely
  const getMarkerAnimation = (index: number) => {
    if (!isGoogleMapsLoaded) return undefined;
    return activeMarker === index ? window.google.maps.Animation.BOUNCE : undefined;
  };

  // Get search location marker icon safely
  const getSearchLocationIcon = () => {
    if (!isGoogleMapsLoaded) return null;
    return {
      path: window.google.maps.SymbolPath.CIRCLE,
      fillColor: '#10B981',
      fillOpacity: 0.8,
      strokeColor: '#FFFFFF',
      strokeWeight: 3,
      scale: 10,
    };
  };

  if (!isGoogleMapsLoaded) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <Map
      className="h-full w-full"
      defaultCenter={center}
      defaultZoom={2}
      gestureHandling="greedy"
      disableDefaultUI={false}
      onLoad={handleMapLoad}
      styles={[
        {
          featureType: "poi.business",
          stylers: [{ visibility: "off" }]
        },
        {
          featureType: "transit",
          elementType: "labels.icon",
          stylers: [{ visibility: "off" }]
        },
        {
          featureType: "poi",
          elementType: "labels.text",
          stylers: [{ visibility: "on" }]
        }
      ]}
    >
      {storeLocations.map((sl, index) => {
        const markerIcon = getMarkerIcon(index) || getSimpleMarkerIcon(index);
        
        return (
          <div key={index}>
            <Marker
              position={{ lat: Number(sl.latitude), lng: Number(sl.longitude) }}
              onMouseOver={() => handleMarkerHover(index)}
              onMouseOut={() => handleMarkerHover(null)}
              onClick={() => handleMarkerClick(index)}
              icon={markerIcon || undefined}
              animation={getMarkerAnimation(index)}
            />

            {showInfoWindow === index && (
              <InfoWindow
                position={{ 
                  lat: Number(sl.latitude) + 0.002,
                  lng: Number(sl.longitude) 
                }}
                onCloseClick={handleCloseInfoWindow}
              >
                <div className="max-w-xs p-4 bg-white rounded-xl shadow-2xl border border-gray-200 relative">
                  {/* Pointer arrow */}
                  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-white border-t border-l border-gray-200 rotate-45"></div>
                  
                  <h3 className="font-bold text-gray-900 text-lg mb-3 border-b pb-2">
                    {sl.name}
                  </h3>
                  
                  <div className="space-y-2">
                    {sl.city_name && (
                      <div className="flex items-start">
                        <span className="text-gray-700 text-sm">{sl.city_name}</span>
                      </div>
                    )}
                    
                    {sl.address && (
                      <div className="flex items-start">
                        <span className="text-gray-700 text-sm">{sl.address}</span>
                      </div>
                    )}
                    
                    {sl.phone && (
                      <div className="flex items-start">
                        <span className="text-gray-700 text-sm">{sl.phone}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
                    <button 
                      className="text-blue-600 text-sm font-medium hover:text-blue-800 transition-colors px-3 py-1 rounded-lg hover:bg-blue-50"
                      onClick={() => {
                        const url = `https://www.google.com/maps/dir/?api=1&destination=${sl.latitude},${sl.longitude}`;
                        window.open(url, '_blank');
                      }}
                    >
                      Get Directions
                    </button>
                    <button 
                      className="text-gray-500 text-sm font-medium hover:text-gray-700 transition-colors px-3 py-1 rounded-lg hover:bg-gray-50"
                      onClick={handleCloseInfoWindow}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </InfoWindow>
            )}
          </div>
        );
      })}
      
      {/* Search Location Marker (different style) */}
      {searchLocation && isGoogleMapsLoaded && (
        <Marker
          position={searchLocation}
          icon={getSearchLocationIcon() || undefined}
          animation={window.google.maps.Animation.BOUNCE}
        />
      )}
    </Map>
  );
};
export default AllMaps;