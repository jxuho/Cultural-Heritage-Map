import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchAllCulturalSites,
  fetchCulturalSiteById,
  getNearbyOsm,
  createCulturalSite,
  deleteCulturalSite,
  updateCulturalSite,
} from '../../api/culturalSitesApi';
import { Place } from '../../types/place';
import { AxiosError } from 'axios';
import { ApiResponse } from '@/types/api';

// define a common error type for API responses
type ApiError = AxiosError<ApiResponse<null>>;

/**
 * fetch all cultural sites with optional query parameters (e.g., pagination, filters)
 */
export const useAllCulturalSites = (params?: Record<string, any>) => {
  return useQuery<Place[], ApiError>({
    queryKey: ['culturalSites', params],
    queryFn: () => fetchAllCulturalSites(params),
    staleTime: 1000 * 60 * 5,
  });
};

/**
 * fetch a specific cultural site by ID
 */
export const useCulturalSiteDetail = (id: string | undefined | null) => {
  return useQuery<Place | null, ApiError>({
    queryKey: ['culturalSite', id],
    queryFn: () => fetchCulturalSiteById(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 1,
  });
};

/**
 * get nearby OSM cultural sites based on latitude and longitude
 */
export const useNearbyOsm = (lat: number | null, lon: number | null) => {
  const queryResult = useQuery<Place[], ApiError>({
    queryKey: ['nearbyOsm', lat, lon],
    queryFn: () => getNearbyOsm(lat!, lon!),
    enabled: false, // unable by default, will be triggered manually
    staleTime: 1000 * 60 * 10,
  });

  return { ...queryResult, refetch: queryResult.refetch };
};

/**
 * create a new cultural site (Admin)
 */
export const useCreateCulturalSite = () => {
  const queryClient = useQueryClient();
  return useMutation<Place, ApiError, Partial<Place>>({
    mutationFn: createCulturalSite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['culturalSites'] });
    },
    onError: (error) => {
      console.error("Failed to create cultural site:", error);
      throw error;
    },
  });
};

/**
 * update an existing cultural site (Admin)
 */
interface UpdateMutationParams {
  culturalSiteId: string;
  updateData: Partial<Place>;
}

export const useUpdateCulturalSite = () => {
  const queryClient = useQueryClient();
  return useMutation<Place | null, ApiError, UpdateMutationParams>({
    mutationFn: ({ culturalSiteId, updateData }) => updateCulturalSite(culturalSiteId, updateData),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['culturalSite', variables.culturalSiteId] });
      queryClient.invalidateQueries({ queryKey: ['culturalSites'] });
      console.log(`Cultural site ${variables.culturalSiteId} update success!`);
    },
    onError: (error, variables) => {
      const msg = error.response?.data?.message || error.message || "Unknown error";
      console.error(`Cultural site ${variables.culturalSiteId} update fail:`, error);
      alert(`Cultural site update 실패: ${msg}`);
    },
  });
};

/**
 * delete a cultural site (Admin)
 */
export const useDeleteCulturalSite = () => {
  const queryClient = useQueryClient();
  return useMutation<boolean, ApiError, string>({
    mutationFn: (culturalSiteId: string) => deleteCulturalSite(culturalSiteId),
    onSuccess: (_, culturalSiteId) => {
      queryClient.invalidateQueries({ queryKey: ['culturalSite', culturalSiteId] });
      queryClient.invalidateQueries({ queryKey: ['culturalSites'] });
      console.log(`Cultural site ${culturalSiteId} is deleted!`);
    },
    onError: (error, culturalSiteId) => {
      const msg = error.response?.data?.message || error.message || "Unknown error";
      console.error(`Failed to delete cultural site ${culturalSiteId}:`, error);
      alert(`Failed to delete cultural site: ${msg}`);
    },
  });
};