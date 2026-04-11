import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addFavorite, deleteFavorite, fetchMyFavorites } from "../../api/favoriteApi";
import { Place } from "../../types/place";
import { AxiosError } from "axios";
import { ApiResponse } from "../../types/api";

/**
 * 내 즐겨찾기 목록 가져오기 훅
 */
export const useMyFavorites = (userId: string | undefined) => {
  return useQuery<Place[], AxiosError<ApiResponse<null>>>({
    queryKey: ['myFavorites', userId],
    queryFn: fetchMyFavorites,
    // userId가 있을 때만 쿼리 활성화
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5분
  });
};

/**
 * 즐겨찾기 추가/삭제 액션 타입 정의
 */
interface FavoriteMutationParams {
  actionType: 'add' | 'delete';
  culturalSiteId: string;
}

/**
 * 즐겨찾기 추가/삭제 뮤테이션 훅
 */
export const useFavoriteMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<Place[] | boolean, AxiosError<ApiResponse<null>>, FavoriteMutationParams>({
    mutationFn: async ({ actionType, culturalSiteId }) => {
      if (actionType === 'add') {
        return addFavorite(culturalSiteId);
      } else if (actionType === 'delete') {
        return deleteFavorite(culturalSiteId);
      }
      throw new Error('Invalid favorite action type.');
    },
    onSuccess: (_, variables) => {
      // 1. 내 즐겨찾기 목록 무효화 (목록 갱신)
      queryClient.invalidateQueries({ queryKey: ['myFavorites'] });
      
      // 2. 특정 문화재 상세 정보 무효화 (즐겨찾기 상태 반영)
      queryClient.invalidateQueries({ 
        queryKey: ['culturalSite', variables.culturalSiteId] 
      });
    },
    onError: (error) => {
      // API 응답의 message가 있으면 출력, 없으면 기본 메시지
      const errorMessage = error.response?.data?.message || error.message || "Unknown error";
      console.error("Favorite action fail:", error);
      alert(`Favorite process fail: ${errorMessage}`);
    },
  });
};