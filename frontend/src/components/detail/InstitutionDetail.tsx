/**
 * Institution-specific detail components.
 */

import { cleanLabel } from "@/lib/utils";
import { SidebarCard, DefinitionList } from "./DetailUtils";
import EntityLink from "@/components/EntityLink";

interface InstitutionData {
  label?: string;
  apelation?: string;
  label_place?: string;
  place_uri?: string;
}

interface InstitutionSidebarProps {
  data: InstitutionData | InstitutionData[];
}

export function InstitutionSidebar({ data }: InstitutionSidebarProps) {
  const institution = Array.isArray(data) ? data[0] : data;
  
  if (!institution) return null;
  
  return (
    <SidebarCard title="Institution Information">
      <DefinitionList>
        {institution.apelation && (
          <div>
            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Also Known As</dt>
            <dd className="mt-1 text-sm text-gray-900 font-medium">{cleanLabel(institution.apelation)}</dd>
          </div>
        )}
        {institution.label_place && (
          <div>
            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Location</dt>
            <dd className="mt-1 text-sm text-gray-900 font-medium">
              {institution.place_uri ? (
                <EntityLink 
                  label={institution.label_place} 
                  uri={institution.place_uri} 
                  fallbackType="site" 
                  className="text-teal-600 hover:text-teal-800 hover:underline" 
                />
              ) : (
                cleanLabel(institution.label_place)
              )}
            </dd>
          </div>
        )}
      </DefinitionList>
    </SidebarCard>
  );
}
