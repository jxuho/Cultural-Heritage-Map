// frontend/src/api/culturalSitesApi.js

import axios from 'axios';

const API_BASE_URL = import.meta.env.PROD 
  ? "https://chemnitz-cultural-sites-map.onrender.com/api/v1" 
  : "http://localhost:5000/api/v1";

// 모든 문화재 정보를 가져오는 함수
export const fetchAllCulturalSites = async (params = {}) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/cultural-sites`, {
      params: { limit: 1000, ...params }
    });
    // 데이터가 없거나 undefined일 경우 빈 배열 반환하도록 수정
    return response.data.data.culturalSites || [];
  } catch (error) {
    console.error("Error fetching all cultural sites:", error);
    // 에러 발생 시 TanStack Query가 감지할 수 있도록 에러를 다시 던짐
    throw error;
  }
};

// 특정 문화재 정보를 가져오는 함수
export const fetchCulturalSiteById = async (id) => {
  if (!id) {
    // ID가 없으면 즉시 에러 발생 (queryFn의 enabled 옵션으로도 제어 가능)
    const error = new Error("Cultural site ID is required.");
    console.error(error.message);
    throw error;
  }
  try {
    const response = await axios.get(`${API_BASE_URL}/cultural-sites/${id}`);
    // 데이터가 없거나 undefined일 경우 null 반환 (단일 객체이므로 빈 배열 대신 null)
    return response.data.data.culturalSite || null;
  } catch (error) {
    console.error(`Error fetching cultural site by ID ${id}:`, error);
    throw error;
  }
};

// 주변 osm 장소 가지고오기(backend extended query 기준)
export const getNearbyOsm = async (lat, lon) => {
  if (!lat || !lon) {
    const error = new Error("Latitude and Longitude are required to fetch nearby OSM sites.");
    console.error(error.message);
    throw error;
  }
  try {
    const response = await axios.get(`${API_BASE_URL}/cultural-sites/nearby-osm?lat=${lat}&lon=${lon}&noReverseGeocode=true`, { withCredentials: true });
    return response.data.data.osmCulturalSites || []; // 데이터 구조에 따라 수정
  } catch (error) {
    console.error(`Error fetching nearby OSM sites for lat: ${lat}, lon: ${lon}:`, error);
    throw error;
  }
};

// site 즉시 생성(admin)
export const createCulturalSite = async (siteData) => {
  const response = await axios.post(`${API_BASE_URL}/cultural-sites`, siteData, { withCredentials: true });
  return response.data.data.culturalSite;
};

// 특정 문화재 정보 업데이트 (관리자용, PUT 메서드)
export const updateCulturalSite = async (culturalSiteId, updateData) => {
  if (!culturalSiteId || !updateData) {
    throw new Error("Cultural site ID and update data are required to update a cultural site.");
  }
  try {
    const response = await axios.put(`${API_BASE_URL}/cultural-sites/${culturalSiteId}`, updateData, { withCredentials: true });
    return response.data.data.culturalSite || null;
  } catch (error) {
    console.error(`Error updating cultural site ${culturalSiteId}:`, error);
    throw error;
  }
};

// 특정 문화재 삭제 (관리자용, DELETE 메서드)
export const deleteCulturalSite = async (culturalSiteId) => {
  if (!culturalSiteId) {
    throw new Error("Cultural site ID is required to delete a cultural site.");
  }
  try {
    await axios.delete(`${API_BASE_URL}/cultural-sites/${culturalSiteId}`, { withCredentials: true });
    return true; // Indicate success
  } catch (error) {
    console.error(`Error deleting cultural site ${culturalSiteId}:`, error);
    throw error;
  }
};
