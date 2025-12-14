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

type EntityType = "exhibition" | "artwork" | "actor" | "institution";

interface FormField {
  name: string;
  label: string;
  type: "text" | "date" | "textarea" | "select";
  required?: boolean;
  options?: string[];
  placeholder?: string;
}

const entityFields: Record<EntityType, FormField[]> = {
  exhibition: [
    { name: "label", label: "Exhibition Name", type: "text", required: true, placeholder: "e.g., Impressionism in Paris" },
    { name: "startDate", label: "Opening Date", type: "date" },
    { name: "endDate", label: "Closing Date", type: "date" },
    { name: "venue", label: "Venue", type: "text", placeholder: "e.g., Museum of Modern Art" },
    { name: "location", label: "Location", type: "text", placeholder: "e.g., New York, USA" },
    { name: "description", label: "Description", type: "textarea", placeholder: "Brief description of the exhibition..." },
    { name: "themes", label: "Themes", type: "text", placeholder: "e.g., Impressionism, Modern Art (comma-separated)" },
  ],
  artwork: [
    { name: "label", label: "Artwork Title", type: "text", required: true, placeholder: "e.g., Starry Night" },
    { name: "author", label: "Author/Artist", type: "text", placeholder: "e.g., Vincent van Gogh" },
    { name: "creationDate", label: "Creation Date", type: "text", placeholder: "e.g., 1889" },
    { name: "type", label: "Artwork Type", type: "select", options: ["Painting", "Sculpture", "Installation", "Photography", "Drawing", "Other"] },
    { name: "topics", label: "Topics", type: "text", placeholder: "e.g., Night sky, Village (comma-separated)" },
    { name: "description", label: "Description", type: "textarea", placeholder: "Brief description of the artwork..." },
  ],
  actor: [
    { name: "label", label: "Full Name", type: "text", required: true, placeholder: "e.g., Pablo Picasso" },
    { name: "birthDate", label: "Birth Date", type: "date" },
    { name: "birthPlace", label: "Birth Place", type: "text", placeholder: "e.g., Málaga, Spain" },
    { name: "deathDate", label: "Death Date", type: "date" },
    { name: "gender", label: "Gender", type: "select", options: ["Male", "Female", "Other", "Unknown"] },
    { name: "activity", label: "Activity/Profession", type: "text", placeholder: "e.g., Painter, Sculptor (comma-separated)" },
  ],
  institution: [
    { name: "label", label: "Institution Name", type: "text", required: true, placeholder: "e.g., Museo del Prado" },
    { name: "type", label: "Institution Type", type: "select", options: ["Museum", "Gallery", "Cultural Center", "University", "Foundation", "Other"] },
    { name: "location", label: "Location", type: "text", placeholder: "e.g., Madrid, Spain" },
    { name: "description", label: "Description", type: "textarea", placeholder: "Brief description of the institution..." },
  ],
};

export default function InsertDataPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const [entityType, setEntityType] = useState<EntityType>("exhibition");
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [authLoading, isAuthenticated, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleEntityTypeChange = (type: EntityType) => {
    setEntityType(type);
    setFormData({});
    setSuccess(false);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("access_token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
      
      // TODO: Replace with actual API endpoint when available
      // For now, we'll show a success message
      console.log("Submitting data:", { entityType, formData });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // TODO: Uncomment when backend endpoint exists
      // const response = await fetch(`${apiUrl}/insert/${entityType}`, {
      //   method: "POST",
      //   headers: { 
      //     "Content-Type": "application/json",
      //     "Authorization": `Bearer ${token}`
      //   },
      //   body: JSON.stringify(formData),
      // });
      // 
      // if (!response.ok) {
      //   throw new Error("Failed to insert data");
      // }

      setSuccess(true);
      setFormData({});
    } catch (err: any) {
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
    return null; // Will redirect
  }

  const fields = entityFields[entityType];

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
                <AlertCircle className="h-5 w-5" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                <span>Data submitted successfully! (Note: Backend endpoint not yet implemented)</span>
              </div>
            )}

            {fields.map((field) => (
              <div key={field.name}>
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
                  <select
                    id={field.name}
                    name={field.name}
                    value={formData[field.name] || ""}
                    onChange={handleChange}
                    required={field.required}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="">Select...</option>
                    {field.options?.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
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
                    Insert {entityType.charAt(0).toUpperCase() + entityType.slice(1)}
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
