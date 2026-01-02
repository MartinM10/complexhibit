/**
 * Actor/Person-specific detail components.
 */

import { cleanLabel, unCamel } from "@/lib/utils";
import { SidebarCard, SectionHeader, SectionWrapper, DefinitionList, EntityList } from "./DetailUtils";
import EntityLink from "@/components/EntityLink";
import type { LinkedEntity } from "@/lib/types";

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
  residence_address?: string;
  residence_lat?: string;
  residence_long?: string;
  foundation_date_label?: string | string[];
  foundation_place_label?: string | string[];
  foundation_place_uri?: string | string[];
  entity_type?: string;
  dissolution_date_label?: string | string[];
}

interface ActorBiographyProps {
  actorData: ActorData[];
}

export function ActorBiography({ actorData }: ActorBiographyProps) {
  if (!actorData || actorData.length === 0) return null;
  
  const actor = actorData[0];
  
  // Determine if this is a group entity
  const isGroup = actor?.entity_type === 'group' || 
    (!actor?.label_date && !actor?.label_place && (actor?.foundation_date_label || actor?.foundation_place_label));
  
  // For groups: use foundation data; for individuals: use birth data
  const originDate = isGroup 
    ? (Array.isArray(actor?.foundation_date_label) ? actor.foundation_date_label[0] : actor?.foundation_date_label)
    : (Array.isArray(actor?.label_date) ? actor.label_date[0] : actor?.label_date);
  const originPlace = isGroup
    ? (Array.isArray(actor?.foundation_place_label) ? actor.foundation_place_label[0] : actor?.foundation_place_label)
    : (Array.isArray(actor?.label_place) ? actor.label_place[0] : actor?.label_place);
  const originPlaceUri = isGroup
    ? (Array.isArray(actor?.foundation_place_uri) ? actor.foundation_place_uri[0] : actor?.foundation_place_uri)
    : (Array.isArray(actor?.place_uri) ? actor.place_uri[0] : actor?.place_uri);
  
  const deathDate = Array.isArray(actor?.death_date) ? actor.death_date[0] : actor?.death_date;
  const dissolutionDate = Array.isArray(actor?.dissolution_date_label) ? actor.dissolution_date_label[0] : actor?.dissolution_date_label;
  // For groups: use dissolution; for individuals: use death
  const endDate = isGroup ? dissolutionDate : deathDate;
  const endDateLabel = isGroup ? "Dissolution Date" : "Death Date";
  const gender = actor?.gender;
  const activities = actor?.activity?.split('|').filter(Boolean) || [];
  
  // Labels change based on entity type
  const dateLabel = isGroup ? "Foundation Date" : "Birth Date";
  const placeLabel = isGroup ? "Foundation Place" : "Birth Place";
  
  // Only render if there's actual data
  if (!originDate && !originPlace && !endDate && !gender && activities.length === 0) return null;
  
  return (
    <section>
      <SectionHeader title={isGroup ? "Group Information" : "Biographical Information"} colorClass="bg-indigo-500" />
      <SectionWrapper>
        <div className="grid gap-4">
          <div className="space-y-4">
            {/* Basic Info */}
            <div className="grid sm:grid-cols-2 gap-4">
              {!isGroup && gender && (
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-gray-500 uppercase">Gender</span>
                  <span className="text-gray-900">{cleanLabel(gender)}</span>
                </div>
              )}
              {originDate && (
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-gray-500 uppercase">{dateLabel}</span>
                  <span className="text-gray-900">{cleanLabel(originDate)}</span>
                </div>
              )}
            </div>
            
            {((!isGroup && gender) || originDate) && (originPlace || endDate) && <hr className="border-gray-100" />}
            
            {/* Location & End Date */}
            <div className="grid sm:grid-cols-2 gap-4">
              {originPlace && (
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-gray-500 uppercase">{placeLabel}</span>
                  <span className="text-gray-900">
                    {originPlaceUri ? (
                      <EntityLink label={cleanLabel(originPlace)} uri={originPlaceUri} fallbackType="site" className="text-indigo-600 hover:text-indigo-800 hover:underline" />
                    ) : (
                      cleanLabel(originPlace)
                    )}
                  </span>
                </div>
              )}
              {endDate && (
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-gray-500 uppercase">{endDateLabel}</span>
                  <span className="text-gray-900">{cleanLabel(endDate)}</span>
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

interface ActorResidenceProps {
  actorData: ActorData[];
}

export function ActorResidence({ actorData }: ActorResidenceProps) {
  if (!actorData || actorData.length === 0) return null;
  
  const actor = actorData[0];
  const address = actor?.residence_address;
  const lat = actor?.residence_lat;
  const long = actor?.residence_long;
  
  if (!address && !lat) return null;
  
  return (
    <section>
      <SectionHeader title="Place of Residence" colorClass="bg-teal-500" />
      <SectionWrapper>
        <div className="space-y-4">
          {address && (
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-gray-500 uppercase">Address</span>
              <span className="text-gray-900">{address}</span>
            </div>
          )}
        </div>
      </SectionWrapper>
    </section>
  );
}

interface CollaboratorsData {
  persons?: LinkedEntity[];
  institutions?: LinkedEntity[];
}

interface ActorCollaboratorsProps {
  collaborators: CollaboratorsData;
}

export function ActorCollaborators({ collaborators }: ActorCollaboratorsProps) {
  const hasPersons = collaborators?.persons && collaborators.persons.length > 0;
  const hasInstitutions = collaborators?.institutions && collaborators.institutions.length > 0;
  
  if (!hasPersons && !hasInstitutions) return null;
  
  return (
    <SidebarCard title="Collaborators">
      <DefinitionList>
        {hasPersons && (
          <EntityList 
            label="Persons" 
            entities={collaborators.persons!} 
            colorClass="text-indigo-600 hover:text-indigo-800"
            fallbackType="actant"
          />
        )}
        {hasInstitutions && (
          <EntityList 
            label="Institutions" 
            entities={collaborators.institutions!} 
            colorClass="text-green-600 hover:text-green-800"
            fallbackType="institution"
          />
        )}
      </DefinitionList>
    </SidebarCard>
  );
}

interface ActorExecutivePositionsProps {
  positions: LinkedEntity[];
}

export function ActorExecutivePositions({ positions }: ActorExecutivePositionsProps) {
  if (!positions || positions.length === 0) return null;
  
  return (
    <SidebarCard title="Executive Positions">
      <DefinitionList>
        <EntityList 
          label="Institutions" 
          entities={positions} 
          colorClass="text-amber-600 hover:text-amber-800"
          fallbackType="institution"
        />
      </DefinitionList>
    </SidebarCard>
  );
}
