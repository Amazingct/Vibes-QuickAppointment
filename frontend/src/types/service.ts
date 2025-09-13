export interface Service {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  currency: string;
  images: string[];
  creator: {
    id: string;
    username: string;
    avatar?: string;
  };
  rating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface ServiceFilters {
  category: string;
  username: string;
  search: string;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

export interface ServicesResponse {
  services: Service[];
  pagination: PaginationInfo;
}

export const SERVICE_CATEGORIES = [
  'All Categories',
  'Web Development',
  'Mobile Development',
  'UI/UX Design',
  'Digital Marketing',
  'Content Writing',
  'Photography',
  'Video Editing',
  'Graphic Design',
  'Data Analysis',
  'Consulting',
  'Other'
] as const;

export type ServiceCategory = typeof SERVICE_CATEGORIES[number];
