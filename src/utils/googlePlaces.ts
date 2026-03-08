export const GOOGLE_API_KEY = 'AIzaSyDljWXxLD0ofXyh00bCYNtF1cW4YOXm48k';

export interface PlaceResult {
  placeId: string;
  name: string;
  formattedAddress: string;
  phoneNumber?: string;
  website?: string;
  businessStatus?: string;
}

let isInitialized = false;
let initPromise: Promise<void> | null = null;

export const initGooglePlaces = (): Promise<void> => {
  if (isInitialized) return Promise.resolve();
  if (initPromise) return initPromise;

  initPromise = new Promise((resolve, reject) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    if (w.google && w.google.maps && w.google.maps.places) {
      isInitialized = true;
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_API_KEY}&libraries=places&loading=async`;
    script.async = true;
    script.defer = true;
    script.onload = () => { isInitialized = true; resolve(); };
    script.onerror = () => reject(new Error('Failed to load Google Maps API'));
    document.head.appendChild(script);
  });

  return initPromise;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const searchPlaces = async (query: string): Promise<any[]> => {
  if (!query || query.length < 2) return [];
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const maps = (window as any).google?.maps;
    if (!maps) return [];
    const { AutocompleteSuggestion } = await maps.importLibrary('places');
    const { suggestions } = await AutocompleteSuggestion.fetchAutocompleteSuggestions({ input: query, types: ['establishment'] });
    return suggestions.map((s: { placePrediction: unknown }) => s.placePrediction);
  } catch {
    return [];
  }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getPlaceDetails = async (placeId: string): Promise<PlaceResult> => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const maps = (window as any).google?.maps;
  const { Place } = await maps.importLibrary('places');
  const place = new Place({ id: placeId });
  await place.fetchFields({ fields: ['displayName', 'formattedAddress', 'nationalPhoneNumber', 'websiteURI', 'businessStatus'] });
  return {
    placeId,
    name: place.displayName || '',
    formattedAddress: place.formattedAddress || '',
    phoneNumber: place.nationalPhoneNumber,
    website: place.websiteURI,
    businessStatus: place.businessStatus,
  };
};
