import StarIcon from "../StarIcon";
import ReviewForm from "../Review/ReviewForm";
import ReviewDisplay from "../Review/ReviewDisplay";
import { BsStar, BsStarFill } from "react-icons/bs";
import useAuthStore from "../../store/authStore";
import { useCallback } from "react";
import { useCulturalSiteDetail } from "../../hooks/data/useCulturalSitesQueries";
import {
  useFavoriteMutation,
  useMyFavorites,
} from "../../hooks/data/useFavoriteQueries";
import {
  usePlaceReviews,
  useReviewMutation,
} from "../../hooks/data/useReviewQueries";
import useUiStore from "../../store/uiStore";
import ErrorMessage from "../ErrorMessage";
import { Place } from "@/types/place";

interface SidePanelItemsProps {
  isReviewsExpanded: boolean;
  toggleReviewsExpansion: () => void;
  onClose: () => void;
  selectedPlaceData: Place | null;
}

const SidePanelItems = ({
  isReviewsExpanded,
  toggleReviewsExpansion,
}: SidePanelItemsProps) => {
  // --- Zustand (UI State Management) ---
  const currentUser = useAuthStore((state) => state.user);
  const uiSelectedPlace = useUiStore((state) => state.selectedPlace);
  const closeSidePanel = useUiStore((state) => state.closeSidePanel);
  const setJumpToPlace = useUiStore((state) => state.setJumpToPlace);

  // --- TanStack Query: Data Fetching Hooks (Local to SidePanelItems) ---
  const { data: selectedPlaceData } = useCulturalSiteDetail(
    uiSelectedPlace?._id,
  );

  const {
    data: reviews = [],
    isLoading: loadingReviews,
    isError: reviewFetchError,
    error: reviewsError,
  } = usePlaceReviews(uiSelectedPlace?._id, isReviewsExpanded);

  const { data: myFavorites = [] } = useMyFavorites(currentUser?._id);

  // --- TanStack Query: Mutation Hooks ---
  const reviewMutation = useReviewMutation();
  const favoriteMutation = useFavoriteMutation();

  // --- Derived State ---
  const userReview =
    reviews.find((review) => {
      return (
        typeof review.user !== "string" && review.user?._id === currentUser?._id
      );
    }) || null;
  const otherReviews = reviews.filter((review) => {
    if (review.user && typeof review.user !== "string") {
      return review.user._id !== currentUser?._id;
    }

    if (typeof review.user === "string") {
      return review.user !== currentUser?._id;
    }

    return true;
  });
  const isSelectedPlaceFavorite = myFavorites.some(
    (obj) => obj._id === uiSelectedPlace?._id,
  );

  // --- Callbacks for Child Components ---
  const handleFavoriteChange = useCallback(
    async (newStatus: boolean) => {
      if (!currentUser) {
        alert("You can add favorite after sign in.");
        return;
      }
      await favoriteMutation.mutateAsync({
        actionType: newStatus ? "add" : "delete",
        culturalSiteId: uiSelectedPlace?._id || "",
      });
    },
    [favoriteMutation, uiSelectedPlace?._id, currentUser],
  );

  const handleReviewActionCompleted = useCallback(
    async (
      actionType: "create" | "update" | "delete",
      newRating: number | null, // null 허용
      oldRating: number | null, // oldRating 추가
      comment?: string, // 선택적 인자로 변경
    ) => {
      if (!currentUser) {
        alert("Please sign in...");
        return;
      }

      if (!uiSelectedPlace?._id) {
        console.error("No place selected");
        return;
      }

      await reviewMutation.mutateAsync({
        actionType,
        placeId: uiSelectedPlace._id,
        reviewId: actionType === "create" ? undefined : userReview?._id,
        reviewData:
          actionType === "delete"
            ? undefined
            : {
                rating: newRating ?? 0, // null일 경우 기본값 처리
                comment: comment ?? "",
              },
        oldRating: oldRating ?? undefined,
      });
    },
    [reviewMutation, uiSelectedPlace?._id, userReview?._id, currentUser],
  );

  const handleNameClick = useCallback(() => {
    if (selectedPlaceData) {
      setJumpToPlace(selectedPlaceData);
    }
  }, [selectedPlaceData, setJumpToPlace]);

  // --- Loading / Error / No Data Handling (within SidePanelItems) ---
  if (!selectedPlaceData) {
    return <ErrorMessage message="Can't get data from the place." />;
  }

  return (
    <>
      {/* Header Section */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {currentUser && (
          <button
            onClick={() => handleFavoriteChange(!isSelectedPlaceFavorite)}
            className={`text-xl p-1 hover:cursor-pointer ${
              favoriteMutation.isPending ? "opacity-50 cursor-not-allowed" : ""
            } ${
              isSelectedPlaceFavorite
                ? "text-yellow-400"
                : "text-gray-400 hover:text-yellow-300"
            }`}
            disabled={favoriteMutation.isPending}
          >
            {isSelectedPlaceFavorite ? <BsStarFill /> : <BsStar />}
          </button>
        )}
        <h2
          className="text-2xl font-bold text-gray-800 break-words pr-2 cursor-pointer hover:underline break-all"
          onClick={handleNameClick}
        >
          {selectedPlaceData.name}
        </h2>
        <button
          className="text-gray-500 hover:text-gray-700 text-4xl font-bold hover:cursor-pointer p-1"
          onClick={closeSidePanel}
        >
          &times;
        </button>
      </div>

      {/* Always display Review Summary and Expansion Section */}
      <div className="border-b border-gray-200">
        <div
          className="flex items-center justify-between p-3 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors duration-200 mx-4 my-2"
          onClick={toggleReviewsExpansion}
        >
          <h3 className="text-lg font-semibold text-blue-800 flex-grow">
            {selectedPlaceData.reviewCount === 1 ? "Review" : "Reviews"} (
            {selectedPlaceData.reviewCount || 0})
          </h3>
          {selectedPlaceData.averageRating !== undefined &&
            selectedPlaceData.averageRating !== null &&
            selectedPlaceData.reviewCount != undefined &&
            selectedPlaceData.reviewCount > 0 && (
              <div className="flex items-center">
                <div className="flex text-yellow-500 text-base mr-2">
                  {[...Array(5)].map((_, i) => (
                    <StarIcon
                      key={i}
                      rating={selectedPlaceData.averageRating!}
                      index={i}
                      className="w-5 h-5"
                      displayMode="averageRating"
                    />
                  ))}
                </div>
                <span className="text-blue-800 font-bold">
                  {selectedPlaceData.averageRating.toFixed(1)}
                </span>
              </div>
            )}
          <span className="ml-4 text-gray-500">
            {isReviewsExpanded ? "▲" : "▼"}
          </span>
        </div>
      </div>

      {/* Panel Content - Conditional Rendering based on isReviewsExpanded */}
      {isReviewsExpanded ? (
        <div className="flex-grow overflow-y-auto">
          {currentUser ? (
            <ReviewForm
              placeId={selectedPlaceData._id}
              userReview={userReview}
              onReviewActionCompleted={handleReviewActionCompleted}
              currentUser={currentUser}
              isSubmitting={reviewMutation.isPending}
              submitError={
                reviewMutation.isError ? reviewMutation.error?.message : null
              }
            />
          ) : (
            <div className="p-4 bg-white border-b border-gray-200">
              <p className="text-gray-700 text-center font-medium">
                Please Sign in to write down review
              </p>
            </div>
          )}

          {loadingReviews && (
            <div className="p-4 text-center text-gray-500">
              Loading reviews...
            </div>
          )}
          {reviewFetchError && (
            <ErrorMessage
              message={reviewsError?.message || "Failed to fetch reviews."}
            />
          )}
          {!loadingReviews && !reviewFetchError && reviews.length === 0 && (
            <p className="p-4 text-center text-gray-500">No reviews yet.</p>
          )}
          <ReviewDisplay reviews={otherReviews} currentUser={currentUser} />
        </div>
      ) : (
        <div className="flex-grow p-4 overflow-y-auto">
          {/* Photos section - currently commented out */}
          {/* {selectedPlaceData.imageUrl && (
            <div className="mb-4">
              <img
                src={selectedPlaceData.imageUrl}
                alt={selectedPlaceData.name}
                className="w-full h-48 object-cover rounded-lg shadow-sm"
              />
            </div>
          )} */}

          {/* Basic Info Section - Restored original font size, enhanced styling */}
          <div className="mb-6 bg-white p-5 rounded-lg shadow-md border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-3 pb-2 border-b-2 border-blue-100">
              Basic Information
            </h3>
            {selectedPlaceData.category && (
              <p className="text-sm text-gray-700 mb-2 leading-relaxed">
                <span className="font-semibold text-blue-600">Category: </span>
                {selectedPlaceData.category
                  ?.replace(/_/g, " ")
                  .split(" ")
                  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(" ") || "N/A"}
              </p>
            )}
            {selectedPlaceData.address && (
              <p className="text-sm text-gray-700 mb-2 leading-relaxed">
                <span className="font-semibold text-blue-600">Address: </span>
                {selectedPlaceData.address}
              </p>
            )}
            {selectedPlaceData.website && (
              <p className="text-sm text-gray-700 mb-2 leading-relaxed">
                <span className="font-semibold text-blue-600">Website: </span>
                <a
                  href={selectedPlaceData.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline transition-colors duration-200"
                >
                  Visit Website
                </a>
              </p>
            )}
            {selectedPlaceData.openingHours && (
              <p className="text-sm text-gray-700 mb-2 leading-relaxed">
                <span className="font-semibold text-blue-600">
                  Opening Hours:{" "}
                </span>
                {selectedPlaceData.openingHours}
              </p>
            )}
          </div>

          {/* Description Section - Restored original font size, enhanced styling */}
          {selectedPlaceData.description && (
            <div className="mb-6 bg-white p-5 rounded-lg shadow-md border border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 mb-3 pb-2 border-b-2 border-blue-100">
                Description
              </h3>
              <p className="text-sm text-gray-700 leading-relaxed">
                {selectedPlaceData.description}
              </p>
            </div>
          )}

          {/* Message if no additional info */}
          {!selectedPlaceData.description &&
            !selectedPlaceData.website &&
            !selectedPlaceData.openingHours &&
            selectedPlaceData.reviewCount === 0 && (
              <p className="text-gray-600 text-center py-8 text-md">
                No additional information available.
              </p>
            )}
        </div>
      )}
    </>
  );
};

export default SidePanelItems;
