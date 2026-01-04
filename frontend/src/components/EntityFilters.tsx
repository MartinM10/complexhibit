"use client";

/**
 * Reusable filter components for entity lists.
 * 
 * Uses a configuration-driven approach to render appropriate filters
 * based on entity type.
 */

import { FilterConfig, FilterOptions } from "@/lib/types";
import AsyncFilterSelect from "./AsyncFilterSelect";

export const FILTER_CONFIGS: Record<string, FilterConfig[]> = {
  exhibition: [
    { key: 'curator', type: 'async_select', placeholder: 'Curator', entityType: 'actant' },
    { key: 'place', type: 'text', placeholder: 'Place' },
    { key: 'start_date', type: 'date', placeholder: 'Start Date' },
    { key: 'end_date', type: 'date', placeholder: 'End Date' },
    { key: 'organizer_uri', type: 'async_select', placeholder: 'Organizer', entityType: 'institution' },
    { key: 'sponsor_uri', type: 'async_select', placeholder: 'Sponsor', entityType: 'institution' },
    { key: 'theme', type: 'select', placeholder: 'Theme', optionsKey: 'exhibition_theme' },
    { key: 'exhibition_type', type: 'select', placeholder: 'Type', optionsKey: 'exhibition_type' },
    // New Async Filters
    { key: 'participating_actant', type: 'async_select', placeholder: 'Participating Actant', entityType: 'actant' },
    { key: 'displayed_artwork', type: 'async_select', placeholder: 'Exhibited Artwork', entityType: 'artwork' },
  ],
  artwork: [
    { key: 'author_uri', type: 'async_select', placeholder: 'Artist / Author', entityType: 'actant' },
    { key: 'type_filter', type: 'select', placeholder: 'Type', optionsKey: 'artwork_type' },
    { key: 'start_date', type: 'date', placeholder: 'Creation Date' },
    { key: 'production_place', type: 'text', placeholder: 'Place of Creation' },
    { key: 'owner_uri', type: 'async_select', placeholder: 'Owner', entityType: 'institution' },
    { key: 'topic', type: 'select', placeholder: 'Topic', optionsKey: 'topic' },
    { key: 'exhibition_uri', type: 'async_select', placeholder: 'Shown in Exhibition', entityType: 'exhibition' },
  ],
  institution: [
    { key: 'activity', type: 'select', placeholder: 'Project / Activity', optionsKey: 'activity' },
  ],
  person: [
    { key: 'entity_type', type: 'select', placeholder: 'Type', optionsKey: 'entity_type' },
    { key: 'birth_place', type: 'text', placeholder: 'Origin Place' },
    { key: 'birth_date', type: 'date', placeholder: 'Origin Date' },
    { key: 'death_date', type: 'date', placeholder: 'End Date' },
    { key: 'gender', type: 'select', placeholder: 'Gender', optionsKey: 'gender' },
    { key: 'activity', type: 'select', placeholder: 'Activity/Profession', optionsKey: 'activity' },
  ],
};

// Alias person types to same config
FILTER_CONFIGS['actant'] = FILTER_CONFIGS['person'];
FILTER_CONFIGS['human_actant'] = FILTER_CONFIGS['person'];
FILTER_CONFIGS['actor'] = FILTER_CONFIGS['person'];


// ====================
// Filter Option Endpoints
// ====================

export const FILTER_OPTION_ENDPOINTS: Record<string, string[]> = {
  exhibition: ['exhibition_type', 'exhibition_theme'],
  artwork: ['artwork_type', 'topic'],
  institution: ['activity'],
  person: ['gender', 'activity', 'entity_type'],
  actant: ['gender', 'activity', 'entity_type'],
  human_actant: ['gender', 'activity', 'entity_type'],
  actor: ['gender', 'activity', 'entity_type'],
};

// ====================
// Filter Components
// ====================

import DatePicker from "@/components/ui/DatePicker";

interface FilterInputProps {
  config: FilterConfig;
  value: string;
  onChange: (key: string, value: string) => void;
  options?: string[];
}

function FilterInput({ config, value, onChange, options }: FilterInputProps) {
  const baseClasses = "px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500 outline-none";
  const widthClass = config.width || "";
  
  if (config.type === 'async_select') {
    return (
       <AsyncFilterSelect 
         label={config.placeholder}
         placeholder={config.placeholder}
         entityType={config.entityType as any}
         value={value}
         onChange={onChange}
         filterKey={config.key}
       />
    );
  }

  if (config.type === 'date') {
    const dateValue = value ? new Date(value) : null;
    return (
      <div className={`${widthClass} min-w-[200px]`}>
        <DatePicker
          selected={dateValue && !isNaN(dateValue.getTime()) ? dateValue : null}
          onChange={(date: Date | null) => {
             const strVal = date ? date.toISOString().split('T')[0] : '';
             onChange(config.key, strVal);
          }}
          placeholder={config.placeholder}
          className={`${widthClass}`}
        />
      </div>
    );
  }

  if (config.type === 'select') {
    return (
      <select
        value={value || ''}
        onChange={(e) => onChange(config.key, e.target.value)}
        className={`${baseClasses} ${widthClass} max-w-xs`}
      >
        <option value="">{config.placeholder}</option>
        {options?.map((opt, i) => (
          <option key={i} value={opt}>{opt}</option>
        ))}
      </select>
    );
  }
  
  return (
    <input
      type={config.type}
      placeholder={config.placeholder}
      value={value || ''}
      onChange={(e) => onChange(config.key, e.target.value)}
      className={`${baseClasses} ${widthClass}`}
    />
  );
}

// ====================
// Main Component
// ====================

interface EntityFiltersProps {
  type: string;
  filters: Record<string, string>;
  filterOptions: FilterOptions;
  onFilterChange: (key: string, value: string) => void;
}

export default function EntityFilters({ 
  type, 
  filters, 
  filterOptions, 
  onFilterChange 
}: EntityFiltersProps) {
  const configs = FILTER_CONFIGS[type] || [];
  
  if (configs.length === 0) {
    return null;
  }
  
  return (
    <div className="flex flex-wrap gap-4 justify-center">
      {configs.map((config) => (
        <FilterInput
          key={config.key}
          config={config}
          value={filters[config.key] || ''}
          onChange={onFilterChange}
          options={config.optionsKey ? filterOptions[config.optionsKey] : undefined}
        />
      ))}
    </div>
  );
}
