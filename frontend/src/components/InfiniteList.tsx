"use client";

import { useEffect, useState, useCallback } from "react";
import { getFromType, fetchFromApi } from "@/lib/api";
import ItemCard from "@/components/ItemCard";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import { unCamel, cleanLabel } from "@/lib/utils";
import { Search, Loader2 } from "lucide-react";

interface InfiniteListProps {
  initialData: any[];
  initialCursor: string | null;
  type: string;
}

export default function InfiniteList({ initialData, initialCursor, type }: InfiniteListProps) {
  const [items, setItems] = useState<any[]>(initialData);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [hasMore, setHasMore] = useState(!!initialCursor);
  
  // Ref for the bottom of the list
  const [ref, isIntersecting] = useIntersectionObserver({ threshold: 0.1 });

  // Function to load more items
  const loadMore = useCallback(async () => {
    if (isLoading || !cursor) return;
    
    setIsLoading(true);
    try {
      const params: Record<string, string> = { cursor, ...filters };
      if (searchQuery) params.q = searchQuery;
      
      const response = await getFromType(type, params);
      
      if (response && response.data) {
        const newItems = Array.isArray(response.data) ? response.data : [];
        setItems((prev) => [...prev, ...newItems]);
        setCursor(response.next_cursor || null);
        setHasMore(!!response.next_cursor);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Error loading more items:", error);
    } finally {
      setIsLoading(false);
    }
  }, [cursor, isLoading, type, searchQuery]);

  // Trigger loadMore when bottom is reached
  useEffect(() => {
    if (isIntersecting && hasMore && !isLoading) {
      loadMore();
    }
  }, [isIntersecting, hasMore, isLoading, loadMore]);

  // Handle Search
  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    setCursor(null); // Reset cursor on search
    
    // Debounce could be added here, but for now we'll do direct fetch on small delay or enter
    // For simplicity/responsiveness, let's fetch immediately but maybe reset list first
  };

  // Effect to refetch when search changes (debounced slightly or direct)
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      // Only fetch if query changed from initial state (which is empty)
      // or if we are typing.
      
      // We need to fetch the FIRST page of results for the new query
      setIsLoading(true);
      try {
        const params: Record<string, string> = { ...filters };
        if (searchQuery) params.q = searchQuery;

        const response = await getFromType(type, params);
        
        if (response && response.data) {
           const newItems = Array.isArray(response.data) ? response.data : [];
           setItems(newItems);
           setCursor(response.next_cursor || null);
           setHasMore(!!response.next_cursor);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, filters, type]);

  const handleFilterChange = (key: string, value: string) => {
      setFilters(prev => ({...prev, [key]: value}));
      setCursor(null); // Reset cursor
  };

  const [filterOptions, setFilterOptions] = useState<Record<string, string[]>>({});

  // Fetch filter options on mount (or when type changes)
  useEffect(() => {
    const fetchOptions = async (filterType: string, key: string) => {
            try {
                const res = await fetchFromApi(`/filter_options/${filterType}`);
                if (res && res.data) {
                    setFilterOptions(prev => ({ ...prev, [key]: res.data }));
                }
            } catch (e) {
                console.error(`Failed to fetch options for ${filterType}`, e);
            }
    };

    if (type === 'person' || type === 'actant' || type === 'human_actant') {
        fetchOptions('gender', 'gender');
        fetchOptions('activity', 'activity');
    } else if (type === 'artwork') {
            fetchOptions('artwork_type', 'artwork_type');
            fetchOptions('topic', 'topic');
    } else if (type === 'institution') {
        fetchOptions('activity', 'activity');
    }
  }, [type]);

  const FilterSelect = ({ paramKey, placeholder, options }: { paramKey: string, placeholder: string, options: string[] }) => (
    <select
        value={filters[paramKey] || ''}
        onChange={(e) => handleFilterChange(paramKey, e.target.value)}
        className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500 outline-none max-w-xs"
    >
        <option value="">{placeholder}</option>
        {options.map((opt, i) => (
            <option key={i} value={opt}>{opt}</option>
        ))}
    </select>
  );

  return (
    <div className="space-y-8">
        {/* Search Bar */}
        {/* Search & Filters Bar */}
        <div className="max-w-4xl mx-auto space-y-4">
            
            {/* Main Search */}
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm shadow-sm transition-shadow hover:shadow-md"
                    placeholder={`Search ${unCamel(type)}s...`}
                    value={searchQuery}
                    onChange={handleSearch}
                />
            </div>

            {/* Advanced Filters */}
            <div className="flex flex-wrap gap-4 justify-center">
                 {/* EXHIBITION FILTERS */}
                 {type === 'exhibition' && (
                    <>
                        <input 
                            type="text" 
                            placeholder="Curator Name" 
                            value={filters.curator_name || ''}
                            onChange={(e) => handleFilterChange('curator_name', e.target.value)}
                            className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                        />
                         <input 
                            type="text" 
                            placeholder="Place" 
                            value={filters.place || ''}
                            onChange={(e) => handleFilterChange('place', e.target.value)}
                            className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                        />
                        <input 
                            type="number" 
                            placeholder="Start Year" 
                            value={filters.start_date || ''}
                            onChange={(e) => handleFilterChange('start_date', e.target.value)}
                            className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500 outline-none w-32"
                        />
                        <input 
                            type="number" 
                            placeholder="End Year" 
                            value={filters.end_date || ''}
                            onChange={(e) => handleFilterChange('end_date', e.target.value)}
                            className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500 outline-none w-32"
                        />
                        <input 
                            type="text" 
                            placeholder="Organizer" 
                            value={filters.organizer || ''}
                            onChange={(e) => handleFilterChange('organizer', e.target.value)}
                            className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                        />
                        <input 
                            type="text" 
                            placeholder="Sponsor" 
                            value={filters.sponsor || ''}
                            onChange={(e) => handleFilterChange('sponsor', e.target.value)}
                            className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                        />
                    </>
                 )}
                 
                 {/* ARTWORK FILTERS */}
                 {type === 'artwork' && (
                    <>
                     <input 
                        type="text" 
                        placeholder="Artist / Author" 
                        value={filters.author_name || ''}
                        onChange={(e) => handleFilterChange('author_name', e.target.value)}
                        className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                    />
                    
                    <FilterSelect 
                        paramKey="type_filter" 
                        placeholder="Type" 
                        options={filterOptions['artwork_type'] || []} 
                    />
                    
                     <input 
                        type="number" 
                        placeholder="Creation Year" 
                        value={filters.start_date || ''}
                        onChange={(e) => handleFilterChange('start_date', e.target.value)}
                        className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500 outline-none w-36"
                    />
                     <input 
                        type="text" 
                        placeholder="Owner" 
                        value={filters.owner || ''}
                        onChange={(e) => handleFilterChange('owner', e.target.value)}
                        className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                    />
                    
                    <FilterSelect 
                        paramKey="topic" 
                        placeholder="Topic" 
                        options={filterOptions['topic'] || []} 
                    />

                     <input 
                        type="text" 
                        placeholder="Shown in Exhibition" 
                        value={filters.exhibition || ''}
                        onChange={(e) => handleFilterChange('exhibition', e.target.value)}
                        className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                    />
                    </>
                 )}

                 {/* INSTITUTION FILTERS */}
                 {type === 'institution' && (
                    <>
                    <FilterSelect 
                        paramKey="activity" 
                        placeholder="Project / Activity" 
                        options={filterOptions['activity'] || []} 
                    />
                    </>
                 )}

                 {/* PERSON FILTERS */}
                 {(type === 'person' || type === 'actant' || type === 'human_actant') && (
                    <>
                     <input 
                        type="text" 
                        placeholder="Birth Place" 
                        value={filters.birth_place || ''}
                        onChange={(e) => handleFilterChange('birth_place', e.target.value)}
                        className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                    />
                    <input 
                        type="number" 
                        placeholder="Birth Year" 
                        value={filters.birth_date || ''}
                        onChange={(e) => handleFilterChange('birth_date', e.target.value)}
                        className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500 outline-none w-32"
                    />
                     <input 
                        type="number" 
                        placeholder="Death Year" 
                        value={filters.death_date || ''}
                        onChange={(e) => handleFilterChange('death_date', e.target.value)}
                        className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500 outline-none w-32"
                    />
                    
                    <FilterSelect 
                        paramKey="gender" 
                        placeholder="Gender" 
                        options={filterOptions['gender'] || []} 
                    />
                    
                    <FilterSelect 
                        paramKey="activity" 
                        placeholder="Activity/Profession" 
                        options={filterOptions['activity'] || []} 
                    />
                    </>
                 )}
            </div>
        </div>

        {/* Status Message */}
        <div className="text-center text-sm text-gray-500">
            Showing {items.length} results {hasMore && "..."}
        </div>

        {/* Grid */}
        {items.length === 0 && !isLoading ? (
            <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No items found matching your search.</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {items.map((item: any, index: number) => {
                    // Enrich item data based on type
                    let subtitle = "";
                    let extra = {};

                    if (type === 'person' || type === 'actant' || type === 'human_actant') {
                        if (item.birth_place_label) extra = { ...extra, "Born in": item.birth_place_label };
                        if (item.birth_date_label) extra = { ...extra, "Born": item.birth_date_label };
                        if (item.death_date_label) extra = { ...extra, "Died": item.death_date_label };
                        if (item.gender) extra = { ...extra, "Gender": item.gender };
                        if (item.activity) extra = { ...extra, "Activity": item.activity };
                    }
                    
                    if (type === 'exhibition') {
                        if (item.curator_name) extra = { ...extra, "Curator": item.curator_name };
                        if (item.organizer) extra = { ...extra, "Organizer": item.organizer };
                        if (item.sponsor) extra = { ...extra, "Sponsor": item.sponsor };
                        if (item.label_place) extra = { ...extra, "Place": item.label_place };
                        if (item.label_starting_date) extra = { ...extra, "Date": `${item.label_starting_date}${item.label_ending_date ? ' - ' + item.label_ending_date : ''}` };
                    }
                    
                    if (type === 'artwork') {
                        if (item.author) extra = { ...extra, "Artist": item.author };
                        if (item.label_starting_date) extra = { ...extra, "Date": item.label_starting_date };
                        if (item.type) extra = { ...extra, "Type": item.type };
                        if (item.owner) extra = { ...extra, "Owner": item.owner };
                        if (item.topic) extra = { ...extra, "Topic": item.topic };
                    }

                    return (
                        <ItemCard
                            key={`${item.uri}-${index}`}
                            uri={item.uri}
                            label={cleanLabel(item.label || item.title || "Untitled")}
                            type={type}
                            description={item.description || item.abstract}
                            imageUrl={item.image || item.img}
                            subtitle={subtitle}
                            extra={extra}
                        />
                    );
                })}
            </div>
        )}

        {/* Loading / Sentinel */}
        <div ref={ref} className="py-8 flex justify-center items-center h-20">
            {isLoading && (
                <div className="flex items-center gap-2 text-indigo-600">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span>Loading more...</span>
                </div>
            )}
            {!hasMore && items.length > 0 && (
                <div className="text-gray-400 text-sm italic">You've reached the end of the list.</div>
            )}
        </div>
    </div>
  );
}
