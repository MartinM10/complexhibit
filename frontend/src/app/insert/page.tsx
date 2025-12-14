"use client";

/**
 * Insert Data page for authenticated users.
 * 
 * Allows users to add new entities to the knowledge graph.
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, PlusCircle, Loader2, AlertCircle, CheckCircle, Database } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { SearchableSelect } from "@/components/SearchableSelect";

type EntityType = "exhibition" | "artwork" | "actant" | "institution";

interface FormField {
  name: string;
  label: string;
  type: "text" | "date" | "textarea" | "select" | "searchable";
  required?: boolean;
  options?: string[];
  placeholder?: string;
  fetchOptions?: string;
  searchEntityType?: "artwork" | "actant" | "institution" | "exhibition";
  multiple?: boolean;
}

// Field names match backend models in domain.py
const entityFields: Record<EntityType, FormField[]> = {
  exhibition: [
    { name: "name", label: "Exhibition Name", type: "text", required: true, placeholder: "e.g., Impressionism in Paris" },
    { name: "fecha_inicio", label: "Opening Date", type: "date", required: true },
    { name: "fecha_fin", label: "Closing Date", type: "date", required: true },
    { name: "sede", label: "Venue", type: "text", placeholder: "e.g., Museum of Modern Art" },
    { name: "lugar_celebracion", label: "Location", type: "text", placeholder: "e.g., New York, USA" },
    { name: "tipo_exposicion", label: "Exhibition Type", type: "select", options: ["Permanent", "Temporary", "Travelling"] },
    { name: "comisario", label: "Curators", type: "searchable", searchEntityType: "actant", multiple: true, placeholder: "Search for curators..." },
    { name: "organiza", label: "Organizers", type: "searchable", searchEntityType: "actant", multiple: true, placeholder: "Search for organizers..." },
    { name: "exposicion_patrocinada_por", label: "Funders/Sponsors", type: "searchable", searchEntityType: "actant", multiple: true, placeholder: "Search for funders..." },
    { name: "exposicion_exhibe_artista", label: "Exhibitors (Artists)", type: "searchable", searchEntityType: "actant", multiple: true, placeholder: "Search for exhibiting artists..." },
    { name: "exposicion_exhibe_obra_de_arte", label: "Artworks Shown", type: "searchable", searchEntityType: "artwork", multiple: true, placeholder: "Search for artworks..." },
  ],
  artwork: [
    { name: "name", label: "Artwork Title", type: "text", required: true, placeholder: "e.g., Starry Night" },
    { name: "apelation", label: "Alternative Name", type: "text", placeholder: "Optional alternative name" },
    { name: "author_name", label: "Author/Artist Name", type: "text", placeholder: "e.g., Vincent van Gogh" },
    { name: "production_start_date", label: "Creation Date", type: "text", placeholder: "e.g., 1889 or 1889-06-01" },
    { name: "production_place", label: "Place of Creation", type: "text", placeholder: "e.g., Saint-Rémy-de-Provence, France" },
    { name: "type", label: "Artwork Type", type: "select", options: ["Painting", "Sculpture", "Installation", "Photography", "Drawing", "Print", "Mixed Media", "Other"] },
  ],
  actant: [
    { name: "name", label: "Full Name", type: "text", required: true, placeholder: "e.g., Pablo Picasso" },
    { name: "type", label: "Actant Type", type: "select", options: ["Individual", "Group"] },
    { name: "gender", label: "Gender", type: "select", options: ["Male", "Female", "Other", "Unknown"] },
    { name: "birth_date", label: "Birth Date", type: "date" },
    { name: "country", label: "Birth Country", type: "text", placeholder: "e.g., Spain" },
    { name: "death_date", label: "Death Date", type: "date" },
    { name: "activity", label: "Activity/Profession", type: "select", fetchOptions: "/filter_options/activity" },
  ],
  institution: [
    { name: "nombre", label: "Institution Name", type: "text", required: true, placeholder: "e.g., Museo del Prado" },
    { name: "nombre_alternativo", label: "Alternative Name", type: "text", placeholder: "Optional" },
    { name: "tipo_institucion", label: "Institution Type", type: "select", options: ["Museum", "Art Center", "Cultural Center", "Gallery", "University", "Foundation", "Library", "Exhibition Space", "Other"] },
    { name: "lugar_sede", label: "Location/City", type: "text", placeholder: "e.g., Madrid, Spain" },
    { name: "direccion_postal", label: "Address", type: "text", placeholder: "Full postal address" },
    { name: "pagina_web", label: "Website", type: "text", placeholder: "e.g., https://www.museodelprado.es" },
  ],
};

// Map entity types to their backend endpoints
const entityEndpoints: Record<EntityType, string> = {
  exhibition: "/create_exhibition",
  artwork: "/create_artwork",
  actant: "/create_person",
  institution: "/create_institution",
};

export default function InsertDataPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const [entityType, setEntityType] = useState<EntityType>("actant");
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [searchableData, setSearchableData] = useState<Record<string, Array<{ uri: string; label: string }>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [createdUri, setCreatedUri] = useState("");
  const [dynamicOptions, setDynamicOptions] = useState<Record<string, string[]>>({});
  const [loadingOptions, setLoadingOptions] = useState<Record<string, boolean>>({});

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [authLoading, isAuthenticated, router]);

  // Fetch dynamic options for select fields
  useEffect(() => {
    const fields = entityFields[entityType];
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
    
    fields.forEach(async (field) => {
      if (field.fetchOptions && !dynamicOptions[field.fetchOptions]) {
        setLoadingOptions((prev) => ({ ...prev, [field.name]: true }));
        try {
          const response = await fetch(`${apiUrl}${field.fetchOptions}`);
          if (response.ok) {
            const result = await response.json();
            // API returns { data: [...] } format
            const options = result.data || result.options || (Array.isArray(result) ? result : []);
            setDynamicOptions((prev) => ({ ...prev, [field.fetchOptions!]: options }));
          }
        } catch (err) {
          console.error(`Failed to fetch options for ${field.name}:`, err);
        } finally {
          setLoadingOptions((prev) => ({ ...prev, [field.name]: false }));
        }
      }
    });
  }, [entityType, dynamicOptions]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSearchableChange = (fieldName: string, selected: Array<{ uri: string; label: string }>) => {
    setSearchableData({ ...searchableData, [fieldName]: selected });
  };

  const handleEntityTypeChange = (type: EntityType) => {
    setEntityType(type);
    setFormData({});
    setSearchableData({});
    setSuccess(false);
    setError("");
    setCreatedUri("");
  };

  // Transform form data to match backend model structure
  const transformFormData = (type: EntityType, data: Record<string, string>, searchable: Record<string, Array<{ uri: string; label: string }>>) => {
    const result: Record<string, any> = { ...data };

    // Handle special transformations based on entity type
    if (type === "artwork" && data.author_name) {
      result.author = { name: data.author_name };
      delete result.author_name;
    }

    if (type === "exhibition") {
      if (data.tipo_exposicion) {
        result.tipo_exposicion = [data.tipo_exposicion];
      }
      // Add searchable field data for Exhibition Making roles
      const searchableFields = [
        "comisario",
        "organiza", 
        "exposicion_patrocinada_por",
        "exposicion_exhibe_artista",
        "exposicion_exhibe_obra_de_arte"
      ];
      for (const fieldName of searchableFields) {
        if (searchable[fieldName]?.length) {
          result[fieldName] = searchable[fieldName].map(item => ({
            uri: item.uri,
            name: item.label
          }));
        }
      }
    }

    if (type === "institution" && data.tipo_institucion) {
      result.tipo_institucion = [data.tipo_institucion];
    }

    if (type === "actant" && data.activity) {
      result.activity = data.activity;
    }

    return result;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    setSuccess(false);
    setCreatedUri("");

    try {
      const token = localStorage.getItem("access_token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
      const endpoint = entityEndpoints[entityType];
      
      // Transform data to match backend expectations
      const payload = transformFormData(entityType, formData, searchableData);
      
      console.log("Submitting to:", `${apiUrl}${endpoint}`);
      console.log("Payload:", payload);
      
      const response = await fetch(`${apiUrl}${endpoint}`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(token && { "Authorization": `Bearer ${token}` })
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Failed to create ${entityType}`);
      }

      const result = await response.json();
      console.log("Created:", result);
      
      setSuccess(true);
      setCreatedUri(result.uri || result.label || "");
      setFormData({});
      setSearchableData({});
    } catch (err: any) {
      console.error("Error:", err);
      setError(err.message || "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const fields = entityFields[entityType];

  const getFieldOptions = (field: FormField): string[] => {
    if (field.fetchOptions && dynamicOptions[field.fetchOptions]) {
      return dynamicOptions[field.fetchOptions];
    }
    return field.options || [];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </Link>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-8 py-8 text-white">
            <div className="flex items-center gap-3">
              <Database className="h-8 w-8" />
              <div>
                <h1 className="text-3xl font-bold">Insert Data</h1>
                <p className="text-emerald-100 mt-1">Add new entities to the knowledge graph</p>
              </div>
            </div>
          </div>

          {/* Entity Type Selector */}
          <div className="px-8 py-6 border-b border-gray-100">
            <label className="block text-sm font-medium text-gray-700 mb-3">Select Entity Type</label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(entityFields) as EntityType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => handleEntityTypeChange(type)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                    entityType === type
                      ? "bg-emerald-600 text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 py-6 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 flex-shrink-0" />
                  <span className="font-medium">Successfully created!</span>
                </div>
                {createdUri && (
                  <p className="text-sm mt-1 text-green-600 break-all">URI: {createdUri}</p>
                )}
              </div>
            )}

            {fields.map((field) => (
              <div key={field.name}>
                {field.type === "searchable" ? (
                  <SearchableSelect
                    label={field.label}
                    entityType={field.searchEntityType!}
                    selected={searchableData[field.name] || []}
                    onChange={(selected) => handleSearchableChange(field.name, selected)}
                    placeholder={field.placeholder}
                    multiple={field.multiple}
                    required={field.required}
                  />
                ) : (
                  <>
                    <label htmlFor={field.name} className="block text-sm font-medium text-gray-700 mb-1">
                      {field.label} {field.required && <span className="text-red-500">*</span>}
                    </label>
                    
                    {field.type === "textarea" ? (
                      <textarea
                        id={field.name}
                        name={field.name}
                        value={formData[field.name] || ""}
                        onChange={handleChange}
                        required={field.required}
                        placeholder={field.placeholder}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    ) : field.type === "select" ? (
                      <div className="relative">
                        <select
                          id={field.name}
                          name={field.name}
                          value={formData[field.name] || ""}
                          onChange={handleChange}
                          required={field.required}
                          disabled={loadingOptions[field.name]}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-100"
                        >
                          <option value="">
                            {loadingOptions[field.name] ? "Loading..." : "Select..."}
                          </option>
                          {getFieldOptions(field).map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                        {loadingOptions[field.name] && (
                          <Loader2 className="absolute right-10 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
                        )}
                      </div>
                    ) : (
                      <input
                        type={field.type}
                        id={field.name}
                        name={field.name}
                        value={formData[field.name] || ""}
                        onChange={handleChange}
                        required={field.required}
                        placeholder={field.placeholder}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    )}
                  </>
                )}
              </div>
            ))}

            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isSubmitting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <PlusCircle className="h-5 w-5" />
                    Create {entityType.charAt(0).toUpperCase() + entityType.slice(1)}
                  </>
                )}
              </button>
            </div>

            <p className="text-xs text-gray-500 text-center">
              Logged in as: <span className="font-medium">{user?.email}</span>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
