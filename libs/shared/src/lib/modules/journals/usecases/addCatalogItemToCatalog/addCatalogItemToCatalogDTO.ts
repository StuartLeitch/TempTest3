export interface AddCatalogItemToCatalogUseCaseDTO {
  type: string;
  amount: number;
  currency?: string;
  journalId: string;
  journalTitle?: string;
  issn?: string;
  created?: string;
  updated?: string;
  isActive?: boolean;
}
