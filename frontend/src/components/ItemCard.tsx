import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface ItemCardProps {
  uri: string;
  label: string;
  description?: string;
  type: string;
  imageUrl?: string;
}

export default function ItemCard({ uri, label, description, type, imageUrl, subtitle, extra }: any) {
  // Extract ID from URI or use a safe fallback
  const id = uri.split("/").pop() || "";
  
  return (
    <Link 
      href={`/detail/${type}/${id}`}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 hover:border-indigo-300"
    >
      {imageUrl ? (
        <div className="aspect-h-3 aspect-w-4 bg-gray-200 sm:aspect-none sm:h-48 relative">
           <img
            src={imageUrl}
            alt={label}
            className="h-full w-full object-cover object-center sm:h-full sm:w-full transition-transform duration-300 group-hover:scale-105"
          />
           <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] uppercase font-bold px-2 py-1 rounded-md backdrop-blur-sm">
             {type}
           </div>
        </div>
      ) : (
        <div className="aspect-h-3 aspect-w-4 bg-gray-100 sm:aspect-none sm:h-48 relative overflow-hidden">
             <img 
                src={`https://placehold.co/600x400/f1f5f9/475569?text=${type.charAt(0).toUpperCase() + type.slice(1)}`}
                alt="Placeholder"
                className="h-full w-full object-cover opacity-80 hover:opacity-100 transition-opacity"
             />
             <div className="absolute top-2 right-2 bg-white/80 text-gray-800 text-[10px] uppercase font-bold px-2 py-1 rounded-md backdrop-blur-sm">
               {type}
             </div>
        </div>
      )}
      
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 line-clamp-2 leading-tight mb-1">
          {label}
        </h3>
        
        {subtitle && (
            <p className="text-xs font-medium text-indigo-500 mb-2 uppercase tracking-wide">
                {subtitle}
            </p>
        )}

        {description && (
          <p className="text-sm text-gray-500 line-clamp-3 mb-3 flex-1">{description}</p>
        )}
        
        {extra && (
            <div className="mt-auto pt-3 border-t border-gray-100 text-xs text-gray-500 flex flex-wrap gap-2">
                {Object.entries(extra).map(([k, v]) => (
                    v ? <span key={k} className="bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                        <span className="font-semibold text-gray-700 mr-1">{k}:</span>{String(v).split('|').join(', ')}
                    </span> : null
                ))}
            </div>
        )}

        <div className="mt-4 flex items-center text-sm font-bold text-indigo-600 group-hover:translate-x-1 transition-transform">
          View Details <ArrowRight className="ml-1 h-4 w-4" />
        </div>
      </div>
    </Link>
  );
}
