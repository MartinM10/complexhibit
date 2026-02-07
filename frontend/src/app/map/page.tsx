'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, Filter, MapPin, Calendar, Building2, User, Landmark, X, Palette } from 'lucide-react';
import { Map, MapClusterLayer, MapPopup, MapControls } from '@/components/ui/map';
import { getMapEntities } from '@/lib/api';

interface MapEntity {
  id: string;
  uri: string;
  type: string;
  label: string;
  lat: number;
  long: number;
  date_start?: string;
  date_end?: string;
}

interface GeoJsonFeature {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
  properties: MapEntity;
}

interface GeoJsonCollection {
  type: 'FeatureCollection';
  features: GeoJsonFeature[];
}

const typeColors: Record<string, string> = {
  exhibition: '#6366f1', // indigo
  institution: '#10b981', // emerald
  person: '#f59e0b', // amber
  artwork: '#ec4899', // pink
};

const typeIcons: Record<string, typeof MapPin> = {
  exhibition: Calendar,
  institution: Building2,
  person: User,
  artwork: Palette,
};

export default function MapPage() {
  const [entities, setEntities] = useState<MapEntity[]>([]);
  // loading state removed as we load on demand
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [showFilters, setShowFilters] = useState(true);
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set([])); // Start with no filters applied
  const [loadedTypes, setLoadedTypes] = useState<Set<string>>(new Set([])); // Track what we have already fetched
  const [isFetching, setIsFetching] = useState(false);
  
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  
  // Popup state
  const [selectedEntity, setSelectedEntity] = useState<MapEntity | null>(null);

  // Fetch data for a specific type
  const fetchTypeData = async (type: string) => {
    if (loadedTypes.has(type)) return; // Already loaded

    setIsFetching(true);
    try {
      const res = await getMapEntities([type]);
      const newEntities = res.data || [];
      if (newEntities.length > 0) {
        setEntities(prev => [...prev, ...newEntities]);
      }
      setLoadedTypes(prev => new Set(prev).add(type));
    } catch (e) {
      console.error(`Failed to load ${type}`, e);
      setError(`Failed to load ${type}`);
    } finally {
      setIsFetching(false);
    }
  };

  const toggleType = async (type: string) => {
    const newTypes = new Set(selectedTypes);
    const isSelecting = !newTypes.has(type);

    if (isSelecting) {
      newTypes.add(type);
      // Fetch if not already loaded
      if (!loadedTypes.has(type)) {
         await fetchTypeData(type);
      }
    } else {
      newTypes.delete(type);
    }
    setSelectedTypes(newTypes);
  };
    
  // Filter entities
  const filteredEntities = useMemo(() => {
    return entities.filter(entity => {
      // Type filter
      if (!selectedTypes.has(entity.type)) return false;
      
      // Date filter (simple year-based)
      const fromYear = dateFrom ? parseInt(dateFrom) : null;
      const toYear = dateTo ? parseInt(dateTo) : null;

      if (fromYear || toYear) {
        // Parse entity years
        let entityStartYear = entity.date_start ? parseInt(entity.date_start.substring(0, 4)) : null;
        let entityEndYear = entity.date_end ? parseInt(entity.date_end.substring(0, 4)) : null;

        // If end year is missing, fallback to start year (point in time event)
        if (entityEndYear === null && entityStartYear !== null) {
          entityEndYear = entityStartYear;
        }
        // If start year is missing but end exists, fallback (unlikely but safe)
        if (entityStartYear === null && entityEndYear !== null) {
          entityStartYear = entityEndYear;
        }

        // If no dates at all, decide behavior. Currently: if filtering by date, exclude dateless entities
        if (entityStartYear === null && entityEndYear === null) return false;

        // "From": Entity must end after or on the From year
        // (If it ended before 1992, it's not relevant to 1992+)
        if (fromYear !== null && entityEndYear! < fromYear) return false;

        // "To": Entity must start before or on the To year
        // (If it started after 1995, it's not relevant to <= 1995)
        if (toYear !== null && entityStartYear! > toYear) return false;
      }
      
      return true;
    });
  }, [entities, selectedTypes, dateFrom, dateTo]);

  // Convert to GeoJSON
  const geoJsonData: GeoJsonCollection = useMemo(() => ({
    type: 'FeatureCollection',
    features: filteredEntities.map(entity => ({
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: [entity.long, entity.lat] as [number, number],
      },
      properties: entity,
    })),
  }), [filteredEntities]);

  const handlePointClick = (
    feature: GeoJSON.Feature<GeoJSON.Point, MapEntity>,
    coordinates: [number, number]
  ) => {
    setSelectedEntity(feature.properties);
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      exhibition: 'Exhibitions',
      institution: 'Institutions',
      person: 'Persons',
      artwork: 'Artworks',
    };
    return labels[type] || type;
  };

  const getDetailUrl = (entity: MapEntity) => {
    // Strip suffixes added for multiple location support (e.g. "123_residence" -> "123")
    const cleanId = entity.id.replace(/_(residence|birth)$/, '');
    
    // Standardize URL: map 'person' to 'actant' as per project convention
    const type = entity.type === 'person' ? 'actant' : entity.type;
    
    return `/detail/${type}/${cleanId}`;
  };

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-red-600">
          <p>Error: {error}</p>
          <button onClick={() => setError(null)} className="mt-4 text-indigo-600 hover:underline">
            Dismiss
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-[calc(100vh-64px)] w-full overflow-hidden">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-white/90 backdrop-blur-sm border-b border-gray-200 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" /> Home
            </Link>
            <h1 className="text-xl font-bold text-gray-900">Interactive Map</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
              {filteredEntities.length} of {entities.length} entities
            </span>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                showFilters 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {isFetching ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
              ) : (
                <Filter className="h-4 w-4" />
              )}
              Filters
            </button>
          </div>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="absolute top-16 right-4 z-20 bg-white rounded-xl shadow-xl border border-gray-200 p-4 w-72">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Filters</h3>
            <button onClick={() => setShowFilters(false)} className="text-gray-400 hover:text-gray-600">
              <X className="h-4 w-4" />
            </button>
          </div>
          
          {/* Type filters */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Entity Types</h4>
            <div className="space-y-2">
              {['exhibition', 'institution', 'person', 'artwork'].map(type => {
                const Icon = typeIcons[type] || MapPin;
                return (
                  <label key={type} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedTypes.has(type)}
                      onChange={() => toggleType(type)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <Icon className="h-4 w-4" style={{ color: typeColors[type] }} />
                    <span className="text-sm text-gray-700">{getTypeLabel(type)}</span>
                  </label>
                );
              })}
            </div>
          </div>
          
          {/* Date filters */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Date Range (Year)</h4>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="From"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500"
              />
              <input
                type="number"
                placeholder="To"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Map */}
      <div className="h-full w-full pt-14">
        <Map
          center={[0, 20]}
          zoom={2}
          minZoom={1}
          maxZoom={18}
        >
          <MapControls 
            position="bottom-right" 
            showZoom 
            showLocate
            showFullscreen
          />
          
          {geoJsonData.features.length > 0 && (
            <MapClusterLayer
              data={geoJsonData}
              clusterMaxZoom={14}
              clusterRadius={50}
              clusterColors={(() => {
                if (selectedTypes.size === 1) {
                  const type = Array.from(selectedTypes)[0];
                  const color = typeColors[type];
                  return [color, color, color] as [string, string, string]; // all sizes same color
                }
                return ['#6366f1', '#8b5cf6', '#a855f7']; // default mix
              })()}
              clusterThresholds={[10, 50]}
              pointColor={[
                'match',
                ['get', 'type'],
                'exhibition', '#6366f1',
                'institution', '#10b981',
                'person', '#f59e0b',
                'artwork', '#ec4899',
                '#6b7280'
              ] as unknown as string}
              onPointClick={handlePointClick}
            />
          )}

          {/* Popup for selected entity */}
          {selectedEntity && (
            <MapPopup
              longitude={selectedEntity.long}
              latitude={selectedEntity.lat}
              onClose={() => setSelectedEntity(null)}
              closeButton
            >
              <div className="min-w-[200px]">
                <div className="flex items-center gap-2 mb-2">
                  <span 
                    className="px-2 py-0.5 text-xs font-medium rounded-full text-white"
                    style={{ backgroundColor: typeColors[selectedEntity.type] || '#6b7280' }}
                  >
                    {selectedEntity.type}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{selectedEntity.label}</h3>
                {selectedEntity.date_start && (
                  <p className="text-xs text-gray-500 mb-2">
                    {selectedEntity.date_start}
                    {selectedEntity.date_end && ` - ${selectedEntity.date_end}`}
                  </p>
                )}
                <Link
                  href={getDetailUrl(selectedEntity)}
                  className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  View Details →
                </Link>
              </div>
            </MapPopup>
          )}
        </Map>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-10 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 p-3">
        <h4 className="text-xs font-semibold text-gray-700 mb-2">Legend</h4>
        <div className="space-y-1">
          {Object.entries(typeColors).map(([type, color]) => {
            const Icon = typeIcons[type] || MapPin;
            return (
              <div key={type} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="text-xs text-gray-600 capitalize">{type}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
