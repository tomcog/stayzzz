import { useState, useEffect, useRef } from 'react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Search, MapPin, Loader2 } from 'lucide-react';
import { initGooglePlaces, searchPlaces, getPlaceDetails, PlaceResult } from '../utils/googlePlaces';
import { cn } from './ui/utils';

interface ProviderAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelectPlace?: (place: PlaceResult) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
}

export function ProviderAutocomplete({
  value,
  onChange,
  onSelectPlace,
  label = 'Name of provider',
  placeholder = 'Start typing to search...',
  required = false,
}: ProviderAutocompleteProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isApiReady, setIsApiReady] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    initGooglePlaces()
      .then(() => setIsApiReady(true))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!isApiReady || value.length < 2) {
      setSuggestions([]);
      return;
    }

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    searchTimeoutRef.current = setTimeout(() => {
      setIsLoading(true);
      searchPlaces(value)
        .then((predictions) => {
          setSuggestions(predictions);
          setShowSuggestions(true);
          setSelectedIndex(-1);
        })
        .catch(() => setSuggestions([]))
        .finally(() => setIsLoading(false));
    }, 300);

    return () => { if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current); };
  }, [value, isApiReady]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current && !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSelectSuggestion = async (prediction: any) => {
    setIsLoading(true);
    try {
      const placeDetails = await getPlaceDetails(prediction.place_id);
      onChange(placeDetails.name);
      if (onSelectPlace) onSelectPlace(placeDetails);
      setShowSuggestions(false);
      setSuggestions([]);
    } catch {
      onChange(prediction.description);
      setShowSuggestions(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); setSelectedIndex(prev => Math.min(prev + 1, suggestions.length - 1)); break;
      case 'ArrowUp': e.preventDefault(); setSelectedIndex(prev => Math.max(prev - 1, -1)); break;
      case 'Enter': e.preventDefault(); if (selectedIndex >= 0) handleSelectSuggestion(suggestions[selectedIndex]); break;
      case 'Escape': setShowSuggestions(false); break;
    }
  };

  return (
    <div className="relative">
      <Label htmlFor="provider-autocomplete">
        {label} {required && '*'}
      </Label>
      <div className="relative">
        <Input
          ref={inputRef}
          id="provider-autocomplete"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
          placeholder={placeholder}
          className="pr-10"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {isLoading ? <Loader2 className="w-4 h-4 text-gray-400 animate-spin" /> : <Search className="w-4 h-4 text-gray-400" />}
        </div>
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div ref={suggestionsRef} className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
          {suggestions.map((prediction, index) => (
            <button
              key={prediction.place_id}
              type="button"
              onClick={() => handleSelectSuggestion(prediction)}
              className={cn('w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0', selectedIndex === index && 'bg-gray-50')}
            >
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">{prediction.structured_formatting.main_text}</div>
                  <div className="text-sm text-gray-500 truncate">{prediction.structured_formatting.secondary_text}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {showSuggestions && !isLoading && value.length >= 2 && suggestions.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-gray-500 text-sm">
          No providers found. You can still enter the name manually.
        </div>
      )}
    </div>
  );
}
