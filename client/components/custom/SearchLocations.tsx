import React, { FormEvent, useCallback, useEffect, useState } from "react";
import { useMap, useMapsLibrary } from "@vis.gl/react-google-maps";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  onPlaceSelect: (place: google.maps.places.PlaceResult | null) => void;
  defaultValue?: string;
  placeholder?: string;
  label?: string;
}

// This is a custom built autocomplete component using the "Autocomplete Service" for predictions
// and the "Places Service" for place details
export const AutocompleteCustom = ({
  onPlaceSelect,
  defaultValue,
  placeholder,
  label,
}: Props) => {
  const map = useMap();
  const places = useMapsLibrary("places");

  // https://developers.google.com/maps/documentation/javascript/reference/places-autocomplete-service#AutocompleteSessionToken
  const [sessionToken, setSessionToken] =
    useState<google.maps.places.AutocompleteSessionToken>();

  // https://developers.google.com/maps/documentation/javascript/reference/places-autocomplete-service
  const [autocompleteService, setAutocompleteService] =
    useState<google.maps.places.AutocompleteService | null>(null);

  // https://developers.google.com/maps/documentation/javascript/reference/places-service
  const [placesService, setPlacesService] =
    useState<google.maps.places.PlacesService | null>(null);

  const [predictionResults, setPredictionResults] = useState<
    Array<google.maps.places.AutocompletePrediction>
  >([]);

  const [inputValue, setInputValue] = useState<string>(defaultValue ?? "");

  useEffect(() => {
    if (!places) return;

    try {
      const newAutocompleteService = new places.AutocompleteService();
      // Create a dummy div for PlacesService (required but not used)
      const dummyElement = document.createElement("div");
      const newPlacesService = new places.PlacesService(dummyElement);
      const newSessionToken = new places.AutocompleteSessionToken();

      setAutocompleteService(newAutocompleteService);
      setPlacesService(newPlacesService);
      setSessionToken(newSessionToken);
    } catch (error) {
      console.error("Error initializing services:", error);
    }

    return () => {
      setAutocompleteService(null);
      setPlacesService(null);
    };
  }, [places]);

  const fetchPredictions = useCallback(
    async (inputValue: string) => {
      if (!autocompleteService || !inputValue) {
        setPredictionResults([]);
        return;
      }

      const request = { input: inputValue, sessionToken };
      const response = await autocompleteService.getPlacePredictions(request);

      setPredictionResults(response.predictions);
    },
    [autocompleteService, sessionToken],
  );

  const onInputChange = useCallback(
    (event: FormEvent<HTMLInputElement>) => {
      const value = (event.target as HTMLInputElement)?.value;

      setInputValue(value);
      fetchPredictions(value);
    },
    [fetchPredictions],
  );

  const handleSuggestionClick = useCallback(
    (placeId: string) => {
      if (!places) return;

      const detailRequestOptions = {
        placeId,
        fields: ["geometry", "name", "formatted_address", "address_components"],
        sessionToken,
      };

      const detailsRequestCallback = (
        placeDetails: google.maps.places.PlaceResult | null,
      ) => {
        onPlaceSelect(placeDetails);
        setPredictionResults([]);
        setInputValue(placeDetails?.formatted_address ?? "");
        setSessionToken(new places.AutocompleteSessionToken());
      };

      placesService?.getDetails(detailRequestOptions, detailsRequestCallback);
    },
    [onPlaceSelect, places, placesService, sessionToken],
  );

  // useEffect(() => {
  //   if (defaultValue) {
  //     setInputValue(defaultValue);
  //   }
  // }, [defaultValue]);

  return (
    <div className="space-y-2">
      <Label>{label ?? "Search for a place"}</Label>
      <Input
        value={inputValue}
        onInput={(event: FormEvent<HTMLInputElement>) => {
          onInputChange(event);
        }}
        placeholder={placeholder ?? "Search for a place"}
      />

      {predictionResults.length > 0 && (
        <ul className="custom-list w-full space-y-2 py-2">
          {predictionResults.map(({ place_id, description }) => {
            return (
              <li
                key={place_id}
                className="custom-list-item cursor-pointer rounded-md bg-secondary p-2 hover:bg-primary-foreground"
                onClick={() => handleSuggestionClick(place_id)}
              >
                {description}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
