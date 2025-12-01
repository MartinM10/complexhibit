"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

const types = [
  { value: "exhibition", label: "Exhibitions" },
  { value: "artwork", label: "Artworks" },
  { value: "institution", label: "Institutions" },
  { value: "actant", label: "Actors" },
];

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("exhibition");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/all/${type}?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Search the Collection
        </h1>
        <p className="mt-4 text-lg text-gray-600">
          Find exhibitions, artworks, people, and institutions.
        </p>
      </div>

      <form onSubmit={handleSearch} className="mt-8">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="sm:w-1/4">
            <label htmlFor="type" className="sr-only">Type</label>
            <select
              id="type"
              name="type"
              className="block w-full rounded-md border-0 py-3 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              {types.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div className="relative flex-grow">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              type="text"
              name="search"
              id="search"
              className="block w-full rounded-md border-0 py-3 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
              placeholder="Search terms..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="rounded-md bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Search
          </button>
        </div>
      </form>
    </div>
  );
}
