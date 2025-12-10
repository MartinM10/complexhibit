import { 
  getDataProperties, 
  getRolesPlayed, 
  getTypesFromId, 
  fetchFromApi,
  getParticipants,
  getArtworks,
  getExhibitionMaking,
  getDatesAndPlace,
  getActorDetails,
  getArtworkDetails
} from "@/lib/api";
import { unCamel, cleanLabel } from "@/lib/utils";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Suspense } from 'react';
import MapSection from '@/components/MapSection';

interface PageProps {
  params: Promise<{ type: string; id: string }>;
}

// Helper to extract entity ID from URI for frontend links
function getEntityLink(uri: string): { type: string; id: string } | null {
  if (!uri) return null;
  
  // Handle URIs like https://w3id.org/OntoExhibit#human_actant/abc123
  const hashParts = uri.split('#');
  if (hashParts.length < 2) return null;
  
  const pathPart = hashParts[1]; // human_actant/abc123 or exhibition/abc123
  const segments = pathPart.split('/');
  if (segments.length < 2) return null;
  
  const entityType = segments[0].toLowerCase();
  const id = segments.slice(1).join('/'); // Handle IDs that might contain slashes
  
  // Map ontology types to frontend routes
  const typeMap: Record<string, string> = {
    'human_actant': 'actor',
    'exhibition': 'exhibition',
    'work_manifestation': 'artwork',
    'institution': 'institution',
    'museum': 'institution',
    'cultural_institution': 'institution',
    'art_center': 'institution',
    'site': 'institution',
    'exhibitionspace': 'institution',
    'library': 'institution',
    'foundation_(institution)': 'institution',
    'university': 'institution',
    'educational_institution': 'institution',
    'interpretation_center': 'institution',
    'cultural_center': 'institution',
    'group': 'actor',
    'person': 'actor',
    'territorialentity': 'site',
    'territorial_entity': 'site',
  };
  
  return { 
    type: typeMap[entityType] || entityType, 
    id: id || '' 
  };
}

// Parse "label:::uri" format into objects with label and uri
function parseLinkedEntities(value: string | undefined): Array<{ label: string; uri: string | null }> {
  if (!value) return [];
  
  return value.split('|').filter(Boolean).map(item => {
    if (item.includes(':::')) {
      const [label, uri] = item.split(':::');
      return { label: label.trim(), uri: uri?.trim() || null };
    }
    return { label: item.trim(), uri: null };
  });
}

// Component to render a linked entity
function LinkedEntity({ 
  label, 
  uri, 
  fallbackType = 'actor',
  className = "hover:text-indigo-600 hover:underline"
}: { 
  label: string; 
  uri: string | null; 
  fallbackType?: string;
  className?: string;
}) {
  if (!uri) {
    return <span>{cleanLabel(label)}</span>;
  }
  
  const link = getEntityLink(uri);
  if (!link) {
    return <span>{cleanLabel(label)}</span>;
  }
  
  return (
    <Link 
      href={`/detail/${link.type}/${link.id}`} 
      className={className}
    >
      {cleanLabel(label)}
    </Link>
  );
}

export default async function DetailPage({ params }: PageProps) {
  const { type, id } = await params;
  const decodedType = decodeURIComponent(type);
  
  // Parallel data fetching
  const dataPropertiesPromise = getDataProperties(decodedType, id).catch(() => null);
  const typesPromise = getTypesFromId(decodedType, id).catch(() => null);
  const rolesPromise = (decodedType === 'actor' || decodedType === 'human_actant' || decodedType === 'person') 
    ? getRolesPlayed(decodedType, id).catch(() => null) 
    : Promise.resolve(null as any);
  
  // Specific fetches based on type
  let participantsPromise = Promise.resolve(null as any);
  let artworksPromise = Promise.resolve(null as any);
  let makingPromise = Promise.resolve(null as any);
  let datesAndPlacePromise = Promise.resolve(null as any);
  
  if (decodedType === 'exhibition') {
    participantsPromise = getParticipants(id).catch(() => null);
    artworksPromise = getArtworks(id).catch(() => null);
    makingPromise = getExhibitionMaking(id).catch(() => null);
    datesAndPlacePromise = getDatesAndPlace(id).catch(() => null);
  }

  const actorDetailsPromise = (decodedType === 'actor' || decodedType === 'human_actant') ? getActorDetails(id).catch(() => null) : Promise.resolve(null as any);
  const artworkDetailsPromise = (decodedType === 'artwork' || decodedType === 'obra') ? getArtworkDetails(id).catch(() => null) : Promise.resolve(null as any);

  const [dataProperties, types, roles, participants, artworks, making, datesAndPlace, actorDetails, artworkDetails] = await Promise.all([
    dataPropertiesPromise,
    typesPromise,
    rolesPromise,
    participantsPromise,
    artworksPromise,
    makingPromise,
    datesAndPlacePromise,
    actorDetailsPromise,
    artworkDetailsPromise
  ]);

  const rawProperties = dataProperties?.data || {};
  const roleData = roles?.data || {};
  const participantData = participants?.data || {};
  const artworkData = artworks?.data?.exposed || [];
  const makingData = making?.data || {};
  const datesAndPlaceData = datesAndPlace?.data || [];
  const actorData = actorDetails?.data || [];
  const artworkDetailData = artworkDetails?.data || [];

  // For exhibitions, use datesAndPlace data as the primary properties since 
  // /get_exhibition/{id} returns structured data with all relevant info
  // We search for the exhibition matching our ID in case the backend returns multiple
  const exhibitionData = decodedType === 'exhibition' && datesAndPlaceData.length > 0 
    ? (datesAndPlaceData.find((item: any) => item.uri?.includes(id)) || datesAndPlaceData[0])
    : null;
  
  // Use exhibition data if available, otherwise fall back to raw properties
  const properties = exhibitionData 
    ? { label: exhibitionData.label, ...exhibitionData }
    : (Array.isArray(rawProperties) && rawProperties.length > 0 ? rawProperties[0] : rawProperties);

  // Parse linked entities from exhibition data
  const curators = parseLinkedEntities(exhibitionData?.curators);
  const organizers = parseLinkedEntities(exhibitionData?.organizers);
  const funders = parseLinkedEntities(exhibitionData?.funders);
  const lenders = parseLinkedEntities(exhibitionData?.lenders);
  const exhibitors = parseLinkedEntities(exhibitionData?.exhibitors);
  const displayedArtworks = parseLinkedEntities(exhibitionData?.artworks);

  // Helper to extract label
  const getLabel = () => {
    // For exhibitions, try exhibitionData first
    if (exhibitionData?.label) {
      return cleanLabel(exhibitionData.label);
    }
    
    // Try to find a label in properties
    for (const key in properties) {
        if (key.toLowerCase().includes('label') || key.toLowerCase().includes('title') || key.toLowerCase().includes('name')) {
            const val = properties[key];
            return cleanLabel(typeof val === 'object' && val !== null ? val.label || val.value : val);
        }
    }
    return `${unCamel(decodedType)} Details`;
  };

  const label = getLabel();

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <Link href={`/all/${type}`} className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 mb-4 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to list
        </Link>
        
        <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-10 text-white">
                <div className="flex items-center gap-3 mb-2 opacity-90">
                    <span className="uppercase tracking-wider text-xs font-bold bg-white/20 px-3 py-1 rounded-full">{unCamel(decodedType)}</span>
                    <span className="text-xs font-mono bg-black/20 px-3 py-1 rounded-full truncate max-w-[200px]" title={id}>{id}</span>
                </div>
                <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl mb-2">
                    {label}
                </h1>
            </div>

            <div className="px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    <div className="lg:col-span-1 space-y-8">
                        {/* ARTWORK: Production Details in Left Column */}
                        {(decodedType === 'artwork' || decodedType === 'obra') && artworkDetailData.length > 0 && (() => {
                            const artwork = artworkDetailData[0];
                            // Handle both GROUP_CONCAT format (authors) and flat format (author, author_uri)
                            let authors = parseLinkedEntities(artwork?.authors);
                            if (authors.length === 0 && artwork?.author && artwork?.author_uri) {
                                authors = [{ label: artwork.author, uri: artwork.author_uri }];
                            }
                            let owners = parseLinkedEntities(artwork?.owners);
                            if (owners.length === 0 && artwork?.owner && artwork?.owner_uri) {
                                owners = [{ label: artwork.owner, uri: artwork.owner_uri }];
                            }
                            let exhibitions = parseLinkedEntities(artwork?.exhibitions);
                            if (exhibitions.length === 0 && artwork?.exhibition && artwork?.exhibition_uri) {
                                exhibitions = [{ label: artwork.exhibition, uri: artwork.exhibition_uri }];
                            }
                            const types = artwork?.type?.split('|').filter(Boolean) || [];
                            const topics = artwork?.topic?.split('|').filter(Boolean) || [];
                            
                            return (
                                <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Artwork Information</h3>
                                    <dl className="space-y-4">
                                        {authors.length > 0 && (
                                            <div>
                                                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Author(s)</dt>
                                                <dd className="mt-1 space-y-1">
                                                    {authors.map((a, i) => (
                                                        <div key={i} className="text-sm text-gray-900 font-medium">
                                                            <LinkedEntity label={a.label} uri={a.uri} className="text-amber-600 hover:text-amber-800 hover:underline" />
                                                        </div>
                                                    ))}
                                                </dd>
                                            </div>
                                        )}
                                        {owners.length > 0 && (
                                            <div>
                                                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Owner(s)</dt>
                                                <dd className="mt-1 space-y-1">
                                                    {owners.map((o, i) => (
                                                        <div key={i} className="text-sm text-gray-900 font-medium">
                                                            <LinkedEntity label={o.label} uri={o.uri} className="text-emerald-600 hover:text-emerald-800 hover:underline" />
                                                        </div>
                                                    ))}
                                                </dd>
                                            </div>
                                        )}
                                        {artwork?.label_starting_date && (
                                            <div>
                                                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Creation Date</dt>
                                                <dd className="mt-1 text-sm text-gray-900 font-medium">{artwork.label_starting_date}</dd>
                                            </div>
                                        )}
                                        {types.length > 0 && (
                                            <div>
                                                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Type</dt>
                                                <dd className="mt-1 flex flex-wrap gap-1">
                                                    {types.map((t: string, i: number) => (
                                                        <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                                                            {cleanLabel(t)}
                                                        </span>
                                                    ))}
                                                </dd>
                                            </div>
                                        )}
                                        {topics.length > 0 && (
                                            <div>
                                                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Topics</dt>
                                                <dd className="mt-1 flex flex-wrap gap-1">
                                                    {topics.map((t: string, i: number) => (
                                                        <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                                            {cleanLabel(t)}
                                                        </span>
                                                    ))}
                                                </dd>
                                            </div>
                                        )}
                                        {exhibitions.length > 0 && (
                                            <div>
                                                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Displayed At</dt>
                                                <dd className="mt-1 space-y-1">
                                                    {exhibitions.map((e, i) => (
                                                        <div key={i} className="text-sm text-gray-900 font-medium">
                                                            <LinkedEntity label={e.label} uri={e.uri} fallbackType="exhibition" className="text-indigo-600 hover:text-indigo-800 hover:underline" />
                                                        </div>
                                                    ))}
                                                </dd>
                                            </div>
                                        )}
                                    </dl>
                                </div>
                            );
                        })()}

                        {/* ACTOR: Biographical Info in Left Column - only show if has data */}
                        {(decodedType === 'actor' || decodedType === 'human_actant' || decodedType === 'person') && actorData.length > 0 && (() => {
                            const actor = actorData[0];
                            // Check for real data (not empty arrays)
                            const birthDate = Array.isArray(actor?.label_date) ? actor.label_date[0] : actor?.label_date;
                            const birthPlace = Array.isArray(actor?.label_place) ? actor.label_place[0] : actor?.label_place;
                            const placeUri = Array.isArray(actor?.place_uri) ? actor.place_uri[0] : actor?.place_uri;
                            const deathDate = Array.isArray(actor?.death_date) ? actor.death_date[0] : actor?.death_date;
                            const gender = actor?.gender;
                            const activities = actor?.activity?.split('|').filter(Boolean) || [];
                            
                            // Only render if there's actual data
                            if (!birthDate && !birthPlace && !deathDate && !gender && activities.length === 0) return null;
                            
                            return (
                                <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Biographical Information</h3>
                                    <dl className="space-y-4">
                                        {gender && (
                                            <div>
                                                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Gender</dt>
                                                <dd className="mt-1 text-sm text-gray-900 font-medium">{cleanLabel(gender)}</dd>
                                            </div>
                                        )}
                                        {birthDate && (
                                            <div>
                                                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Birth Date</dt>
                                                <dd className="mt-1 text-sm text-gray-900 font-medium">{cleanLabel(birthDate)}</dd>
                                            </div>
                                        )}
                                        {birthPlace && (
                                            <div>
                                                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Birth Place</dt>
                                                <dd className="mt-1 text-sm text-gray-900 font-medium">
                                                    {placeUri ? (
                                                        <LinkedEntity label={cleanLabel(birthPlace)} uri={placeUri} fallbackType="site" className="text-blue-600 hover:text-blue-800 hover:underline" />
                                                    ) : (
                                                        cleanLabel(birthPlace)
                                                    )}
                                                </dd>
                                            </div>
                                        )}
                                        {deathDate && (
                                            <div>
                                                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Death Date</dt>
                                                <dd className="mt-1 text-sm text-gray-900 font-medium">{cleanLabel(deathDate)}</dd>
                                            </div>
                                        )}
                                        {activities.length > 0 && (
                                            <div>
                                                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Activity</dt>
                                                <dd className="mt-1 flex flex-wrap gap-1">
                                                    {activities.map((a: string, i: number) => (
                                                        <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                                            {cleanLabel(a)}
                                                        </span>
                                                    ))}
                                                </dd>
                                            </div>
                                        )}
                                    </dl>
                                </div>
                            );
                        })()}

                        {/* INSTITUTION: Location Info in Left Column */}
                        {decodedType === 'institution' && rawProperties && (() => {
                            const institution = Array.isArray(rawProperties) ? rawProperties[0] : rawProperties;
                            return (
                                <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Institution Information</h3>
                                    <dl className="space-y-4">
                                        {institution?.apelation && (
                                            <div>
                                                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Also Known As</dt>
                                                <dd className="mt-1 text-sm text-gray-900 font-medium">{cleanLabel(institution.apelation)}</dd>
                                            </div>
                                        )}
                                        {institution?.label_place && (
                                            <div>
                                                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Location</dt>
                                                <dd className="mt-1 text-sm text-gray-900 font-medium">
                                                    {institution.place_uri ? (
                                                        <LinkedEntity label={institution.label_place} uri={institution.place_uri} fallbackType="site" className="text-teal-600 hover:text-teal-800 hover:underline" />
                                                    ) : (
                                                        cleanLabel(institution.label_place)
                                                    )}
                                                </dd>
                                            </div>
                                        )}
                                    </dl>
                                </div>
                            );
                        })()}

                        {/* Exhibition Linked Entities - Left Column */}
                        {decodedType === 'exhibition' && (curators.length > 0 || organizers.length > 0 || funders.length > 0 || lenders.length > 0 || exhibitors.length > 0) && (
                            <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">People & Organizations</h3>
                                <dl className="space-y-4">
                                    {exhibitors.length > 0 && (
                                        <div>
                                            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Exhibiting Artists</dt>
                                            <dd className="mt-1 space-y-1">
                                                {exhibitors.map((e, i) => (
                                                    <div key={i} className="text-sm text-gray-900 font-medium">
                                                        <LinkedEntity label={e.label} uri={e.uri} className="text-pink-600 hover:text-pink-800 hover:underline" />
                                                    </div>
                                                ))}
                                            </dd>
                                        </div>
                                    )}
                                    {curators.length > 0 && (
                                        <div>
                                            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Curators</dt>
                                            <dd className="mt-1 space-y-1">
                                                {curators.map((c, i) => (
                                                    <div key={i} className="text-sm text-gray-900 font-medium">
                                                        <LinkedEntity label={c.label} uri={c.uri} className="text-indigo-600 hover:text-indigo-800 hover:underline" />
                                                    </div>
                                                ))}
                                            </dd>
                                        </div>
                                    )}
                                    {organizers.length > 0 && (
                                        <div>
                                            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Organizers</dt>
                                            <dd className="mt-1 space-y-1">
                                                {organizers.map((o, i) => (
                                                    <div key={i} className="text-sm text-gray-900 font-medium">
                                                        <LinkedEntity label={o.label} uri={o.uri} className="text-indigo-600 hover:text-indigo-800 hover:underline" />
                                                    </div>
                                                ))}
                                            </dd>
                                        </div>
                                    )}
                                    {funders.length > 0 && (
                                        <div>
                                            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Funders</dt>
                                            <dd className="mt-1 space-y-1">
                                                {funders.map((f, i) => (
                                                    <div key={i} className="text-sm text-gray-900 font-medium">
                                                        <LinkedEntity label={f.label} uri={f.uri} className="text-green-600 hover:text-green-800 hover:underline" />
                                                    </div>
                                                ))}
                                            </dd>
                                        </div>
                                    )}
                                    {lenders.length > 0 && (
                                        <div>
                                            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Lenders</dt>
                                            <dd className="mt-1 space-y-1">
                                                {lenders.map((l, i) => (
                                                    <div key={i} className="text-sm text-gray-900 font-medium">
                                                        <LinkedEntity label={l.label} uri={l.uri} className="text-purple-600 hover:text-purple-800 hover:underline" />
                                                    </div>
                                                ))}
                                            </dd>
                                        </div>
                                    )}
                                </dl>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Relationships */}
                    <div className="lg:col-span-2 space-y-10">
                        
                        {/* Roles Played by Actors */}
                        {Object.keys(roleData).length > 0 && (
                            <section>
                                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                    <span className="w-2 h-8 bg-indigo-500 rounded-full"></span>
                                    Roles Played
                                </h3>
                                <div className="grid gap-6 sm:grid-cols-2">
                                    {Object.entries(roleData).map(([role, items]: [string, any]) => (
                                        <div key={role} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-5">
                                            <h4 className="font-semibold text-indigo-700 mb-3 text-lg border-b border-gray-100 pb-2">{unCamel(role)}</h4>
                                            <ul className="space-y-2">
                                                {Array.isArray(items) && items.map((item: any, idx: number) => (
                                                    <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                                                        <span className="text-indigo-400 mt-1">•</span>
                                                        <Link href={`/detail/exhibition/${item.uri?.split('/').pop()}`} className="hover:text-indigo-600 hover:underline">
                                                            {cleanLabel(item.label || item.uri)}
                                                        </Link>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Participants (Exhibitions) */}
                        {Object.keys(participantData).length > 0 && (
                            <section>
                                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                    <span className="w-2 h-8 bg-purple-500 rounded-full"></span>
                                    Participants
                                </h3>
                                <div className="grid gap-6 sm:grid-cols-2">
                                    {Object.entries(participantData).map(([role, items]: [string, any]) => (
                                        <div key={role} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-5">
                                            <h4 className="font-semibold text-purple-700 mb-3 text-lg border-b border-gray-100 pb-2">{unCamel(role)}</h4>
                                            <ul className="space-y-2">
                                                {Array.isArray(items) && items.map((item: any, idx: number) => (
                                                    <li key={idx}>
                                                        <Link href={`/detail/actor/${item.uri?.split('/').pop()}`} className="text-sm text-gray-700 hover:text-purple-600 hover:underline flex items-start gap-2">
                                                            <span className="text-purple-400 mt-1">•</span>
                                                            <span>{cleanLabel(item.label || item.uri)}</span>
                                                        </Link>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Exhibition Making (Exhibitions) */}
                        {Object.keys(makingData).length > 0 && (
                            <section>
                                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                    <span className="w-2 h-8 bg-orange-500 rounded-full"></span>
                                    Exhibition Making
                                </h3>
                                <div className="grid gap-6 sm:grid-cols-2">
                                    {Object.entries(makingData).map(([role, items]: [string, any]) => (
                                        <div key={role} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-5">
                                            <h4 className="font-semibold text-orange-700 mb-3 text-lg border-b border-gray-100 pb-2">{unCamel(role)}</h4>
                                            <ul className="space-y-2">
                                                {Array.isArray(items) && items.map((item: any, idx: number) => (
                                                    <li key={idx}>
                                                        <Link href={`/detail/actor/${item.uri?.split('/').pop()}`} className="text-sm text-gray-700 hover:text-orange-600 hover:underline flex items-start gap-2">
                                                            <span className="text-orange-400 mt-1">•</span>
                                                            <span>{cleanLabel(item.label || item.uri)}</span>
                                                        </Link>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Exhibition Details (Exhibitions) */}
                        {datesAndPlaceData.length > 0 && (
                            <section>
                                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                    <span className="w-2 h-8 bg-green-500 rounded-full"></span>
                                    Exhibition Details
                                </h3>
                                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                                    <div className="grid gap-4">
                                        {datesAndPlaceData.map((item: any, idx: number) => (
                                            <div key={idx} className="space-y-3">
                                                {/* Dates */}
                                                <div className="grid sm:grid-cols-2 gap-4">
                                                    {item.label_starting_date && (
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-semibold text-gray-500 uppercase">Opening Date</span>
                                                            <span className="text-gray-900">{item.label_starting_date}</span>
                                                        </div>
                                                    )}
                                                    {item.label_ending_date && (
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-semibold text-gray-500 uppercase">Closing Date</span>
                                                            <span className="text-gray-900">{item.label_ending_date}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Separator if needed */}
                                                {(item.label_starting_date || item.label_ending_date) && <hr className="border-gray-100" />}

                                                {/* Location (takesPlaceAt) */}
                                                {item.label_place && (
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-semibold text-gray-500 uppercase">Location</span>
                                                        <span className="text-gray-900">
                                                            {item.place_uri ? (
                                                                <LinkedEntity 
                                                                    label={item.label_place} 
                                                                    uri={item.place_uri} 
                                                                    fallbackType="site"
                                                                    className="text-indigo-600 hover:text-indigo-800 hover:underline"
                                                                />
                                                            ) : (
                                                                cleanLabel(item.label_place)
                                                            )}
                                                        </span>
                                                    </div>
                                                )}

                                                {/* Venue (hasVenue) */}
                                                {item.venue_label && (
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-semibold text-gray-500 uppercase">Venue</span>
                                                        <span className="text-gray-900">
                                                            {item.venue_uri ? (
                                                                <LinkedEntity 
                                                                    label={item.venue_label} 
                                                                    uri={item.venue_uri} 
                                                                    fallbackType="institution"
                                                                    className="text-indigo-600 hover:text-indigo-800 hover:underline"
                                                                />
                                                            ) : (
                                                                cleanLabel(item.venue_label)
                                                            )}
                                                        </span>
                                                    </div>
                                                )}

                                                {/* Access */}
                                                {item.access && (
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-semibold text-gray-500 uppercase">Access</span>
                                                        <span className="text-gray-900">{item.access}</span>
                                                    </div>
                                                )}

                                                {/* Theme & Type */}
                                                <div className="grid sm:grid-cols-2 gap-4">
                                                    {item.theme_label && (
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-semibold text-gray-500 uppercase">Themes</span>
                                                            <div className="flex flex-wrap gap-1 mt-1">
                                                                {item.theme_label.split('|').map((t: string, i: number) => (
                                                                    <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                                                                        {cleanLabel(t)}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                    {item.type_label && (
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-semibold text-gray-500 uppercase">Types</span>
                                                            <div className="flex flex-wrap gap-1 mt-1">
                                                                {item.type_label.split('|').map((t: string, i: number) => (
                                                                    <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                                                        {cleanLabel(t)}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Interactive Map */}
                                                {(item.lat && item.long) && (
                                                    <div className="mt-4">
                                                        <span className="text-xs font-semibold text-gray-500 uppercase mb-3 block">Location</span>
                                                        <MapSection 
                                                            lat={parseFloat(item.lat)} 
                                                            long={parseFloat(item.long)} 
                                                            label={item.venue_label || item.label_place || label}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* Artworks Displayed (from exhibition query) */}
                        {displayedArtworks.length > 0 && (
                            <section>
                                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                    <span className="w-2 h-8 bg-pink-500 rounded-full"></span>
                                    Artworks Displayed
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {displayedArtworks.map((artwork, idx) => (
                                        <div key={idx} className="group block bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all p-4 hover:border-pink-300">
                                            <div className="font-medium text-gray-900 group-hover:text-pink-600 transition-colors">
                                                <LinkedEntity 
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

                        {/* Artworks (from separate API - fallback) */}
                        {displayedArtworks.length === 0 && Object.keys(artworkData).length > 0 && (
                            <section>
                                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                    <span className="w-2 h-8 bg-pink-500 rounded-full"></span>
                                    Artworks Exposed
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {Object.entries(artworkData).map(([role, items]: [string, any]) => (
                                        Array.isArray(items) && items.map((item: any, idx: number) => (
                                            <Link key={idx} href={`/detail/artwork/${item.uri?.split('/').pop()}`} className="group block bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all p-4 hover:border-pink-300">
                                                <div className="font-medium text-gray-900 group-hover:text-pink-600 transition-colors">
                                                    {cleanLabel(item.label || "Untitled")}
                                                </div>
                                                <div className="text-xs text-gray-400 mt-1 truncate">{item.uri}</div>
                                            </Link>
                                        ))
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
