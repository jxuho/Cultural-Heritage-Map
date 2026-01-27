import axios from 'axios';

const API_BASE_URL = import.meta.env.PROD 
  ? "https://chemnitz-cultural-sites-map.onrender.com/api/v1" 
  : "http://localhost:5000/api/v1";

// 사용자 프로필 업데이트 함수
export const updateProfileApi = async (updateData) => {
  try {
    const response = await axios.patch(`${API_BASE_URL}/users/updateMe`, updateData, { withCredentials: true });
    return response.data;
  } catch (error) {
    console.error("Error updating profile:", error); 
    // 서버 응답에서 오류 메시지를 가져오거나 일반적인 오류 메시지 반환
    throw error.response?.data?.message || 'Failed to update profile. Please try again.'; 
  }
};

export const deleteMyAccount = async () => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/users/deleteMe`, { withCredentials: true });
    return response.data; // Usually, the backend might return a success message or confirmation
  } catch (error) {
    console.error("Error deleting user account:", error);
    // Re-throw with a more specific error message from the backend if available
    throw error.response?.data?.message || 'Failed to delete account';
  }
};

export const fetchUserById = async (userId) => {
  if (!userId) {
    const error = new Error("User ID is required to fetch user data.");
    console.error(error.message);
    throw error;
  }

  try {
    const response = await axios.get(`${API_BASE_URL}/users/${userId}`, {
      withCredentials: true, 
    });

    // 원하는 필드만 전달된다고 가정: _id, username, email, profileImage, bio
    return response.data.data.user || null;
  } catch (error) {
    console.error(`Error fetching user by ID ${userId}:`, error);
    throw error.response?.data?.message || 'Failed to fetch user';
  }
};

export const fetchAllUsers = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/users`, {
      withCredentials: true, // 인증 쿠키 포함 (admin 인증 필요 시)
    });

    return response.data.data.users; // 배열 형태 반환
  } catch (error) {
    console.error("Error fetching all users:", error);
    throw error.response?.data?.message || "Failed to fetch users";
  }
};

export const updateUserRoleApi = async (userId, newRole) => {
  try {
    const response = await axios.patch(`${API_BASE_URL}/users/updateRole/${userId}`, { newRole }, {
      withCredentials: true, 
    });
    return response.data; // Assuming your backend returns { status: 'success', message: ..., data: { user: ... } }
  } catch (error) {
    // It's good to re-throw the error so the hook can catch it
    throw error.response?.data?.message || error.message || 'Failed to update user role.';
  }
};