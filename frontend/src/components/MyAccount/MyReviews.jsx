// src/components/Review/MyReview.jsx
import { useState, useCallback } from "react";
import StarIcon from "../StarIcon";
import ReviewForm from "../Review/ReviewForm";
import useAuthStore from "../../store/authStore";
// Import custom TanStack Query hooks
import {
  useMyReviews,
  useReviewMutation,
} from "../../hooks/useCulturalSitesQueries";
import BackButton from "../BackButton";

const MyReviews = () => {
  const currentUser = useAuthStore((state) => state.user);

  const [expandedReviewId, setExpandedReviewId] = useState(null);

  const {
    data: reviews = [],
    isLoading: loadingReviews,
    isError: reviewFetchError,
    error: reviewsError,
  } = useMyReviews(); // Call the custom hook

  const reviewMutation = useReviewMutation(); // Call the custom hook

  const handleReviewActionCompleted = useCallback(
    async (actionType, newRating, oldRating, comment) => {
      // Find the current review being acted upon to get its culturalSite._id
      const targetReview = reviews.find((r) => r._id === expandedReviewId);
      const placeIdForAction = targetReview?.culturalSite._id;
      const reviewIdForAction = expandedReviewId;
      const oldRatingOfTargetReview = targetReview?.rating; // Get old rating directly from the fetched review

      if (!placeIdForAction) {
        alert("Can't get cultural site data.");
        return;
      }

      await reviewMutation.mutateAsync({
        actionType,
        placeId: placeIdForAction,
        reviewId: actionType === "create" ? undefined : reviewIdForAction,
        reviewData:
          actionType === "delete"
            ? undefined
            : { rating: newRating, comment: comment },
        oldRating: oldRatingOfTargetReview, // Pass oldRating to the mutation for manual cache update if needed
      });

      // This state update should remain in the component, not in the generic hook
      setExpandedReviewId(null); // Close the form on successful review action
    },
    [reviewMutation, expandedReviewId, reviews]
  );

  // --- 로딩/에러/빈 리뷰 상태 처리 ---
  const renderContent = () => {
    if (loadingReviews) {
      return (
        <div className="text-center flex-grow flex items-center justify-center flex-col">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading reviews...</p>
        </div>
      );
    }

    if (reviewFetchError) {
      return (
        <div className="text-center flex-grow flex items-center justify-center flex-col">
          <p className="text-red-600">
            An error occured: {reviewsError.message}
          </p>
        </div>
      );
    }

    if (reviews.length === 0) {
      return (
        <div className="text-center flex-grow flex items-center justify-center flex-col">
          <p className="text-gray-600 text-lg">
            There's no review
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Write down your review!
          </p>
        </div>
      );
    }

    // 실제 리뷰 목록
    return (
      <div className="space-y-4">
        {reviews.map((review) => (
          <div
            key={review._id}
            className="bg-gray-50 p-3 rounded-lg shadow-sm border border-gray-100"
          >
            {/* Main review content (clickable to expand/collapse) */}
            <div
              className="cursor-pointer"
              onClick={() =>
                setExpandedReviewId(
                  expandedReviewId === review._id ? null : review._id
                )
              }
            >
              <div className="flex items-center mb-2">
                {/* {review.culturalSite.imageUrl && (
                  <img
                    src={review.culturalSite.imageUrl}
                    alt={`${review.culturalSite.name}'s image`}
                    className="w-8 h-8 rounded-full object-cover mr-2 border border-gray-200"
                  />
                )} */}
                <p className="font-semibold text-gray-800 mr-2 flex-grow">
                  {review.culturalSite.name || "Unknown"}
                </p>
                <div className="flex text-yellow-500 text-sm">
                  {[...Array(5)].map((_, i) => (
                    <StarIcon
                      key={i}
                      rating={review.rating}
                      index={i}
                      className="w-4 h-4"
                      displayMode="reviewForm"
                    />
                  ))}
                </div>
              </div>
              {review.comment && (
                <p className="text-gray-700 text-sm italic">
                  "{review.comment}"
                </p>
              )}
              <p className="text-gray-500 text-xs mt-2 text-right">
                {new Date(review.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>

            {/* Conditionally render ReviewForm if this review is expanded */}
            {expandedReviewId === review._id && (
              <div
                className="mt-4 border-t pt-4 border-gray-200"
                onClick={(e) => e.stopPropagation()} // IMPORTANT: Stop propagation here to prevent re-collapsing when clicking inside the form
              >
                <ReviewForm
                  userReview={review} // Pass the specific review object to the form for editing
                  onReviewActionCompleted={handleReviewActionCompleted}
                  currentUser={currentUser}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="p-6 rounded-lg shadow-md flex flex-col h-full">
      {/* Add BackButton here */}
      <div className="flex justify-start mb-4">
        <BackButton />
      </div>

      {/* 제목 섹션 - Ref 연결 */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-3">
          My Reviews
        </h2>
      </div>

      <div
        className="overflow-y-auto pr-2 flex-grow"
      >
        {renderContent()}
      </div>
    </div>
  );
};

export default MyReviews;