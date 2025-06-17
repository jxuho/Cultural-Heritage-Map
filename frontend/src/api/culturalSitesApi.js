// backend/src/api/culturalSitesApi.js (또는 frontend/src/api/culturalSitesApi.js)

import axios from 'axios';

const API_BASE_URL = "http://localhost:5000/api/v1";

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

// 특정 문화재의 리뷰 목록을 가져오는 함수
export const fetchReviewsByPlaceId = async (placeId) => {
  if (!placeId) {
    const error = new Error("Place ID is required to fetch reviews.");
    console.error(error.message);
    throw error;
  }
  try {
    const response = await axios.get(`${API_BASE_URL}/cultural-sites/${placeId}/reviews`);
    // 데이터가 없거나 undefined일 경우 빈 배열 반환
    return response.data.data.reviews || [];
  } catch (error) {
    console.error(`Error fetching reviews for place ID ${placeId}:`, error);
    throw error;
  }
};

// 리뷰 생성 함수
// placeId와 reviewData를 받으며, withCredentials로 쿠키 인증 사용
export const createReview = async (placeId, reviewData) => {
  if (!placeId || !reviewData) {
    const error = new Error("Place ID and review data are required to create a review.");
    console.error(error.message);
    throw error;
  }
  try {
    const response = await axios.post(`${API_BASE_URL}/cultural-sites/${placeId}/reviews`, reviewData, { withCredentials: true });
    // 생성 후 반환되는 리뷰 객체가 없거나 undefined일 경우 null 반환
    return response.data.data.review || null;
  } catch (error) {
    console.error(`Error creating review for place ID ${placeId}:`, error);
    throw error;
  }
};

// 리뷰 수정 함수
// placeId, reviewId, reviewData를 받으며, withCredentials로 쿠키 인증 사용
export const updateReview = async (placeId, reviewId, reviewData) => {
  if (!placeId || !reviewId || !reviewData) {
    const error = new Error("Place ID, review ID, and review data are required to update a review.");
    console.error(error.message);
    throw error;
  }
  try {
    const response = await axios.patch(`${API_BASE_URL}/cultural-sites/${placeId}/reviews/${reviewId}`, reviewData, { withCredentials: true });
    // 수정 후 반환되는 리뷰 객체가 없거나 undefined일 경우 null 반환
    return response.data.data.review || null;
  } catch (error) {
    console.error(`Error updating review for place ID ${placeId}, review ID ${reviewId}:`, error);
    throw error;
  }
};

// 리뷰 삭제 함수
// placeId, reviewId를 받으며, withCredentials로 쿠키 인증 사용
export const deleteReview = async (placeId, reviewId) => {
  if (!placeId || !reviewId) {
    const error = new Error("Place ID and review ID are required to delete a review.");
    console.error(error.message);
    throw error;
  }
  try {
    await axios.delete(`${API_BASE_URL}/cultural-sites/${placeId}/reviews/${reviewId}`, { withCredentials: true });
    // 삭제 성공 시 true 반환 (API가 굳이 데이터를 반환하지 않을 때 유용)
    return true;
  } catch (error) {
    console.error(`Error deleting review for place ID ${placeId}, review ID ${reviewId}:`, error);
    throw error;
  }
};

// 특정 유저의 모든 리뷰 가지고 오는 함수 (정렬 옵션 추가)
export const getMyReviews = async (sortOption = 'newest') => {
  try {
    const response = await axios.get(`${API_BASE_URL}/users/me/reviews?reviewSort=${sortOption}`, { withCredentials: true });
    return response.data.data.reviews || []; // Ensure it returns an array
  } catch (error) {
    console.error("Error fetching my reviews:", error);
    throw error;
  }
};

// Add a cultural site to favorites
export const addFavorite = async (culturalSiteId) => {
  if (!culturalSiteId) throw new Error("Cultural site ID is required to add to favorites.");
  try {
    const response = await axios.post(`${API_BASE_URL}/users/me/favorites/${culturalSiteId}`, {}, { withCredentials: true });
    return response.data.data.favoriteSites || null; // Ensure it returns a value
  } catch (error) {
    console.error("Error adding favorite:", error);
    throw error;
  }
};

// Fetch all favorite cultural sites for the current user
export const fetchMyFavorites = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/users/me/favorites`, { withCredentials: true });
    return response.data.data.favoriteSites || []; // Ensure it returns an array
  } catch (error) {
    console.error("Error fetching my favorites:", error);
    throw error;
  }
};

// Delete a cultural site from favorites
export const deleteFavorite = async (culturalSiteId) => {
  if (!culturalSiteId) throw new Error("Cultural site ID is required to delete from favorites.");
  try {
    await axios.delete(`${API_BASE_URL}/users/me/favorites/${culturalSiteId}`, { withCredentials: true });
    return true; // Success indicates true
  } catch (error) {
    console.error("Error deleting favorite:", error);
    throw error;
  }
};


export const getNearbyOsm = async (lat, lon) => {
  if (!lat || !lon) {
    const error = new Error("Latitude and Longitude are required to fetch nearby OSM sites.");
    console.error(error.message);
    throw error;
  }
  try {
    const response = await axios.get(`${API_BASE_URL}/cultural-sites/nearby-osm?lat=${lat}&lon=${lon}`, { withCredentials: true });
    return response.data.data.osmCulturalSites || []; // 데이터 구조에 따라 수정
  } catch (error) {
    console.error(`Error fetching nearby OSM sites for lat: ${lat}, lon: ${lon}:`, error);
    throw error;
  }
};


export const submitProposal = async (proposalData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/proposals`, proposalData, { withCredentials: true });
    return response.data;
  } catch (error) {
    // It's good practice to re-throw with a more specific error or process it
    throw error.response?.data?.message || 'Failed to submit proposal';
  }
};

// site 즉시 생성(admin)
export const createCulturalSite = async (siteData) => {
  const response = await axios.post(`${API_BASE_URL}/cultural-sites`, siteData, { withCredentials: true });
  return response.data.data.culturalSite;
};