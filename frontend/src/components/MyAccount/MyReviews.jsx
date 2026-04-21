// src/components/Review/MyReview.jsx
import { useState, useCallback, useMemo } from "react";
import StarIcon from "../StarIcon";
import ReviewForm from "../Review/ReviewForm";
import useAuthStore from "../../store/authStore";
// Import custom TanStack Query hooks
import {
  useMyReviews,
  useReviewMutation,
} from "../../hooks/data/useReviewQueries";
import BackButton from "../BackButton";

const MyReviews = () => {
  const currentUser = useAuthStore((state) => state.user);

  const [expandedReviewId, setExpandedReviewId] = useState(null);
  const [sortBy, setSortBy] = useState("createdAt"); // Default sort by creation date
  const [sortOrder, setSortOrder] = useState("desc"); // Default sort order (most recent first)

  const {
    data: reviews = [],
    isLoading: loadingReviews,
    isError: reviewFetchError,
    error: reviewsError,
  } = useMyReviews(); 
  
  const reviewMutation = useReviewMutation(); // Call the custom hook

  const handleReviewActionCompleted = useCallback(
    async (actionType, newRating, comment) => {
      // Find the current review being acted upon to get its culturalSite._id
      const targetReview = reviews.find((r) => r._id === expandedReviewId);
      const placeIdForAction = targetReview?.culturalSite._id;
      const reviewIdForAction = expandedReviewId;

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
      });

      // This state update should remain in the component, not in the generic hook
      setExpandedReviewId(null); // Close the form on successful review action
    },
    [reviewMutation, expandedReviewId, reviews]
  );

  // Memoize the sorted reviews list
  const sortedReviews = useMemo(() => {
    if (!reviews || reviews.length === 0) return [];

    const sortableReviews = [...reviews];

    sortableReviews.sort((a, b) => {
      let valA, valB;

      switch (sortBy) {
        case "culturalSiteName":
          valA = a.culturalSite?.name || "";
          valB = b.culturalSite?.name || "";
          break;
        case "rating":
          valA = a.rating;
          valB = b.rating;
          break;
        case "createdAt":
        default: // Default to createdAt
          valA = new Date(a.createdAt).getTime();
          valB = new Date(b.createdAt).getTime();
          break;
      }

      if (typeof valA === "string" && typeof valB === "string") {
        return sortOrder === "asc"
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      } else {
        // For numbers (ratings, dates converted to timestamps)
        return sortOrder === "asc" ? valA - valB : valB - valA;
      }
    });
    return sortableReviews;
  }, [reviews, sortBy, sortOrder]); // Re-run memoization when these dependencies change

  const handleSortChange = (criteria) => {
    if (sortBy === criteria) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc"); // Toggle order if same criteria
    } else {
      setSortBy(criteria);
      setSortOrder("asc"); // Default to ascending for new criteria
    }
  };

  const getSortIndicator = (criteria) => {
    if (sortBy === criteria) {
      return sortOrder === "asc" ? " ↑" : " ↓";
    }
    return "";
  };

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
            An error occurred: {reviewsError.message}
          </p>
        </div>
      );
    }

    if (sortedReviews.length === 0) { // Check sortedReviews for empty state
      return (
        <div className="text-center flex-grow flex items-center justify-center flex-col">
          <p className="text-gray-600 text-lg">
            There are no reviews.
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
        {sortedReviews.map((review) => ( // Use sortedReviews here
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
                <p className="font-semibold text-gray-800 mr-2 flex-grow break-all">
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
      <div className="flex justify-start mb-4">
        <BackButton />
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-3">
          My Reviews
        </h2>
      </div>

      {/* Sort Buttons for MyReviews */}
      <div className="mb-6 flex flex-wrap gap-2 sm:gap-4 justify-start">
        <button
          onClick={() => handleSortChange("createdAt")}
          className={`px-4 py-2 rounded-md transition-colors ${sortBy === "createdAt" ? "bg-blue-600 text-white cursor-pointer" : "bg-gray-200 text-gray-700 hover:bg-gray-300 cursor-pointer"}`}
        >
          Sort by Date{getSortIndicator("createdAt")}
        </button>
        <button
          onClick={() => handleSortChange("rating")}
          className={`px-4 py-2 rounded-md transition-colors ${sortBy === "rating" ? "bg-blue-600 text-white cursor-pointer" : "bg-gray-200 text-gray-700 hover:bg-gray-300 cursor-pointer"}`}
        >
          Sort by Rating{getSortIndicator("rating")}
        </button>
        <button
          onClick={() => handleSortChange("culturalSiteName")}
          className={`px-4 py-2 rounded-md transition-colors ${sortBy === "culturalSiteName" ? "bg-blue-600 text-white cursor-pointer" : "bg-gray-200 text-gray-700 hover:bg-gray-300 cursor-pointer"}`}
        >
          Sort by Site Name{getSortIndicator("culturalSiteName")}
        </button>
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