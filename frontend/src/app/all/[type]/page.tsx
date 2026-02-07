import { getFromType } from "@/lib/api";
import InfiniteList from "@/components/InfiniteList";
import { unCamel } from "@/lib/utils";
import { Entity } from "@/lib/types";

interface PageProps {
  params: Promise<{ type: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ListPage({ params, searchParams }: PageProps) {
  const { type } = await params;
  const { q } = await searchParams;
  const decodedType = decodeURIComponent(type);
  const query = typeof q === 'string' ? q : undefined;
  
  let initialData: Entity[] = [];
  let initialCursor: string | null = null;

  try {
    const apiParams: Record<string, string> = query ? { q: query } : {};
    const response = await getFromType(decodedType, apiParams);
    
    if (response) {
        if (response.data) {
             // Handle if data is array or object wrapped
            if (Array.isArray(response.data)) {
                initialData = response.data;
            } else {
                 // Try to convert object values to array if needed, though backend seems to return list now
                initialData = (Object.values(response.data).flat() as Entity[]); 
            }
        }
        initialCursor = response.next_cursor || null;
    }
  } catch (error) {
    console.error("Failed to fetch initial data:", error);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="md:flex md:items-center md:justify-between mb-8">
        <div className="min-w-0 flex-1">
          <h2 className="text-3xl font-bold leading-7 text-gray-900 sm:truncate sm:tracking-tight mb-2">
            All {unCamel(decodedType)}s
          </h2>
          <p className="text-gray-500">Browse and search the complete catalog.</p>
        </div>
      </div>

      <InfiniteList 
        initialData={initialData} 
        initialCursor={initialCursor} 
        type={decodedType} 
      />
    </div>
  );
}
