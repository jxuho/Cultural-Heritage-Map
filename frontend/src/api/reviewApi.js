
import axios from 'axios';

const API_BASE_URL = import.meta.env.PROD 
  ? "https://chemnitz-cultural-sites-map.onrender.com/api/v1" 
  : "http://localhost:5000/api/v1";

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