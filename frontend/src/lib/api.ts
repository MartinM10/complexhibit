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
  if (type === 'exhibition') endpoint = '/all_exhibitions';
  else if (type === 'artwork') endpoint = '/all_artworks';
  else if (type === 'institution') endpoint = '/all_institutions';
  else if (type === 'actant' || type === 'actor' || type === 'human_actant' || type === 'person') endpoint = '/all_persons';
  else endpoint = `/get_object_any_type/${encodeURIComponent((type === 'person' ? 'human actant' : type).replace(/_/g, ' '))}`;

  console.log(`Mapped type '${type}' to endpoint: ${endpoint}`);
  return fetchFromApi(endpoint, params);
}

export async function getDataProperties(type: string, id: string) {
    // Fallback to generic object fetch
    return fetchFromApi(`/get_object_any_type/${type}/${id}`);
}

export async function getTypesFromId(type: string, id: string) {
  // We haven't implemented this specifically, but maybe object properties include type?
  // Or we can add a simple endpoint. For now, try generic.
  return fetchFromApi(`/get_object_any_type/${type}/${id}`); 
}

export async function getRolesPlayed(type: string, id: string) {
    // Not implemented in backend yet
  return Promise.resolve({ data: {} });
}

export async function getParticipants(id: string) {
    // Not implemented in backend yet
  return Promise.resolve({ data: {} });
}

export async function getArtworks(id: string) {
    // Not implemented in backend yet
  return Promise.resolve({ data: {} });
}

export async function getExhibitionMaking(id: string) {
    // Not implemented in backend yet
  return Promise.resolve({ data: {} });
}

export async function getDatesAndPlace(id: string) {
  // Covered by get_exhibition
  return fetchFromApi(`/get_exhibition/${id}`);
}

// Add more specific fetchers as needed based on views.py logic
export async function getGenericDetail(type: string, id: string) {
    return fetchFromApi(`/get_object_any_type/${type}/${id}`);
}

export async function getActorDetails(id: string) {
  return fetchFromApi(`/get_person/${id}`);
}

export async function getArtworkDetails(id: string) {
  return fetchFromApi(`/get_artwork/${id}`);
}
