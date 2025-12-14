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
  ActorBiography 
} from './ActorDetail';

// Artwork components
export { 
  ArtworkRelationsSidebar, 
  ArtworkDetails 
} from './ArtworkDetail';

// Institution components
export { 
  InstitutionSidebar 
} from './InstitutionDetail';
