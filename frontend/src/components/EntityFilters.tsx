"use client";

/**
 * Reusable filter components for entity lists.
 * 
 * Uses a configuration-driven approach to render appropriate filters
 * based on entity type.
 */

import { FilterConfig, FilterOptions } from "@/lib/types";

// ====================
// Filter Configurations
// ====================

export const FILTER_CONFIGS: Record<string, FilterConfig[]> = {
  exhibition: [
    { key: 'curator_name', type: 'text', placeholder: 'Curator Name' },
    { key: 'place', type: 'text', placeholder: 'Place' },
    { key: 'start_date', type: 'number', placeholder: 'Start Year', width: 'w-32' },
    { key: 'end_date', type: 'number', placeholder: 'End Year', width: 'w-32' },
    { key: 'organizer', type: 'text', placeholder: 'Organizer' },
    { key: 'sponsor', type: 'text', placeholder: 'Sponsor' },
    { key: 'theme', type: 'select', placeholder: 'Theme', optionsKey: 'exhibition_theme' },
    { key: 'type', type: 'select', placeholder: 'Type', optionsKey: 'exhibition_type' },
  ],
  artwork: [
    { key: 'author_name', type: 'text', placeholder: 'Artist / Author' },
    { key: 'type_filter', type: 'select', placeholder: 'Type', optionsKey: 'artwork_type' },
    { key: 'start_date', type: 'number', placeholder: 'Creation Year', width: 'w-36' },
    { key: 'owner', type: 'text', placeholder: 'Owner' },
    { key: 'topic', type: 'select', placeholder: 'Topic', optionsKey: 'topic' },
    { key: 'exhibition', type: 'text', placeholder: 'Shown in Exhibition' },
  ],
  institution: [
    { key: 'activity', type: 'select', placeholder: 'Project / Activity', optionsKey: 'activity' },
  ],
  person: [
    { key: 'birth_place', type: 'text', placeholder: 'Birth Place' },
    { key: 'birth_date', type: 'number', placeholder: 'Birth Year', width: 'w-32' },
    { key: 'death_date', type: 'number', placeholder: 'Death Year', width: 'w-32' },
    { key: 'gender', type: 'select', placeholder: 'Gender', optionsKey: 'gender' },
    { key: 'activity', type: 'select', placeholder: 'Activity/Profession', optionsKey: 'activity' },
  ],
};

// Alias person types to same config
FILTER_CONFIGS['actant'] = FILTER_CONFIGS['person'];
FILTER_CONFIGS['human_actant'] = FILTER_CONFIGS['person'];

// ====================
// Filter Option Endpoints
// ====================

export const FILTER_OPTION_ENDPOINTS: Record<string, string[]> = {
  exhibition: ['exhibition_type', 'exhibition_theme'],
  artwork: ['artwork_type', 'topic'],
  institution: ['activity'],
  person: ['gender', 'activity'],
  actant: ['gender', 'activity'],
  human_actant: ['gender', 'activity'],
};

// ====================
// Filter Components
// ====================

interface FilterInputProps {
  config: FilterConfig;
  value: string;
  onChange: (key: string, value: string) => void;
  options?: string[];
}

function FilterInput({ config, value, onChange, options }: FilterInputProps) {
  const baseClasses = "px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500 outline-none";
  const widthClass = config.width || "";
  
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
