// src/components/SidePanel/SidePanelItems.jsx
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
import ErrorMessage from "../ErrorMessage"; // ErrorDisplay 대신 ErrorMessage 사용

const SidePanelItems = ({ isReviewsExpanded, toggleReviewsExpansion }) => {
  // --- Zustand (UI State Management) ---
  const currentUser = useAuthStore((state) => state.user);
  const uiSelectedPlace = useUiStore((state) => state.selectedPlace);
  const closeSidePanel = useUiStore((state) => state.closeSidePanel);
  const setJumpToPlace = useUiStore((state) => state.setJumpToPlace); // setJumpToPlace 액션 추가

  // --- TanStack Query: Data Fetching Hooks (Local to SidePanelItems) ---
  // SidePanel에서 이미 로딩/에러를 처리했으므로, 여기서는 데이터 자체에 집중합니다.
  const { data: selectedPlaceData } = useCulturalSiteDetail(
    uiSelectedPlace?._id
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
    reviews.find((review) => review.user?._id === currentUser?._id) || null;
  const otherReviews = reviews.filter(
    (review) => review.user?._id !== currentUser?._id
  );
  const isSelectedPlaceFavorite = myFavorites.some(
    (obj) => obj._id === uiSelectedPlace?._id
  );

  // --- Callbacks for Child Components ---
  const handleFavoriteChange = useCallback(
    async (newStatus) => {
      if (!currentUser) {
        alert("You can add favorite after sign in.");
        return;
      }
      // favoriteMutation 훅 내부에서 에러 처리 및 캐시 업데이트가 이루어짐
      await favoriteMutation.mutateAsync({
        actionType: newStatus ? "add" : "delete",
        culturalSiteId: uiSelectedPlace._id,
      });
    },
    [favoriteMutation, uiSelectedPlace?._id, currentUser]
  );

  const handleReviewActionCompleted = useCallback(
    async (actionType, newRating, oldRating, comment) => {
      if (!currentUser) {
        alert("Please sign in in order to create/update/delete review.");
        return;
      }
      // reviewMutation 훅 내부에서 에러 처리 및 캐시 업데이트가 이루어짐
      await reviewMutation.mutateAsync({
        actionType,
        placeId: uiSelectedPlace._id,
        reviewId: actionType === "create" ? undefined : userReview?._id,
        reviewData:
          actionType === "delete"
            ? undefined
            : { rating: newRating, comment: comment },
        oldRating: oldRating,
      });
    },
    [reviewMutation, uiSelectedPlace?._id, userReview, currentUser]
  );

  const handleNameClick = useCallback(() => {
    if (selectedPlaceData) {
      setJumpToPlace(selectedPlaceData);
    }
  }, [selectedPlaceData, setJumpToPlace]);

  // --- Loading / Error / No Data Handling (within SidePanelItems) ---
  // SidePanel에서 이미 초기 로딩/에러/선택된 장소 없음 상태를 처리했으므로,
  // 여기 `SidePanelItems`는 `selectedPlaceData`가 유효하다는 전제 하에 렌더링됩니다.
  // 그럼에도 불구하고 방어적인 코딩을 위해 `!selectedPlaceData` 체크는 유지합니다.
  if (!selectedPlaceData) {
    return <ErrorMessage message="Can't get data from the place." />;
  }

  return (
    <>
      {/* Header Section */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {/* 즐겨찾기 버튼 */}
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
          className="text-2xl font-bold text-gray-800 break-words pr-2 cursor-pointer hover:underline break-all" // Add cursor-pointer and hover:underline for visual cue
          onClick={handleNameClick} // Add onClick handler
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
            selectedPlaceData.reviewCount > 0 && (
              <div className="flex items-center">
                <div className="flex text-yellow-500 text-base mr-2">
                  {[...Array(5)].map((_, i) => (
                    <StarIcon
                      key={i}
                      rating={selectedPlaceData.averageRating}
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

          {/* 리뷰 로딩 및 에러 상태는 ReviewDisplay에 직접 전달하는 대신, SidePanelItems에서 처리하거나 
              ReviewDisplay 내부에서 자체적으로 처리하도록 유도할 수 있습니다. 
              여기서는 SidePanelItems에서 직접 처리하는 방식으로 유지합니다. */}
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
          <ReviewDisplay
            reviews={otherReviews}
            currentUser={currentUser}
            // ReviewDisplay에 loading, error props는 더 이상 전달하지 않습니다.
          />
        </div>
      ) : (
        <div className="flex-grow p-4 overflow-y-auto">
          {/* ... (기존 사진, 기본 정보, 설명 섹션 - 변경 없음) */}
          {/* 사진 업로드 해결될 때까지는 주석처리. */}
          {/* {selectedPlaceData.imageUrl && (
            <div className="mb-4">
              <img
                src={'selectedPlaceData.imageUrl'}
                alt={selectedPlaceData.name}
                className="w-full h-48 object-cover rounded-lg shadow-sm"
              />
            </div>
          )} */}

          {/* Basic Info Section */}
          <div className="mb-6">
            <p className="text-sm text-gray-500 mb-1">
              <span className="font-semibold text-gray-700">Category: </span>
              {selectedPlaceData.category
                ?.replace(/_/g, " ")
                .split(" ")
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(" ") || "N/A"}
            </p>
            {selectedPlaceData.address && (
              <p className="text-gray-700 mb-1">
                <span className="font-semibold">Address: </span>
                {selectedPlaceData.address}
              </p>
            )}
            {selectedPlaceData.website && (
              <p className="text-gray-700 mb-1">
                <span className="font-semibold">Website: </span>
                <a
                  href={selectedPlaceData.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Visit
                </a>
              </p>
            )}
            {selectedPlaceData.openingHours && (
              <p className="text-gray-700 mb-1">
                <span className="font-semibold">Opening Hours: </span>
                {selectedPlaceData.openingHours}
              </p>
            )}
          </div>

          {/* Description Section */}
          {selectedPlaceData.description && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Description
              </h3>
              <p className="text-gray-700 leading-relaxed">
                {selectedPlaceData.description}
              </p>
            </div>
          )}

          {/* Message if no additional info */}
          {!selectedPlaceData.description &&
            !selectedPlaceData.website &&
            !selectedPlaceData.openingHours &&
            selectedPlaceData.reviewCount === 0 && (
              <p className="text-gray-600 text-center py-8">
                No additional info.
              </p>
            )}
        </div>
      )}
    </>
  );
};

export default SidePanelItems;
