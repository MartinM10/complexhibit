/**
 * Actor/Person-specific detail components.
 */

import { cleanLabel, unCamel } from "@/lib/utils";
import { SidebarCard, SectionHeader, SectionWrapper, DefinitionList, EntityList } from "./DetailUtils";
import EntityLink from "@/components/EntityLink";

interface RoleItem {
  uri: string;
  label: string;
  type?: string;
}

interface ActorRolesSidebarProps {
  roleData: Record<string, RoleItem[]>;
}

export function ActorRolesSidebar({ roleData }: ActorRolesSidebarProps) {
  if (!roleData || Object.keys(roleData).length === 0) return null;
  
  // Map common roles to specific colors to match Exhibition style
  const getColorClass = (role: string) => {
    const r = role.toLowerCase();
    if (r.includes('curator') || r.includes('organizer')) return "text-indigo-600 hover:text-indigo-800";
    if (r.includes('funder')) return "text-green-600 hover:text-green-800";
    if (r.includes('lender') || r.includes('participant')) return "text-purple-600 hover:text-purple-800";
    if (r.includes('exhibitor') || r.includes('author') || r.includes('artist')) return "text-pink-600 hover:text-pink-800";
    return "text-gray-600 hover:text-gray-800";
  };

  return (
    <SidebarCard title="Roles Played">
      <DefinitionList>
        {Object.entries(roleData).map(([role, items]: [string, any]) => (
          <EntityList 
            key={role} 
            label={unCamel(role)} 
            entities={items} 
            colorClass={getColorClass(role)} 
          />
        ))}
      </DefinitionList>
    </SidebarCard>
  );
}

interface ActorData {
  label?: string;
  gender?: string;
  label_date?: string | string[];
  label_place?: string | string[];
  place_uri?: string | string[];
  death_date?: string | string[];
  activity?: string;
}

interface ActorBiographyProps {
  actorData: ActorData[];
}

export function ActorBiography({ actorData }: ActorBiographyProps) {
  if (!actorData || actorData.length === 0) return null;
  
  const actor = actorData[0];
  const birthDate = Array.isArray(actor?.label_date) ? actor.label_date[0] : actor?.label_date;
  const birthPlace = Array.isArray(actor?.label_place) ? actor.label_place[0] : actor?.label_place;
  const placeUri = Array.isArray(actor?.place_uri) ? actor.place_uri[0] : actor?.place_uri;
  const deathDate = Array.isArray(actor?.death_date) ? actor.death_date[0] : actor?.death_date;
  const gender = actor?.gender;
  const activities = actor?.activity?.split('|').filter(Boolean) || [];
  
  // Only render if there's actual data
  if (!birthDate && !birthPlace && !deathDate && !gender && activities.length === 0) return null;
  
  return (
    <section>
      <SectionHeader title="Biographical Information" colorClass="bg-indigo-500" />
      <SectionWrapper>
        <div className="grid gap-4">
          <div className="space-y-4">
            {/* Basic Info */}
            <div className="grid sm:grid-cols-2 gap-4">
              {gender && (
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-gray-500 uppercase">Gender</span>
                  <span className="text-gray-900">{cleanLabel(gender)}</span>
                </div>
              )}
              {birthDate && (
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-gray-500 uppercase">Birth Date</span>
                  <span className="text-gray-900">{cleanLabel(birthDate)}</span>
                </div>
              )}
            </div>
            
            {(gender || birthDate) && (birthPlace || deathDate) && <hr className="border-gray-100" />}
            
            {/* Location & Death */}
            <div className="grid sm:grid-cols-2 gap-4">
              {birthPlace && (
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-gray-500 uppercase">Birth Place</span>
                  <span className="text-gray-900">
                    {placeUri ? (
                      <EntityLink label={cleanLabel(birthPlace)} uri={placeUri} fallbackType="site" className="text-indigo-600 hover:text-indigo-800 hover:underline" />
                    ) : (
                      cleanLabel(birthPlace)
                    )}
                  </span>
                </div>
              )}
              {deathDate && (
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-gray-500 uppercase">Death Date</span>
                  <span className="text-gray-900">{cleanLabel(deathDate)}</span>
                </div>
              )}
            </div>
            
            {/* Activities */}
            {activities.length > 0 && (
              <>
                <hr className="border-gray-100" />
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-gray-500 uppercase">Activities / Professions</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {activities.map((a: string, i: number) => (
                      <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                        {cleanLabel(a)}
                      </span>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </SectionWrapper>
    </section>
  );
}
