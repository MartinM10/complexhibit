const DETAIL_TYPE_ALIASES: Record<string, string> = {
  actor: "actant",
  person: "actant",
  group: "actant",
  human_actant: "actant",
  work_manifestation: "artwork",
  obra: "artwork",
  museum: "institution",
  cultural_institution: "institution",
  art_center: "institution",
  cultural_center: "institution",
  exhibitionspace: "institution",
  interpretation_center: "institution",
  library: "institution",
  educational_institution: "institution",
  university: "institution",
  "foundation_(institution)": "institution",
};

const LIST_TYPE_ALIASES: Record<string, string> = {
  ...DETAIL_TYPE_ALIASES,
  site: "institution",
  territorialentity: "institution",
  territorial_entity: "institution",
};

const LISTABLE_TYPES = new Set([
  "exhibition",
  "artwork",
  "institution",
  "actant",
  "catalog",
  "company",
]);

const W3ID_BASE = "https://w3id.org/OntoExhibit";

export function normalizeDetailType(type: string): string {
  const key = type.toLowerCase();
  return DETAIL_TYPE_ALIASES[key] || type;
}

export function normalizeListType(type: string): string | null {
  const key = type.toLowerCase();
  const candidate = LIST_TYPE_ALIASES[key] || key;
  return LISTABLE_TYPES.has(candidate) ? candidate : null;
}

export function getListTypeFromDetailType(type: string): string | null {
  return normalizeListType(type);
}

export function parseEntityUri(uri: string): { type: string; id: string } | null {
  if (!uri) return null;

  const idPathPrefix = `${W3ID_BASE}/id/`;
  if (uri.startsWith(idPathPrefix)) {
    const relative = uri.slice(idPathPrefix.length).replace(/^\/+/, "");
    const segments = relative.split("/").filter(Boolean);
    if (segments.length >= 2) {
      return {
        type: normalizeDetailType(segments[0]),
        id: segments.slice(1).join("/"),
      };
    }
  }

  const hashIndex = uri.indexOf("#");
  if (hashIndex < 0) return null;

  const fragment = uri.slice(hashIndex + 1).replace(/^\/+/, "");
  const segments = fragment.split("/").filter(Boolean);
  if (segments.length < 2) return null;

  const type = normalizeDetailType(segments[0]);
  const id = segments.slice(1).join("/");
  if (!id) return null;

  return { type, id };
}

export function buildDetailHref(type: string, id: string): string {
  const normalizedType = normalizeDetailType(type);
  return `/detail/${encodeURIComponent(normalizedType)}/${encodeURIComponent(id)}`;
}

export function buildResourceHref(type: string, id: string): string {
  const encodedType = encodeURIComponent(type);
  const encodedId = id
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  return `/resource/${encodedType}/${encodedId}`;
}

export function buildCanonicalEntityUri(type: string, id: string): string {
  return `${W3ID_BASE}${buildResourceHref(type, id).replace("/resource", "/id")}`;
}
