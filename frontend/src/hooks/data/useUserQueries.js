import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deleteMyAccount, fetchAllUsers, fetchUserById, updateProfileApi, updateUserRoleApi } from '../../api/userApi'; 

// 프로필 업데이트를 위한 useMutation 훅
export const useUpdateProfile = () => {
    const queryClient = useQueryClient(); 

    return useMutation({
        mutationFn: updateProfileApi, // 위에서 정의한 API 함수를 mutationFn으로 사용
        onSuccess: (data) => {
            // 성공 시 필요한 캐시 무효화
            // 예를 들어, 현재 로그인된 사용자의 정보가 변경되었으므로 해당 캐시를 무효화합니다.
            if (data?.data?.user?._id) {
                queryClient.invalidateQueries({ queryKey: ['user', data.data.user._id] });
            }
            // 전역적인 사용자 목록이나 프로필 관련 캐시가 있다면 함께 무효화
            queryClient.invalidateQueries({ queryKey: ['userProfile'] }); // 가상의 사용자 프로필 쿼리 키
            queryClient.invalidateQueries({ queryKey: ['myReviews'] }); // 사용자 리뷰에도 영향이 있을 수 있다면
            queryClient.invalidateQueries({ queryKey: ['myFavorites'] }); // 사용자 즐겨찾기에도 영향이 있을 수 있다면
        },
        onError: (error) => {
            console.error("Profile update failed:", error);
            // 에러 처리 로직 (예: 토스트 알림 표시)
            throw error; // 컴포넌트에서 에러를 catch할 수 있도록 다시 던집니다.
        },
    });
};


export const useDeleteMyAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteMyAccount,
    onSuccess: (data) => {
      console.log("Account deleted successfully!", data);
      // Invalidate all queries related to the user, as their data is no longer valid.
      // This is a broad invalidation, consider more specific ones if needed.
      queryClient.invalidateQueries({ queryKey: ['myReviews'] });
      queryClient.invalidateQueries({ queryKey: ['myFavorites'] });
      queryClient.invalidateQueries({ queryKey: ['userProfile'] }); // Assuming you have a user profile query

      alert("Your account has been successfully deleted.");

      // After successful deletion, you might want to redirect the user
      // For example, to the logout page or home page.
      // import { useNavigate } from 'react-router-dom';
      // const navigate = useNavigate();
      // navigate('/logout'); or navigate('/');
    },
    onError: (error) => {
      console.error("Error deleting account:", error);
      alert(`Failed to delete account: ${error.message || "Unknown error"}`);
    },
  });
};

// 특정 사용자 정보를 가져오는 훅 (ex. 프로필 조회용)
export const useUserById = (userId) => {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUserById(userId),
    enabled: !!userId, // userId가 존재할 때만 실행
    staleTime: 1000 * 60 * 5, // 5분 동안 캐싱
  });
};

export const useAllUsers = () => {
  return useQuery({
    queryKey: ['users'],
    queryFn: fetchAllUsers,
    staleTime: 1000 * 60 * 5, // 5분 동안 캐싱
  });
};

export const useUpdateUserRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, newRole }) => updateUserRoleApi(userId, newRole),
    onSuccess: (data) => {
      // Invalidate queries that might be affected by a role change
      // For example, if you have a list of all users, you'd invalidate that.
      // You might also want to update a specific user's cache if you're viewing their profile.
      queryClient.invalidateQueries({ queryKey: ['users'] }); // Assuming you have a 'users' query
      queryClient.invalidateQueries({ queryKey: ['user', data.data.user._id] }); // Invalidate specific user cache

      console.log('User role updated successfully:', data.message);
      // You might want to show a success toast/notification here
    },
    onError: (error) => {
      console.error('Error updating user role:', error);
      // You might want to show an error toast/notification here
      alert(`Failed to change the role: ${error}`); // Basic alert for demonstration
    },
    // Optional: onSettled runs regardless of success or error
    // onSettled: (data, error, variables, context) => {
    //   console.log('Mutation settled');
    // },
  });
};