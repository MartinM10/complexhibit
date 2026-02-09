"use client";

import Link from "next/link";
import { cleanLabel } from "@/lib/utils";


// Helper to extract entity ID from URI for frontend links
export function getEntityLink(uri: string): { type: string; id: string } | null {
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
    'human_actant': 'actant',
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
    'group': 'actant',
    'person': 'actant',
    'territorialentity': 'site',
    'territorial_entity': 'site',
  };
  
  return { 
    type: typeMap[entityType] || entityType, 
    id: id || '' 
  };
}

interface EntityLinkProps {
  label: string;
  uri: string | null;
  className?: string;
  children?: React.ReactNode;
}

export default function EntityLink({ 
  label, 
  uri, 
  className = "hover:text-indigo-600 hover:underline",
  children
}: EntityLinkProps) {
  if (!uri) {
    return <span>{children || cleanLabel(label)}</span>;
  }
  
  const link = getEntityLink(uri);
  
  if (!link) {
    return <span>{children || cleanLabel(label)}</span>;
  }

  // If we wanted to "support" direct w3id navigation, we would need the server to redirect.
  // Since we are client-side, we intercept and link internally.
  return (
    <Link 
      href={`/detail/${link.type}/${link.id}`} 
      className={className}
    >
      {children || cleanLabel(label)}
    </Link>
  );
}
