"use client";

import { useState } from "react";
import { executeSparql } from "@/lib/api";

export default function SparqlPage() {
  const [query, setQuery] = useState("SELECT * WHERE { ?s ?p ?o } LIMIT 10");
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleExecute = async () => {
    setLoading(true);
    setError("");
    setResults(null);
    try {
      const resp = await executeSparql(query);
      setResults(resp.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 lg:px-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">SPARQL Query Endpoint</h1>
      <p className="mb-4 text-sm text-gray-500">
        Execute SPARQL queries against the Exhibitium Knowledge Graph.
      </p>
      <div className="mb-4">
        <textarea
          className="w-full h-64 p-4 border border-gray-300 rounded-md font-mono text-sm bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          spellCheck={false}
        />
      </div>
      <div className="mb-8">
        <button
          onClick={handleExecute}
          disabled={loading}
          className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50 font-medium transition-colors"
        >
          {loading ? "Executing..." : "Execute Query"}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative mb-6">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {results && results.length > 0 && (
        <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 rounded-lg">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                {Object.keys(results[0]).map((header) => (
                  <th key={header} className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {results.map((row: any, i: number) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  {Object.values(row).map((val: any, j: number) => (
                    <td key={j} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {val?.value || val}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
       {results && results.length === 0 && (
          <p className="text-gray-500 italic">No results found.</p>
       )}
    </div>
  );
}
