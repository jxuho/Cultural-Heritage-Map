import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  deleteMyAccount, 
  fetchAllUsers, 
  fetchUserById, 
  updateProfileApi, 
  updateUserRoleApi 
} from '../../api/userApi'; 
import { User } from '../../types/user';
import { ApiResponse } from '@/types/api';

/**
 * update user profile information (user only)
 */
export const useUpdateProfile = () => {
  const queryClient = useQueryClient(); 

  // useMutation<return, error, mutation variables>
  return useMutation<ApiResponse<{ user: User }>, Error, Partial<User>>({
    mutationFn: updateProfileApi, 
    onSuccess: (response) => {
      const updatedUser = response.data.user;
      
      if (updatedUser?._id) {
        queryClient.invalidateQueries({ queryKey: ['user', updatedUser._id] });
      }
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      queryClient.invalidateQueries({ queryKey: ['myReviews'] });
      queryClient.invalidateQueries({ queryKey: ['myFavorites'] });
    },
    onError: (error) => {
      console.error("Profile update failed:", error);
      throw error;
    },
  });
};

/**
 * delete my account (user only)
 */
export const useDeleteMyAccount = () => {
  const queryClient = useQueryClient();
  
  return useMutation<{ status: string; message: string }, Error, void>({
    mutationFn: deleteMyAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myReviews'] });
      queryClient.invalidateQueries({ queryKey: ['myFavorites'] });
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });

      alert("Your account has been successfully deleted.");
    },
    onError: (error) => {
      console.error("Error deleting account:", error);
      alert(`Failed to delete account: ${error.message || "Unknown error"}`);
    },
  });
};

/**
 * fetch user information by user ID
 */
export const useUserById = (userId: string | undefined | null) => {
  return useQuery<User | null, Error>({
    queryKey: ['user', userId],
    queryFn: () => fetchUserById(userId!), 
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
};

/**
 * fetch all users (Admin only)
 */
export const useAllUsers = () => {
  return useQuery<User[], Error>({
    queryKey: ['users'],
    queryFn: fetchAllUsers,
    staleTime: 1000 * 60 * 5,
  });
};

/**
 * update user role (Admin only)
 */
interface UpdateRoleVariables {
  userId: string;
  newRole: 'user' | 'admin';
}

export const useUpdateUserRole = () => {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<{ user: User }>, Error, UpdateRoleVariables>({
    mutationFn: ({ userId, newRole }) => updateUserRoleApi(userId, newRole),
    onSuccess: (response) => {
      const updatedUser = response.data.user;
      
      queryClient.invalidateQueries({ queryKey: ['users'] });
      if (updatedUser?._id) {
        queryClient.invalidateQueries({ queryKey: ['user', updatedUser._id] });
      }

      console.log('User role updated successfully');
    },
    onError: (error) => {
      console.error('Error updating user role:', error);
      alert(`Failed to change the role: ${error.message || "Unknown error"}`);
    },
  });
};