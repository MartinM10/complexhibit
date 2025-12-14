/**
 * Dynamic detail page for various entity types.
 * 
 * Handles exhibitions, artworks, actors/persons, and institutions.
 * Uses entity-specific components extracted to src/components/detail/
 */

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { 
  getDataProperties, 
  getRolesPlayed, 
  getTypesFromId, 
  getParticipants,
  getArtworks,
  getExhibitionMaking,
  getDatesAndPlace,
  getActorDetails,
  getArtworkDetails
} from "@/lib/api";
import { unCamel, cleanLabel } from "@/lib/utils";
import MapSection from '@/components/MapSection';
import { CopyUri } from "@/components/CopyUri";
import QueryLogger from "@/components/QueryLogger";
import EntityLink from "@/components/EntityLink";

// Import entity-specific components
import {
  parseLinkedEntities,
  SectionHeader,
  ExhibitionSidebar,
  ExhibitionDetails,
  ParticipantsSection,
  ActorRolesSidebar,
  ActorBiography,
  ArtworkRelationsSidebar,
  ArtworkDetails,
  InstitutionSidebar,
} from "@/components/detail";

interface PageProps {
  params: Promise<{ type: string; id: string }>;
}

// Helper type guards
const isActorType = (type: string) => 
  ['actor', 'human_actant', 'person'].includes(type);

const isArtworkType = (type: string) => 
  ['artwork', 'obra'].includes(type);

export default async function DetailPage({ params }: PageProps) {
  const { type, id } = await params;
  const decodedType = decodeURIComponent(type);
  
  // ====================
  // Data Fetching
  // ====================
  
  // Base fetches (always needed)
  const dataPropertiesPromise = getDataProperties(decodedType, id).catch(() => null);
  const typesPromise = getTypesFromId(decodedType, id).catch(() => null);
  
  // Actor-specific
  const rolesPromise = isActorType(decodedType) 
    ? getRolesPlayed(decodedType, id).catch(() => null) 
    : Promise.resolve(null);
  const actorDetailsPromise = isActorType(decodedType) 
    ? getActorDetails(id).catch(() => null) 
    : Promise.resolve(null);
  
  // Artwork-specific
  const artworkDetailsPromise = isArtworkType(decodedType) 
    ? getArtworkDetails(id).catch(() => null) 
    : Promise.resolve(null);
  
  // Exhibition-specific
  const participantsPromise = decodedType === 'exhibition' 
    ? getParticipants(id).catch(() => null) 
    : Promise.resolve(null);
  const artworksPromise = decodedType === 'exhibition' 
    ? getArtworks(id).catch(() => null) 
    : Promise.resolve(null);
  const makingPromise = decodedType === 'exhibition' 
    ? getExhibitionMaking(id).catch(() => null) 
    : Promise.resolve(null);
  const datesAndPlacePromise = decodedType === 'exhibition' 
    ? getDatesAndPlace(id).catch(() => null) 
    : Promise.resolve(null);

  // Await all promises
  const [
    dataProperties, types, roles, actorDetails, artworkDetails,
    participants, artworks, making, datesAndPlace
  ] = await Promise.all([
    dataPropertiesPromise,
    typesPromise,
    rolesPromise,
    actorDetailsPromise,
    artworkDetailsPromise,
    participantsPromise,
    artworksPromise,
    makingPromise,
    datesAndPlacePromise
  ]);

  // ====================
  // Data Processing
  // ====================
  
  const rawProperties = dataProperties?.data || {};
  const roleData = roles?.data || {};
  const participantData = participants?.data || {};
  const artworkData = (artworks?.data as any)?.exposed || [];
  const makingData = making?.data || {};
  const datesAndPlaceData = datesAndPlace?.data || [];
  const actorData = actorDetails?.data || [];
  const artworkDetailData = artworkDetails?.data || [];

  // Debug query for QueryLogger
  const debugQuery = decodedType === 'exhibition' 
    ? datesAndPlace?.sparql 
    : (isArtworkType(decodedType) 
      ? (artworkDetails?.sparql || dataProperties?.sparql)
      : (isActorType(decodedType) 
        ? (actorDetails?.sparql || dataProperties?.sparql)
        : dataProperties?.sparql));

  // For exhibitions, find matching data
  const exhibitionData = decodedType === 'exhibition' && datesAndPlaceData.length > 0 
    ? (datesAndPlaceData.find((item: any) => item.uri?.includes(id)) || datesAndPlaceData[0])
    : null;
  
  // Properties with fallback
  const properties = exhibitionData 
    ? { label: exhibitionData.label, ...exhibitionData }
    : (Array.isArray(rawProperties) && rawProperties.length > 0 ? rawProperties[0] : rawProperties);

  // Parse linked entities for exhibitions
  const curators = parseLinkedEntities(exhibitionData?.curators);
  const organizers = parseLinkedEntities(exhibitionData?.organizers);
  const funders = parseLinkedEntities(exhibitionData?.funders);
  const lenders = parseLinkedEntities(exhibitionData?.lenders);
  const exhibitors = parseLinkedEntities(exhibitionData?.exhibitors);
  const displayedArtworks = parseLinkedEntities(exhibitionData?.artworks);

  // ====================
  // Label Extraction
  // ====================
  
  const getLabel = (): string => {
    if (exhibitionData?.label) return cleanLabel(exhibitionData.label);
    if (isActorType(decodedType) && actorData[0]?.label) return cleanLabel(actorData[0].label);
    if (isArtworkType(decodedType) && artworkDetailData[0]?.label) return cleanLabel(artworkDetailData[0].label);
    
    for (const key in properties) {
      if (key.toLowerCase().includes('label') || key.toLowerCase().includes('title') || key.toLowerCase().includes('name')) {
        const val = properties[key];
        return cleanLabel(typeof val === 'object' && val !== null ? val.label || val.value : val);
      }
    }
    return `${unCamel(decodedType)} Details`;
  };

  const label = getLabel();
  const fullUri = properties.uri || `https://w3id.org/OntoExhibit#${decodedType}/${id}`;

  // ====================
  // Render
  // ====================
  
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <QueryLogger query={debugQuery} type={decodedType} />
      
      <div className="mb-8">
        <Link href={`/all/${type}`} className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 mb-4 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to list
        </Link>

        <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-10 text-white">
            <div className="flex flex-col gap-3 mb-4">
              <div className="flex items-center gap-3 opacity-90">
                <span className="uppercase tracking-wider text-xs font-bold bg-white/20 px-3 py-1 rounded-full">
                  {unCamel(decodedType)}
                </span>
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">{label}</h1>
              <div className="mt-2">
                <CopyUri uri={fullUri} label="URI" />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-8 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              
              {/* Left Column: Sidebar */}
              <div className="lg:col-span-1 space-y-8">
                {isArtworkType(decodedType) && (
                  <ArtworkRelationsSidebar artworkData={artworkDetailData} />
                )}
                
                {isActorType(decodedType) && (
                  <ActorRolesSidebar roleData={roleData} />
                )}
                
                {decodedType === 'institution' && (
                  <InstitutionSidebar data={rawProperties} />
                )}
                
                {decodedType === 'exhibition' && (
                  <ExhibitionSidebar 
                    curators={curators}
                    organizers={organizers}
                    funders={funders}
                    lenders={lenders}
                    exhibitors={exhibitors}
                  />
                )}
              </div>

              {/* Right Column: Main Content */}
              <div className="lg:col-span-2 space-y-10">
                {/* Actor Biography */}
                {isActorType(decodedType) && (
                  <ActorBiography actorData={actorData} />
                )}
                
                {/* Artwork Details */}
                {isArtworkType(decodedType) && (
                  <ArtworkDetails artworkData={artworkDetailData} />
                )}
                
                {/* Exhibition Sections */}
                {decodedType === 'exhibition' && (
                  <>
                    <ParticipantsSection 
                      data={participantData} 
                      title="Participants" 
                      colorClass="bg-purple-500" 
                      linkColorClass="hover:text-purple-600" 
                    />
                    
                    <ParticipantsSection 
                      data={makingData} 
                      title="Exhibition Making" 
                      colorClass="bg-orange-500" 
                      linkColorClass="hover:text-orange-600" 
                    />
                    
                    <ExhibitionDetails data={datesAndPlaceData} />
                    
                    {/* Map */}
                    {exhibitionData?.lat && exhibitionData?.long && (
                      <section>
                        <SectionHeader title="Location" colorClass="bg-teal-500" />
                        <MapSection 
                          lat={parseFloat(exhibitionData.lat)} 
                          long={parseFloat(exhibitionData.long)} 
                          label={exhibitionData.venue_label || exhibitionData.label_place || label}
                        />
                      </section>
                    )}
                    
                    {/* Artworks Displayed */}
                    {displayedArtworks.length > 0 && (
                      <section>
                        <SectionHeader title="Artworks Displayed" colorClass="bg-pink-500" />
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {displayedArtworks.map((artwork, idx) => (
                            <div key={idx} className="group block bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all p-4 hover:border-pink-300">
                              <div className="font-medium text-gray-900 group-hover:text-pink-600 transition-colors">
                                <EntityLink 
                                  label={artwork.label} 
                                  uri={artwork.uri} 
                                  fallbackType="artwork"
                                  className="text-gray-900 hover:text-pink-600 hover:underline"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
