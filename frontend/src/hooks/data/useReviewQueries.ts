import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createReview,
  deleteReview,
  fetchReviewsByPlaceId,
  getMyReviews,
  updateReview,
} from "../../api/reviewApi";
import { Review, ReviewInput } from "../../types/review";

// fetch reviews for a specific cultural site by place ID, only when the placeId is available and the review section is expanded
export const usePlaceReviews = (
  placeId: string | undefined,
  isExpanded: boolean,
) => {
  return useQuery<Review[], Error>({
    queryKey: ["reviews", placeId],
    queryFn: () => fetchReviewsByPlaceId(placeId!),
    enabled: !!placeId && isExpanded,
    staleTime: 1000 * 10,
  });
};

// fetch my reviews with optional sorting by date or rating
export const useMyReviews = (
  sortOption: "newest" | "oldest" | "highest" | "lowest" = "newest",
) => {
  return useQuery<Review[], Error>({
    queryKey: ["myReviews", sortOption],
    queryFn: () => getMyReviews(sortOption),
    staleTime: 1000 * 10,
  });
};

/**
 * review mutation variables type (Discriminated Unions)
 */
type ReviewMutationVariables = {
  actionType: "create" | "update" | "delete";
  placeId: string;
  reviewId?: string; // 필수 아님
  reviewData?: ReviewInput; // 필수 아님
  oldRating?: number; // 추가
};
// mutation hook for creating, updating, and deleting reviews
export const useReviewMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<Review | boolean | null, Error, ReviewMutationVariables>({
    mutationFn: async (variables) => {
      const { actionType, placeId } = variables;

      switch (actionType) {
        case "create":
          return createReview(placeId, variables.reviewData!);
        case "update":
          return updateReview(
            placeId,
            variables.reviewId!,
            variables.reviewData!,
          );
        case "delete":
          return deleteReview(placeId, variables.reviewId!);
        default:
          const _exhaustiveCheck: never = actionType;
          return _exhaustiveCheck;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["myReviews"] });
      queryClient.invalidateQueries({
        queryKey: ["reviews", variables.placeId],
      });
      queryClient.invalidateQueries({ queryKey: ["culturalSites"] });
      queryClient.invalidateQueries({
        queryKey: ["culturalSite", variables.placeId],
      });

      alert("Review is processed successfully!");
    },
    onError: (error: Error) => {
      console.error("Review action failed:", error);
      alert(`Review process failed: ${error.message || "Unknown error"}`);
    },
  });
};
