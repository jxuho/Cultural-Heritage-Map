import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addFavorite, deleteFavorite, fetchMyFavorites } from "../../api/favoriteApi";

// 내 즐겨찾기 목록 가져오기
export const useMyFavorites = (userId) => {
  return useQuery({
    queryKey: ['myFavorites', userId],
    queryFn: fetchMyFavorites,
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
};

// 즐겨찾기 추가/삭제 뮤테이션
export const useFavoriteMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ actionType, culturalSiteId }) => {
      if (actionType === 'add') {
        return addFavorite(culturalSiteId);
      } else if (actionType === 'delete') {
        return deleteFavorite(culturalSiteId);
      }
      throw new Error('Invalid favorite action type.');
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['myFavorites'] }); // 특정 유저의 즐겨찾기 목록 갱신
      // 필요하다면, 전체 문화재 목록이나 상세 문화재 정보도 갱신
      queryClient.invalidateQueries({ queryKey: ['culturalSite', variables.culturalSiteId] });
    },
    onError: (error) => {
      console.error("Favorite action fail:", error);
      alert(`Favorite process fail: ${error.message || "Unknown error"}`);
    },
  });
};