import axios from 'axios';

const API_BASE_URL = import.meta.env.PROD 
  ? "https://chemnitz-cultural-sites-map.onrender.com/api/v1" 
  : "http://localhost:5000/api/v1";

// 즐겨찾기 추가
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
