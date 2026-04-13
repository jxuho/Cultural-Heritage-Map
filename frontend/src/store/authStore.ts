import { create } from "zustand";
import { devtools } from "zustand/middleware";
import axios from "axios";
import { User } from "@/types/user";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (userData: User) => void;
  updateUser: (userData: Partial<User>) => void;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
}

// const API_BASE_URL = import.meta.env.PROD
//   ? "https://chemnitz-cultural-sites-map.onrender.com/api/v1"
//   : "http://localhost:5000/api/v1";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true, // Include HttpOnly cookies in all requests
});

const useAuthStore = create<AuthState>()(
  devtools((set) => ({
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
        user: state.user ? { ...state.user, ...userData } : (userData as User),
      }));
    },

    // Logout action
    logout: async () => {
      try {
        await api.post("/auth/logout");
      } catch (error) {
        console.error("Error during logout:", error);
      } finally {
        set({ user: null, isAuthenticated: false });
      }
    },

    // Check initial authentication status (called on app startup)
    checkAuthStatus: async () => {
      set({ loading: true });
      try {
        const response = await api.get("/users/me");
        set({ user: response.data.data.user, isAuthenticated: true });
      } catch (error) {
        console.error("Error checking authentication status:", error);
        set({ user: null, isAuthenticated: false });
      } finally {
        set({ loading: false });
      }
    },
  })),
);

export default useAuthStore;
