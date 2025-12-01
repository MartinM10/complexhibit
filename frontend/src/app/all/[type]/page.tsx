import { getFromType } from "@/lib/api";
import ItemCard from "@/components/ItemCard";
import { unCamel, cleanLabel } from "@/lib/utils";

interface PageProps {
  params: Promise<{ type: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ListPage({ params, searchParams }: PageProps) {
  const { type } = await params;
  const { q } = await searchParams;
  const decodedType = decodeURIComponent(type);
  const query = typeof q === 'string' ? q : undefined;
  
  let data: any[] = [];
  try {
    const apiParams: Record<string, string> = query ? { q: query } : {};
    const response = await getFromType(decodedType, apiParams);
    console.log("API Response Data:", JSON.stringify(response?.data, null, 2));
    
    if (response && response.data) {
        if (Array.isArray(response.data)) {
            data = response.data;
        } else {
            // The API might return { data: { "some_key": [...] } }
            // We need to iterate over values and check if they are arrays
            Object.values(response.data).forEach((group: any) => {
                if (Array.isArray(group)) {
                    data.push(...group);
                }
            });
            
            // Fallback: if data is empty, maybe response.data itself is the list but wrapped in an object with numeric keys?
            // Or maybe the structure is different. Let's trust the log for now.
            // Based on the log: {"data": [{"label": ...}, ...]} -> response.data IS the array.
            // Wait, if response is { data: [...] }, then response.data is the array.
            // If response is { data: { key: [...] } }, then response.data is an object.
        }
    }
  } catch (error) {
    console.error("Failed to fetch data:", error);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="md:flex md:items-center md:justify-between mb-8">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            All {unCamel(decodedType)}s
          </h2>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No items found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {data.map((item: any, index: number) => (
            <ItemCard
              key={item.uri || index}
              uri={item.uri}
              label={cleanLabel(item.label || item.title || "Untitled")}
              type={decodedType}
              description={item.description || item.abstract}
              imageUrl={item.image || item.img}
            />
          ))}
        </div>
      )}
    </div>
  );
}
