"use client";

import React, { useEffect, useRef, useState } from "react";
import { useMapsLibrary } from "@vis.gl/react-google-maps";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  onPlaceSelect: (place: google.maps.places.PlaceResult | null) => void;
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  label?: string;
}

export const AutocompleteCustom = ({
  onPlaceSelect, value, onValueChange, defaultValue, placeholder, label,
}: Props) => {
  const places = useMapsLibrary("places");
  const sessionToken = useRef<google.maps.places.AutocompleteSessionToken>();
  const requestId = useRef(0);
  const [predictions, setPredictions] = useState<google.maps.places.PlacePrediction[]>([]);
  const [inputValue, setInputValue] = useState(defaultValue ?? "");
  const [error, setError] = useState("");
  const [searchInput, setSearchInput] = useState("");

  useEffect(() => {
    const currentRequest = ++requestId.current;
    if (!places || !searchInput.trim()) {
      setPredictions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        sessionToken.current ??= new places.AutocompleteSessionToken();
        const { suggestions } = await places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input: searchInput,
          sessionToken: sessionToken.current,
        });
        if (currentRequest !== requestId.current) return;
        setPredictions(suggestions.flatMap(({ placePrediction }) => placePrediction ? [placePrediction] : []));
        setError("");
      } catch (error) {
        if (currentRequest !== requestId.current) return;
        console.error("Google address search failed:", error);
        setPredictions([]);
        setError("Google address search is unavailable. You can enter the address manually.");
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      ++requestId.current;
    };
  }, [places, searchInput]);

  const selectPlace = async (prediction: google.maps.places.PlacePrediction) => {
    const currentRequest = ++requestId.current;
    setPredictions([]);
    try {
      const place = prediction.toPlace();
      await place.fetchFields({ fields: ["location", "displayName", "formattedAddress", "addressComponents"] });
      if (currentRequest !== requestId.current) return;
      const address = place.formattedAddress ?? prediction.text.toString();
      setInputValue(address);
      onValueChange?.(address);
      // Adapt new Places fields to the existing customer and locator form callbacks.
      onPlaceSelect({
        place_id: place.id,
        name: place.displayName ?? undefined,
        formatted_address: address,
        geometry: place.location ? { location: place.location } : undefined,
        address_components: place.addressComponents?.map((component) => ({
          long_name: component.longText ?? "",
          short_name: component.shortText ?? "",
          types: component.types,
        })),
      });
      setSearchInput("");
      setError("");
    } catch (error) {
      if (currentRequest !== requestId.current) return;
      console.error("Google address details failed:", error);
      setError("Could not load this address. Please try again.");
    } finally {
      sessionToken.current = undefined;
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label ?? "Search for a place"}</Label>
      <Input
        value={value ?? inputValue}
        onChange={(event) => {
          const nextValue = event.target.value;
          ++requestId.current;
          setPredictions([]);
          setInputValue(nextValue);
          onValueChange?.(nextValue);
          setSearchInput(nextValue);
          setError("");
        }}
        placeholder={placeholder ?? "Search for a place"}
      />
      {error && <p role="status" className="text-sm text-destructive">{error}</p>}
      {predictions.length > 0 && (
        <ul className="custom-list w-full space-y-2 py-2">
          {predictions.map((prediction) => (
            <li key={prediction.placeId}>
              <button
                type="button"
                className="custom-list-item w-full cursor-pointer rounded-md bg-secondary p-2 text-left hover:bg-primary-foreground"
                onClick={() => void selectPlace(prediction)}
              >
                {prediction.text.toString()}
              </button>
            </li>
          ))}
          <li className="text-right text-xs text-muted-foreground">Powered by Google</li>
        </ul>
      )}
    </div>
  );
};
