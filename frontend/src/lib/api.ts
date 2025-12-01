const API_URL = (typeof window === 'undefined' && process.env.API_URL) 
  ? process.env.API_URL 
  : (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8001");

export async function fetchFromApi(endpoint: string, params: Record<string, string> = {}) {
  const url = new URL(`${API_URL}${endpoint}`);
  console.log(`Fetching from: ${url.toString()}`);
  Object.keys(params).forEach((key) => url.searchParams.append(key, params[key]));

  const response = await fetch(url.toString(), {
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }

  return response.json();
}

export async function getFromType(type: string, params: Record<string, string> = {}) {
  // Map frontend types to API endpoints
  let endpoint = "";
  if (type === 'exhibition') endpoint = '/all_exposiciones';
  else if (type === 'artwork') endpoint = '/all_obras';
  else if (type === 'institution') endpoint = '/all_instituciones';
  else if (type === 'actant' || type === 'actor' || type === 'human_actant') endpoint = '/all_personas';
  else endpoint = `/get_from_type/${encodeURIComponent(type)}`;

  console.log(`Mapped type '${type}' to endpoint: ${endpoint}`);
  return fetchFromApi(endpoint, params);
}

export async function getDataProperties(type: string, id: string) {
  return fetchFromApi(`/get_data_properties_from_individual/${type}/${id}`);
}

export async function getTypesFromId(type: string, id: string) {
  return fetchFromApi(`/get_types_from_id/${type}/${id}`);
}

export async function getRolesPlayed(type: string, id: string) {
  return fetchFromApi(`/get_roles_played_from_individual/${type}/${id}`);
}

export async function getParticipants(id: string) {
  return fetchFromApi(`/get_participants_people_from_exhibition/${id}`);
}

export async function getArtworks(id: string) {
  return fetchFromApi(`/get_artworks_exposed_from_exhibition/${id}`);
}

export async function getExhibitionMaking(id: string) {
  return fetchFromApi(`/get_exhibition_making_from_exhibition/${id}`);
}

export async function getDatesAndPlace(id: string) {
  return fetchFromApi(`/get_dates_and_place_from_exhibition/${id}`);
}

// Add more specific fetchers as needed based on views.py logic
export async function getGenericDetail(type: string, id: string) {
    return fetchFromApi(`/get_object_any_type/${type}/${id}`);
}

export async function getActorDetails(id: string) {
  return fetchFromApi(`/get_actor_details/${id}`);
}

export async function getArtworkDetails(id: string) {
  return fetchFromApi(`/get_artwork_details/${id}`);
}
