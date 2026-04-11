import axiosInstance from './axiosInstance'; 
import { Place } from '../types/place';
import { ApiResponse } from '@/types/api';
import { AxiosError } from 'axios';

// fetch all cultural sites with optional query parameters (e.g., pagination, filters)
export const fetchAllCulturalSites = async (params: Record<string, any> = {}): Promise<Place[]> => {
  try {
    const response = await axiosInstance.get<ApiResponse<{ culturalSites: Place[] }>>(
      '/cultural-sites', 
      { params: { limit: 1000, ...params } }
    );
    return response.data.data.culturalSites || [];
  } catch (error) {
    const err = error as AxiosError;
    console.error("Error fetching all cultural sites:", err);
    throw err;
  }
};

// fetch a specific cultural site by ID
export const fetchCulturalSiteById = async (id: string): Promise<Place | null> => {
  if (!id) throw new Error("Cultural site ID is required.");

  try {
    const response = await axiosInstance.get<ApiResponse<{ culturalSite: Place }>>(
      `/cultural-sites/${id}`
    );
    return response.data.data.culturalSite || null;
  } catch (error) {
    const err = error as AxiosError;
    console.error(`Error fetching cultural site by ID ${id}:`, err);
    throw err;
  }
};

// fetch nearby OSM cultural sites based on latitude and longitude
export const getNearbyOsm = async (lat: number, lon: number): Promise<Place[]> => {
  if (!lat || !lon) throw new Error("Latitude and Longitude are required.");

  try {
    const response = await axiosInstance.get<ApiResponse<{ osmCulturalSites: Place[] }>>(
      '/cultural-sites/nearby-osm', 
      { params: { lat, lon, noReverseGeocode: 'true' } }
    );
    return response.data.data.osmCulturalSites || [];
  } catch (error) {
    const err = error as AxiosError;
    console.error(`Error fetching nearby OSM sites:`, err);
    throw err;
  }
};

// create a new cultural site directly (Admin)
export const createCulturalSite = async (siteData: Partial<Place>): Promise<Place> => {
  const response = await axiosInstance.post<ApiResponse<{ culturalSite: Place }>>(
    '/cultural-sites', 
    siteData
  );
  return response.data.data.culturalSite;
};

// update an existing cultural site (Admin)
export const updateCulturalSite = async (culturalSiteId: string, updateData: Partial<Place>): Promise<Place | null> => {
  if (!culturalSiteId || !updateData) throw new Error("ID and data are required.");

  try {
    const response = await axiosInstance.put<ApiResponse<{ culturalSite: Place }>>(
      `/cultural-sites/${culturalSiteId}`, 
      updateData
    );
    return response.data.data.culturalSite || null;
  } catch (error) {
    const err = error as AxiosError;
    console.error(`Error updating cultural site ${culturalSiteId}:`, err);
    throw err;
  }
};

// delete a cultural site (Admin)
export const deleteCulturalSite = async (culturalSiteId: string): Promise<boolean> => {
  if (!culturalSiteId) throw new Error("Cultural site ID is required.");

  try {
    await axiosInstance.delete(`/cultural-sites/${culturalSiteId}`);
    return true; 
  } catch (error) {
    const err = error as AxiosError;
    console.error(`Error deleting cultural site ${culturalSiteId}:`, err);
    throw err;
  }
};