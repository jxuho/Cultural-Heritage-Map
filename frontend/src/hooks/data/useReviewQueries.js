import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createReview, deleteReview, fetchReviewsByPlaceId, getMyReviews, updateReview } from "../../api/reviewApi";

// 특정 문화재 리뷰 목록 가져오기
export const usePlaceReviews = (placeId, isExpanded) => {
  return useQuery({
    queryKey: ['reviews', placeId],
    queryFn: () => fetchReviewsByPlaceId(placeId),
    enabled: !!placeId && isExpanded,
    staleTime: 1000 * 10, // 10초
  });
};

export const useMyReviews = () => {
  return useQuery({
    queryKey: ['myReviews'],
    queryFn: getMyReviews, // Assuming getMyReviews handles sorting internally or defaults
    staleTime: 1000 * 10, // 10 seconds, adjust as needed
    enabled: true, // This query should always run if the component is mounted
  });
};

// Review Create/Update/Delete Mutation
export const useReviewMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ actionType, placeId, reviewId, reviewData }) => {
      if (actionType === 'create') {
        return createReview(placeId, reviewData);
      } else if (actionType === 'update') {
        return updateReview(placeId, reviewId, reviewData);
      } else if (actionType === 'delete') {
        return deleteReview(placeId, reviewId);
      }
      throw new Error('Invalid review action type.');
    },
    onSuccess: (response, variables) => {
      // 1. 관련된 쿼리들을 무효화하여 최신 데이터를 다시 가져오도록 합니다.
      //    이것이 culturalSite 데이터가 최신 상태로 반영되도록 하는 주된 방법입니다.
      queryClient.invalidateQueries({ queryKey: ['myReviews'] }); // 사용자 본인의 리뷰 목록
      queryClient.invalidateQueries({ queryKey: ['reviews', variables.placeId] }); // 특정 문화재의 리뷰 목록
      queryClient.invalidateQueries({ queryKey: ['culturalSites'] }); // 전체 문화재 목록 (평점 업데이트 반영)
      queryClient.invalidateQueries({ queryKey: ['culturalSite', variables.placeId] }); // 개별 문화재 상세 정보 (평점 업데이트 반영)

      // 사용자에게 성공 메시지를 알립니다.
      alert("Review is processed successfully!");
    },
    onError: (error) => {
      console.error("Review action fail:", error);
      alert(`Review process fail: ${error.message || "Unknown error"}`);
    },
  });
};