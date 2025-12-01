import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface ItemCardProps {
  uri: string;
  label: string;
  description?: string;
  type: string;
  imageUrl?: string;
}

export default function ItemCard({ uri, label, description, type, imageUrl }: ItemCardProps) {
  // Extract ID from URI or use a safe fallback
  const id = uri.split("/").pop() || "";
  
  return (
    <Link 
      href={`/detail/${type}/${id}`}
      className="group relative flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-md transition-all hover:border-indigo-300"
    >
      {imageUrl && (
        <div className="aspect-h-3 aspect-w-4 bg-gray-200 sm:aspect-none sm:h-48">
          <img
            src={imageUrl}
            alt={label}
            className="h-full w-full object-cover object-center sm:h-full sm:w-full"
          />
        </div>
      )}
      <div className="flex flex-1 flex-col space-y-2 p-4">
        <h3 className="text-lg font-medium text-gray-900 group-hover:text-indigo-600">
          {label}
        </h3>
        {description && (
          <p className="text-sm text-gray-500 line-clamp-3">{description}</p>
        )}
        <div className="mt-auto pt-4 flex items-center text-sm font-medium text-indigo-600">
          View Details <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
  );
}
