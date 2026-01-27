import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import axios from 'axios';


const API_BASE_URL = import.meta.env.PROD 
  ? "https://chemnitz-cultural-sites-map.onrender.com/api/v1" 
  : "http://localhost:5000/api/v1";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Include HttpOnly cookies in all requests
});

const useAuthStore = create(devtools((set) => ({
  /** @type {User | null} */
  user: null, // User information
  isAuthenticated: false, // Authentication status
  loading: true, // Initial authentication status loading state

  // Login action (also sets current user information)
  login: (/** @type {User} */ userData) => {
    set({ user: userData, isAuthenticated: true });
  },

  updateUser: (userData) => {
    set((state) => ({
      user: state.user ? { ...state.user, ...userData } : userData,
    }));
  },

  // Logout action
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Error during logout:', error);
      if (error.response) {
        console.error('Logout API call failed:', error.response.status, error.response.data);
      }
    } finally {
      // Initialize client state regardless of API call success
      set({ user: null, isAuthenticated: false });
    }
  },

  // Check initial authentication status (called on app startup)
  checkAuthStatus: async () => {
    set({ loading: true });
    try {
      // Use axios for GET request
      const response = await api.get('/users/me');

      // axios automatically treats 2xx status codes as success,
      // and puts the response data in response.data.
      set({ user: response.data.data.user, isAuthenticated: true });
    } catch (error) {
      console.error('Error checking authentication status:', error);
      if (error.response) {
        console.warn('Authentication check failed:', error.response.status, error.response.data);
      }
      set({ user: null, isAuthenticated: false });
    } finally {
      set({ loading: false });
    }
  },
})));

export default useAuthStore;