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

interface PageProps {
  params: Promise<{ type: string; id: string }>;
}

export default async function DetailPage({ params }: PageProps) {
  const { type, id } = await params;
  const decodedType = decodeURIComponent(type);
  
  // Parallel data fetching
  const dataPropertiesPromise = getDataProperties(decodedType, id).catch(() => null);
  const typesPromise = getTypesFromId(decodedType, id).catch(() => null);
  const rolesPromise = decodedType !== 'exhibition' ? getRolesPlayed(decodedType, id).catch(() => null) : Promise.resolve(null as any);
  
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

  const properties = dataProperties?.data || {};
  const roleData = roles?.data || {};
  const participantData = participants?.data || {};
  const artworkData = artworks?.data?.exposed || [];
  const makingData = making?.data || {};
  const datesAndPlaceData = datesAndPlace?.data || [];
  const actorData = actorDetails?.data || [];
  const artworkDetailData = artworkDetails?.data || [];

  // Helper to extract label
  const getLabel = () => {
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
                    {/* Left Column: Metadata */}
                    <div className="lg:col-span-1 space-y-8">
                        <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Properties</h3>
                            <dl className="space-y-4">
                                {Object.entries(properties).map(([key, value]: [string, any]) => {
                                    if (key === 'label' || key === 'title' || key === 'name') return null;
                                    const displayValue = typeof value === 'object' && value !== null ? (value.label || value.value) : value;
                                    return (
                                        <div key={key}>
                                            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">{unCamel(key)}</dt>
                                            <dd className="mt-1 text-sm text-gray-900 font-medium break-words">{String(displayValue)}</dd>
                                        </div>
                                    );
                                })}
                            </dl>
                        </div>
                    </div>

                    {/* Right Column: Relationships */}
                    <div className="lg:col-span-2 space-y-10">
                        
                        {/* Roles Played */}
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

                        {/* Dates and Place (Exhibitions) */}
                        {datesAndPlaceData.length > 0 && (
                            <section>
                                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                    <span className="w-2 h-8 bg-green-500 rounded-full"></span>
                                    Dates & Place
                                </h3>
                                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                                    <div className="grid gap-4">
                                        {datesAndPlaceData.map((item: any, idx: number) => (
                                            <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                                                <div className="flex items-center gap-2 text-gray-700">
                                                    <span className="font-semibold text-green-700">Date:</span>
                                                    <span>{item.date}</span>
                                                </div>
                                                {item.place_label && (
                                                    <div className="flex items-center gap-2 text-gray-700">
                                                        <span className="font-semibold text-green-700">Place:</span>
                                                        <span>{cleanLabel(item.place_label)}</span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* Artworks (Exhibitions) */}
                        {Object.keys(artworkData).length > 0 && (
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

                        {/* Actor Details (Birth/Death) */}
                        {actorData.length > 0 && (
                            <section>
                                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                    <span className="w-2 h-8 bg-blue-500 rounded-full"></span>
                                    Biographical Info
                                </h3>
                                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                                    <div className="grid gap-4">
                                        {actorData.map((item: any, idx: number) => (
                                            <div key={idx} className="space-y-2">
                                                {item.birthDate && (
                                                    <div className="flex items-center gap-2 text-gray-700">
                                                        <span className="font-semibold text-blue-700">Born:</span>
                                                        <span>{item.birthDate}</span>
                                                        {item.birthPlaceLabel && <span className="text-gray-500">in {cleanLabel(item.birthPlaceLabel)}</span>}
                                                    </div>
                                                )}
                                                {item.deathDate && (
                                                    <div className="flex items-center gap-2 text-gray-700">
                                                        <span className="font-semibold text-gray-700">Died:</span>
                                                        <span>{item.deathDate}</span>
                                                        {item.deathPlaceLabel && <span className="text-gray-500">in {cleanLabel(item.deathPlaceLabel)}</span>}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* Artwork Details (Production) */}
                        {artworkDetailData.length > 0 && (
                            <section>
                                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                    <span className="w-2 h-8 bg-yellow-500 rounded-full"></span>
                                    Production Details
                                </h3>
                                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                                    <div className="grid gap-4">
                                        {artworkDetailData.map((item: any, idx: number) => (
                                            <div key={idx} className="space-y-2">
                                                {item.productionDate && (
                                                    <div className="flex items-center gap-2 text-gray-700">
                                                        <span className="font-semibold text-yellow-700">Date:</span>
                                                        <span>{item.productionDate}</span>
                                                    </div>
                                                )}
                                                {item.authorLabel && (
                                                    <div className="flex items-center gap-2 text-gray-700">
                                                        <span className="font-semibold text-yellow-700">Author:</span>
                                                        <Link href={`/detail/actor/${item.author?.split('/').pop()}`} className="hover:text-yellow-600 hover:underline">
                                                            {cleanLabel(item.authorLabel)}
                                                        </Link>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
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
