import { useState, useEffect } from "react";
import { Loader2, AlertTriangle, ExternalLink } from "lucide-react";
import { getFromType } from "@/lib/api";

interface DuplicateCheckInputProps {
  type: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  placeholder?: string;
  className?: string;
}

export function DuplicateCheckInput({
  type,
  name,
  value,
  onChange,
  required,
  placeholder,
  className,
}: DuplicateCheckInputProps) {
  const [matches, setMatches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [debouncedValue, setDebouncedValue] = useState(value);

  // Debounce input value
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, 500);

    return () => clearTimeout(timer);
  }, [value]);

  // Check for duplicates
  useEffect(() => {
    const checkDuplicates = async () => {
      if (!debouncedValue || debouncedValue.length < 3) {
        setMatches([]);
        return;
      }

      setIsLoading(true);
      try {
        // Map frontend entity type to API search type if necessary
        // The getFromType function handles mapping 'artwork' to '/all_artworks' etc.
        // We pass the query 'q' to filter results.
        const response = await getFromType(type, { q: debouncedValue });
        
        if (response && response.data) {
          let results = [];
          if (Array.isArray(response.data)) {
            results = response.data;
          } else {
            results = Object.values(response.data).flat();
          }

          // Filter to strict matches or high relevance if needed, 
          // but for now we just show what the search returns, limited to top 3.
          // We exclude the current item if we were editing (not applicable for insert).
          setMatches(results.slice(0, 3));
        } else {
            setMatches([]);
        }
      } catch (error) {
        console.error("Duplicate check failed:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkDuplicates();
  }, [debouncedValue, type]);


  const getDetailLink = (uri: string) => {
    try {
      if (!uri) return "#";
      // Expected format from backend: https://w3id.org/OntoExhibit#type/id
      const parts = uri.split("#");
      if (parts.length > 1) {
        // parts[1] should be "type/id", e.g. "person/123" or "exhibition/456"
        return `/detail/${parts[1]}`;
      }
      return `/detail?uri=${encodeURIComponent(uri)}`;
    } catch (e) {
      return "#";
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <input
          type="text"
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          placeholder={placeholder}
          className={`${className} ${matches.length > 0 ? "border-amber-400 focus:ring-amber-500 focus:border-amber-500" : ""}`}
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          </div>
        )}
      </div>

      {/* Warning Message */}
      {matches.length > 0 && (
        <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-md text-sm animate-in fade-in slide-in-from-top-1">
          <div className="flex items-start gap-2 text-amber-800 font-medium mb-2">
            <AlertTriangle className="h-4 w-4 mt-0.5" />
            <span>Possible duplicates found ({matches.length}):</span>
          </div>
          <ul className="space-y-1 ml-6">
            {matches.map((match: any, index: number) => (
              <li key={match.uri || index} className="text-amber-700 flex items-center gap-1">
                <span className="truncate max-w-[200px] inline-block" title={match.name || match.label}>
                  {match.name || match.label}
                </span>
                <a 
                  href={getDetailLink(match.uri)}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-amber-600 hover:text-amber-900 inline-flex items-center gap-0.5 text-xs underline"
                >
                  View <ExternalLink className="h-3 w-3" />
                </a>
              </li>
            ))}
          </ul>
          <p className="text-xs text-amber-600 mt-2 ml-6">
            If this is a new entity, you can ignore this warning.
          </p>
        </div>
      )}
    </div>
  );
}
