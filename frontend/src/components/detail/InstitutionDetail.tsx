/**
 * Institution-specific detail components.
 */

import { cleanLabel } from "@/lib/utils";
import { SidebarCard, DefinitionList, SectionWrapper, SectionHeader, PropertyRow, EntityList } from "./DetailUtils";
import EntityLink from "@/components/EntityLink";
import type { LinkedEntity } from "@/lib/types";

interface InstitutionData {
  label?: string;
  apelation?: string;
  label_place?: string;
  place_uri?: string;
  ownershipType?: string;
  email?: string;
  telephone?: string;
  uriHtml?: string;
  headquarters_address?: string;
  headquarters_lat?: string;
  headquarters_long?: string;
}

interface InstitutionDetailsProps {
  data: InstitutionData | InstitutionData[];
}

export function InstitutionDetails({ data }: InstitutionDetailsProps) {
  const institution = Array.isArray(data) ? data[0] : data;
  
  const hasData = institution && (
    institution.apelation || institution.label_place || 
    institution.ownershipType || institution.email || 
    institution.telephone || institution.uriHtml
  );
  
  if (!hasData) {
    return null;
  }
  
  return (
    <section>
      <SectionHeader title="Institution Details" colorClass="bg-green-600" />
      <SectionWrapper>
        <div className="space-y-4">
          <PropertyRow label="Alternative Name" value={institution.apelation} />
          <PropertyRow label="Ownership Type" value={institution.ownershipType} />
          
          {institution.label_place && (
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-gray-500 uppercase">Location</span>
              <span className="text-gray-900">
                {institution.place_uri ? (
                  <EntityLink 
                    label={cleanLabel(institution.label_place)} 
                    uri={institution.place_uri} 
                    fallbackType="site" 
                    className="text-teal-600 hover:text-teal-800 hover:underline" 
                  />
                ) : (
                  cleanLabel(institution.label_place)
                )}
              </span>
            </div>
          )}
          
          {/* Contact Information */}
          {(institution.email || institution.telephone || institution.uriHtml) && (
            <>
              <hr className="border-gray-100" />
              <div className="grid sm:grid-cols-2 gap-4">
                {institution.email && (
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-gray-500 uppercase">Email</span>
                    <a href={`mailto:${institution.email}`} className="text-indigo-600 hover:text-indigo-800 hover:underline">
                      {institution.email}
                    </a>
                  </div>
                )}
                {institution.telephone && (
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-gray-500 uppercase">Telephone</span>
                    <a href={`tel:${institution.telephone}`} className="text-indigo-600 hover:text-indigo-800 hover:underline">
                      {institution.telephone}
                    </a>
                  </div>
                )}
                {institution.uriHtml && (
                  <div className="flex flex-col sm:col-span-2">
                    <span className="text-xs font-semibold text-gray-500 uppercase">Website</span>
                    <a href={institution.uriHtml} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 hover:underline truncate">
                      {institution.uriHtml}
                    </a>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </SectionWrapper>
    </section>
  );
}

interface InstitutionSidebarProps {
  exhibitions?: any[];
  lenderExhibitions?: any[];
  ownedArtworks?: any[];
}

export function InstitutionSidebar({ exhibitions = [], lenderExhibitions = [], ownedArtworks = [] }: InstitutionSidebarProps) {
  const hasData = exhibitions.length > 0 || lenderExhibitions.length > 0 || ownedArtworks.length > 0;
  
  if (!hasData) return null;
  
  // Transform exhibitions to LinkedEntity format
  const hostedExhibitionEntities: LinkedEntity[] = exhibitions.map(exh => ({
    label: `${exh.label || "Untitled Exhibition"}${exh.role ? ` (${exh.role})` : ""}${exh.start_date ? ` - ${exh.start_date}` : ""}`,
    uri: exh.uri
  }));
  
  const lenderExhibitionEntities: LinkedEntity[] = lenderExhibitions.map(exh => ({
    label: `${exh.label || "Untitled Exhibition"}${exh.start_date ? ` - ${exh.start_date}` : ""}`,
    uri: exh.uri
  }));
  
  const artworkEntities: LinkedEntity[] = ownedArtworks.map(art => ({
    label: `${art.label || "Untitled Artwork"}${art.type ? ` (${art.type})` : ""}`,
    uri: art.uri
  }));
  
  return (
    <SidebarCard title="Related Entities">
      <DefinitionList>
        {hostedExhibitionEntities.length > 0 && (
          <EntityList 
            label="Hosted/Organized Exhibitions" 
            entities={hostedExhibitionEntities} 
            colorClass="text-indigo-600 hover:text-indigo-800"
            fallbackType="exhibition"
          />
        )}
        {lenderExhibitionEntities.length > 0 && (
          <EntityList 
            label="Lender For Exhibitions" 
            entities={lenderExhibitionEntities} 
            colorClass="text-purple-600 hover:text-purple-800"
            fallbackType="exhibition"
          />
        )}
        {artworkEntities.length > 0 && (
          <EntityList 
            label="Owned Artworks" 
            entities={artworkEntities} 
            colorClass="text-pink-600 hover:text-pink-800"
            fallbackType="artwork"
          />
        )}
      </DefinitionList>
    </SidebarCard>
  );
}

interface InstitutionCollaboratorsProps {
  collaborators: LinkedEntity[];
}

export function InstitutionCollaborators({ collaborators }: InstitutionCollaboratorsProps) {
  if (!collaborators || collaborators.length === 0) return null;
  
  return (
    <SidebarCard title="Collaborating Persons">
      <DefinitionList>
        <EntityList 
          label="Persons" 
          entities={collaborators} 
          colorClass="text-indigo-600 hover:text-indigo-800"
          fallbackType="actant"
        />
      </DefinitionList>
    </SidebarCard>
  );
}

interface InstitutionHeadquartersProps {
  data: InstitutionData | InstitutionData[];
}

export function InstitutionHeadquarters({ data }: InstitutionHeadquartersProps) {
  const institution = Array.isArray(data) ? data[0] : data;
  
  if (!institution?.headquarters_address) return null;
  
  return (
    <section>
      <SectionHeader title="Headquarters" colorClass="bg-teal-600" />
      <SectionWrapper>
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-gray-500 uppercase">Address</span>
          <span className="text-gray-900">{institution.headquarters_address}</span>
        </div>
      </SectionWrapper>
    </section>
  );
}

interface InstitutionExecutivesProps {
  executives: LinkedEntity[];
}

export function InstitutionExecutives({ executives }: InstitutionExecutivesProps) {
  if (!executives || executives.length === 0) return null;
  
  return (
    <SidebarCard title="Executive Leadership">
      <DefinitionList>
        <EntityList 
          label="Executives" 
          entities={executives} 
          colorClass="text-amber-600 hover:text-amber-800"
          fallbackType="actant"
        />
      </DefinitionList>
    </SidebarCard>
  );
}
