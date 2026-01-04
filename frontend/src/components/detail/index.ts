/**
 * Detail components index.
 * 
 * Exports all entity-specific detail components for use in the detail page.
 */

// Shared utilities
export { 
  parseLinkedEntities,
  SectionHeader,
  SectionWrapper,
  SidebarCard,
  PropertyRow,
  EntityList,
  DefinitionList
} from './DetailUtils';

// Exhibition components
export { 
  ExhibitionSidebar, 
  ExhibitionDetails,
  ParticipantsSection
} from './ExhibitionDetail';

// Actor/Person components
export { 
  ActorRolesSidebar, 
  ActorBiography,
  ActorResidence,
  ActorCollaborators,
  ActorExecutivePositions
} from './ActorDetail';

// Artwork components
export { 
  ArtworkRelationsSidebar, 
  ArtworkDetails 
} from './ArtworkDetail';

// Institution components
export { 
  InstitutionSidebar,
  InstitutionDetails,
  InstitutionCollaborators,
  InstitutionHeadquarters,
  InstitutionSubsidiaries
} from './InstitutionDetail';

// Catalog components
export { 
  CatalogDetails,
  CatalogSidebar,
  ExhibitionCatalogs,
  ProducedCatalogs
} from './CatalogDetail';

