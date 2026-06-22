"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";

interface AddressAutocompleteProps {
  value: string;
  onChange: (address: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  required?: boolean;
  id?: string;
}

/** Normalized prediction shape used by the dropdown, regardless of API. */
type Suggestion = {
  id: string;
  main: string;
  secondary: string;
  description: string;
  /** Resolve the full formatted address (new API uses Place.fetchFields). */
  resolve: () => Promise<string>;
};

// We talk to Google through `any` because the project may resolve either the
// new Places API (AutocompleteSuggestion) or the legacy one at runtime.
/* eslint-disable @typescript-eslint/no-explicit-any */

let mapsBootstrapped = false;

/**
 * Install Google's official inline bootstrap loader once. This defines
 * `google.maps.importLibrary` synchronously (the actual SDK is fetched
 * lazily on the first importLibrary call), which is far more reliable than
 * a manual <script> tag whose onload can fire before importLibrary exists.
 * See: https://developers.google.com/maps/documentation/javascript/load-maps-js-api
 */
function loadMaps(apiKey: string): void {
  const w = window as any;
  if (mapsBootstrapped || w.google?.maps?.importLibrary) {
    mapsBootstrapped = true;
    return;
  }
  mapsBootstrapped = true;

  ((g: any) => {
    let h: any,
      a: any,
      k: any,
      p = "The Google Maps JavaScript API",
      c = "google",
      l = "importLibrary",
      q = "__ib__",
      m = document,
      b: any = window;
    b = b[c] || (b[c] = {});
    const d = b.maps || (b.maps = {}),
      r = new Set<string>(),
      e = new URLSearchParams(),
      u = () =>
        h ||
        (h = new Promise<void>((f, n) => {
          a = m.createElement("script");
          e.set("libraries", [...r] + "");
          for (k in g)
            e.set(
              k.replace(/[A-Z]/g, (t: string) => "_" + t[0].toLowerCase()),
              g[k],
            );
          e.set("callback", c + ".maps." + q);
          a.src = `https://maps.${c}apis.com/maps/api/js?` + e;
          d[q] = f;
          a.onerror = () => (h = n(Error(p + " could not load.")));
          a.nonce = (m.querySelector("script[nonce]") as any)?.nonce || "";
          m.head.append(a);
        }));
    d[l]
      ? console.warn(p + " only loads once. Ignoring:", g)
      : (d[l] = (f: string, ...n: any[]) =>
          r.add(f) && u().then(() => d[l](f, ...n)));
  })({ key: apiKey, v: "weekly" });
}

export function AddressAutocomplete({
  value,
  onChange,
  placeholder = "Enter address",
  label,
  error,
  required,
  id,
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [predictions, setPredictions] = useState<Suggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  // Tracks readiness for re-render after the Maps library loads.
  const [, setApiReady] = useState(false);
  const [apiError, setApiError] = useState("");

  const placesRef = useRef<any>(null); // the imported "places" library
  const sessionTokenRef = useRef<any>(null);
  const legacyServiceRef = useRef<any>(null); // fallback AutocompleteService
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const readyPromiseRef = useRef<Promise<void> | null>(null);

  // ── Load the Maps SDK + Places library on first use (deferred so the
  //    page isn't blocked, and the API key is only used when needed).
  //    Returns a memoized promise so callers can await readiness. ──
  function ensureLoaded(): Promise<void> {
    if (readyPromiseRef.current) return readyPromiseRef.current;

    readyPromiseRef.current = (async () => {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        setApiError("Address lookup unavailable — Maps key not configured.");
        throw new Error("Maps key not configured");
      }
      loadMaps(apiKey);
      const google = (window as any).google;
      placesRef.current = await google.maps.importLibrary("places");
      const places = placesRef.current;
      if (places?.AutocompleteSessionToken) {
        sessionTokenRef.current = new places.AutocompleteSessionToken();
      }
      if (!places?.AutocompleteSuggestion && places?.AutocompleteService) {
        legacyServiceRef.current = new places.AutocompleteService();
      }
      setApiReady(true);
      setApiError("");
    })();

    // If loading fails, allow a later retry.
    readyPromiseRef.current.catch(() => {
      readyPromiseRef.current = null;
    });

    return readyPromiseRef.current;
  }

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  // ── Fetch suggestions (new API first, legacy fallback) ─────────────
  async function fetchSuggestions(input: string): Promise<Suggestion[]> {
    const places = placesRef.current;
    if (!places) return [];

    // New API: AutocompleteSuggestion.fetchAutocompleteSuggestions
    if (places.AutocompleteSuggestion) {
      const { suggestions } =
        await places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input,
          includedRegionCodes: ["us"],
          sessionToken: sessionTokenRef.current,
        });
      return (suggestions ?? [])
        .filter((s: any) => s.placePrediction)
        .map((s: any): Suggestion => {
          const p = s.placePrediction;
          return {
            id: p.placeId,
            main: p.mainText?.text ?? p.text?.text ?? "",
            secondary: p.secondaryText?.text ?? "",
            description: p.text?.text ?? "",
            resolve: async () => {
              try {
                const place = p.toPlace();
                await place.fetchFields({ fields: ["formattedAddress"] });
                return place.formattedAddress ?? p.text?.text ?? "";
              } catch {
                return p.text?.text ?? "";
              }
            },
          };
        });
    }

    // Legacy fallback: AutocompleteService.getPlacePredictions
    if (legacyServiceRef.current) {
      return new Promise<Suggestion[]>((resolve) => {
        legacyServiceRef.current.getPlacePredictions(
          { input, componentRestrictions: { country: ["us"] } },
          (preds: any[] | null, status: string) => {
            if (status !== "OK" || !preds) {
              if (status && status !== "ZERO_RESULTS") {
                setApiError(`Address lookup error (${status}).`);
              }
              resolve([]);
              return;
            }
            resolve(
              preds.map((p): Suggestion => ({
                id: p.place_id,
                main: p.structured_formatting?.main_text ?? p.description,
                secondary: p.structured_formatting?.secondary_text ?? "",
                description: p.description,
                resolve: async () => p.description,
              })),
            );
          },
        );
      });
    }

    return [];
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const inputValue = e.target.value;
    onChange(inputValue);

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    if (!inputValue.trim()) {
      setPredictions([]);
      setIsOpen(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    debounceTimerRef.current = setTimeout(async () => {
      try {
        // Wait for the Maps library to finish loading, then look up.
        await ensureLoaded();
        const results = await fetchSuggestions(inputValue);
        setPredictions(results);
        setIsOpen(results.length > 0);
        if (results.length > 0) setApiError("");
      } catch (err) {
        console.error("Autocomplete error:", err);
        setApiError("Could not fetch address suggestions.");
        setPredictions([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);
  }

  async function handleSelect(s: Suggestion) {
    onChange(s.description);
    setPredictions([]);
    setIsOpen(false);
    const full = await s.resolve();
    if (full) onChange(full);
    // Start a fresh session for the next lookup (billing best practice).
    const places = placesRef.current;
    if (places?.AutocompleteSessionToken) {
      sessionTokenRef.current = new places.AutocompleteSessionToken();
    }
  }

  // Close dropdown on outside click.
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div>
      {label && (
        <label className="label" htmlFor={id}>
          {label}
          {required && <span className="text-red-500"> *</span>}
        </label>
      )}
      <div className="relative">
        <div className="relative flex items-center">
          <MapPin className="absolute left-3 h-5 w-5 text-slate-400" aria-hidden />
          <input
            ref={inputRef}
            id={id}
            type="text"
            value={value ?? ""}
            onChange={handleInputChange}
            onFocus={() => {
              void ensureLoaded();
              if ((value || "").trim() && predictions.length > 0) setIsOpen(true);
            }}
            placeholder={placeholder}
            autoComplete="off"
            className="field pl-10"
          />
          {isLoading && (
            <div className="absolute right-3 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          )}
        </div>

        {apiError && !isLoading && (
          <p className="mt-1 text-xs text-amber-600">{apiError}</p>
        )}

        {isOpen && predictions.length > 0 && (
          <div
            ref={dropdownRef}
            className="absolute left-0 right-0 top-full z-50 mt-2 max-h-64 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg"
          >
            {predictions.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelect(p)}
                className="flex w-full items-start gap-3 border-b border-slate-100 px-4 py-3 text-left last:border-0 hover:bg-slate-50 active:bg-slate-100"
              >
                <MapPin className="mt-1 h-4 w-4 flex-shrink-0 text-slate-400" aria-hidden />
                <div>
                  <p className="text-sm font-medium text-ink">{p.main}</p>
                  {p.secondary && (
                    <p className="text-xs text-slate-500">{p.secondary}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        {isOpen && value.trim() && predictions.length === 0 && !isLoading && (
          <div className="absolute left-0 right-0 top-full z-50 mt-2 rounded-lg border border-slate-200 bg-white p-4 text-center text-sm text-slate-500 shadow-lg">
            No addresses found
          </div>
        )}
      </div>

      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
