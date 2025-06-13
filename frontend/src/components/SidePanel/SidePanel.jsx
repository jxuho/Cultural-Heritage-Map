import React, { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import useSidePanelStore from "../../store/sidePanelStore";
import useViewport from "../../hooks/useViewPort";
import StarIcon from '../StarIcon'; // StarIcon 컴포넌트 경로 확인 및 임포트

const SidePanel = () => {
  const isSidePanelOpen = useSidePanelStore((state) => state.isSidePanelOpen);
  const selectedPlace = useSidePanelStore((state) => state.selectedPlace);
  const closeSidePanel = useSidePanelStore((state) => state.closeSidePanel);
  const sidePanelWidth = useSidePanelStore((state) => state.sidePanelWidth);
  const setSidePanelWidth = useSidePanelStore(
    (state) => state.setSidePanelWidth
  );
  const { width: viewportWidth } = useViewport();

  const detailRef = useRef();
  const [isResizing, setIsResizing] = useState(false);
  const [isHover, setIsHover] = useState(false);
  const [resizerPosition, setResizerPosition] = useState(360);

  const [fullReviewsData, setFullReviewsData] = useState(null);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviewError, setReviewError] = useState(null);
  const [isReviewsExpanded, setIsReviewsExpanded] = useState(false);

  const resizerMouseDownHandler = useCallback(() => {
    setIsResizing(true);
  }, []);

  const resizerMouseUpHandler = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (!isResizing) {
      setSidePanelWidth(resizerPosition);
    }
  }, [isResizing, resizerPosition, setSidePanelWidth]);

  const resizeHandler = useCallback(
    (event) => {
      if (!isResizing) return;
      let calculatedPosition =
        detailRef.current.getBoundingClientRect().right - event.clientX;
      if (calculatedPosition > 700) {
        calculatedPosition = 700;
      }
      if (calculatedPosition < 360) {
        calculatedPosition = 360;
      }
      setResizerPosition(calculatedPosition);
    },
    [isResizing]
  );

  useEffect(() => {
    document.addEventListener("mousemove", resizeHandler);
    document.addEventListener("mouseup", resizerMouseUpHandler);
    return () => {
      document.removeEventListener("mousemove", resizeHandler);
      document.removeEventListener("mouseup", resizerMouseUpHandler);
    };
  }, [resizeHandler, resizerMouseUpHandler]);

  useEffect(() => {
    if (viewportWidth - sidePanelWidth < 50 && viewportWidth > 450) {
      setSidePanelWidth(viewportWidth - 50);
      setResizerPosition(viewportWidth - 50);
    } else if (viewportWidth <= 450) {
      setSidePanelWidth(viewportWidth);
      setResizerPosition(viewportWidth);
    }
  }, [viewportWidth, sidePanelWidth, setSidePanelWidth]);

  useEffect(() => {
    if (!isSidePanelOpen || !selectedPlace?._id) {
      setFullReviewsData(null);
      setIsReviewsExpanded(false);
      setLoadingReviews(false);
      setReviewError(null);
    }
  }, [isSidePanelOpen, selectedPlace?._id]);

  const fetchReviews = useCallback(async () => {
    if (!selectedPlace?._id || loadingReviews) return;

    setLoadingReviews(true);
    setReviewError(null);
    try {
      const response = await axios.get(
        `http://localhost:5000/api/v1/cultural-sites/${selectedPlace._id}`
      );
      setFullReviewsData(response.data.data.culturalSite.reviews);
      setIsReviewsExpanded(true);
    } catch (err) {
      console.error("Failed to fetch reviews:", err);
      setReviewError("리뷰를 불러오는 데 실패했습니다.");
      setFullReviewsData([]);
    } finally {
      setLoadingReviews(false);
    }
  }, [selectedPlace?._id, loadingReviews]);

  if (!isSidePanelOpen || !selectedPlace) {
    return null;
  }

  const reviewsToDisplay = fullReviewsData || [];

  return (
    <div
      className="absolute z-[1001] right-0 top-0 h-full shadow-lg bg-white max-w-[700px] flex flex-col"
      ref={detailRef}
      style={
        viewportWidth - sidePanelWidth < 560
          ? {
              width: sidePanelWidth,
              transition: "width 180ms ease",
              position: "absolute",
              right: "0",
              boxShadow:
                "0px 1.2px 3.6px rgba(0,0,0,0.1), 0px 6.4px 14.4px rgba(0,0,0,0.1)",
            }
          : {
              width: sidePanelWidth,
              transition: "width 180ms ease",
              boxShadow:
                "0px 1.2px 3.6px rgba(0,0,0,0.1), 0px 6.4px 14.4px rgba(0,0,0,0.1)",
            }
      }
    >
      {/* resizer */}
      <div
        className={`w-1 absolute top-0 h-full m-0 p-0 box-border bg-gray-500 opacity-0 translate-x-1 ${
          (isHover || isResizing) && "opacity-40 cursor-ew-resize"
        } `}
        onMouseDown={resizerMouseDownHandler}
        onMouseEnter={() => setIsHover(true)}
        onMouseLeave={() => setIsHover(false)}
        style={{ right: resizerPosition, zIndex: "200" }}
      ></div>

      {/* 헤더 섹션: 닫기 버튼, 이름, 카테고리 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-800 break-words pr-2">
          {selectedPlace.name}
        </h2>
        <button
          className="text-gray-500 hover:text-gray-700 text-4xl font-bold hover:cursor-pointer p-1"
          onClick={() => closeSidePanel()}
        >
          &times;
        </button>
      </div>

      {/* 패널 내용 - 스크롤 가능하도록 flex-grow 추가 */}
      <div className="flex-grow p-4 overflow-y-auto">
        {selectedPlace.imageUrl && (
          <div className="mb-4">
            <img
              src={selectedPlace.imageUrl}
              alt={selectedPlace.name}
              className="w-full h-48 object-cover rounded-lg shadow-sm"
            />
          </div>
        )}

        {/* 기본 정보 섹션 */}
        <div className="mb-6">
          <p className="text-sm text-gray-500 mb-1">
            <span className="font-semibold text-gray-700">카테고리:</span>{" "}
            {selectedPlace.category
              ?.replace(/_/g, " ")
              .split(" ")
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(" ") || "N/A"}
          </p>
          {selectedPlace.address && (
            <p className="text-gray-700 mb-1">
              <span className="font-semibold">주소:</span>{" "}
              {selectedPlace.address}
            </p>
          )}
          {selectedPlace.website && (
            <p className="text-gray-700 mb-1">
              <span className="font-semibold">웹사이트:</span>{" "}
              <a
                href={selectedPlace.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                방문하기
              </a>
            </p>
          )}
          {selectedPlace.openingHours && (
            <p className="text-gray-700 mb-1">
              <span className="font-semibold">영업 시간:</span>{" "}
              {selectedPlace.openingHours}
            </p>
          )}
        </div>

        {/* 설명 섹션 */}
        {selectedPlace.description && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">설명</h3>
            <p className="text-gray-700 leading-relaxed">
              {selectedPlace.description}
            </p>
          </div>
        )}

        {/* --- 리뷰 요약 및 확장 섹션 (수정된 부분) --- */}
        {selectedPlace.reviewCount > 0 && (
          <div className="mb-6 border-t border-gray-200 pt-6">
            <div
              className="flex items-center justify-between p-3 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors duration-200"
              onClick={() => {
                if (!isReviewsExpanded) {
                  fetchReviews();
                } else {
                  setIsReviewsExpanded(false);
                }
              }}
            >
              <h3 className="text-lg font-semibold text-blue-800 flex-grow">
                리뷰 ({selectedPlace.reviewCount})
              </h3>
              {selectedPlace.averageRating !== undefined && selectedPlace.averageRating !== null && (
                <div className="flex items-center">
                  <div className="flex text-yellow-500 text-base mr-2">
                    {[...Array(5)].map((_, i) => (
                      <StarIcon
                        key={i}
                        rating={selectedPlace.averageRating}
                        index={i}
                        // 평균 별점은 더 크게 표시하고 싶다면 size prop을 추가할 수 있습니다.
                        // 예: size="large" 그리고 StarIcon 내부에서 해당 prop에 따라 className 변경
                        className="w-5 h-5" // StarIcon 내부에서 이 클래스를 사용하도록 수정했으므로, 여기서는 그냥 전달합니다.
                      />
                    ))}
                  </div>
                  <span className="text-blue-800 font-bold">
                    {selectedPlace.averageRating.toFixed(1)}
                  </span>
                </div>
              )}
              <span className="ml-4 text-gray-500">
                {isReviewsExpanded ? "▲" : "▼"}
              </span>
            </div>

            {isReviewsExpanded && (
              <div className="mt-4">
                {loadingReviews ? (
                  <p className="text-gray-600 text-center py-4">리뷰를 불러오는 중입니다...</p>
                ) : reviewError ? (
                  <p className="text-red-600 text-center py-4">{reviewError}</p>
                ) : reviewsToDisplay.length > 0 ? (
                  <div className="space-y-4">
                    {reviewsToDisplay.map((review) => (
                      <div
                        key={review._id}
                        className="bg-gray-50 p-3 rounded-lg shadow-sm border border-gray-100"
                      >
                        <div className="flex items-center mb-2">
                          {review.user?.profileImage && (
                            <img
                              src={review.user.profileImage}
                              alt={`${review.user.username}'s profile`}
                              className="w-8 h-8 rounded-full object-cover mr-2 border border-gray-200"
                            />
                          )}
                          <p className="font-semibold text-gray-800 mr-2 flex-grow">
                            {review.user?.username || "익명 사용자"}
                          </p>
                          <div className="flex text-yellow-500 text-sm">
                            {[...Array(5)].map((_, i) => (
                              <StarIcon
                                key={i}
                                rating={review.rating}
                                index={i}
                                className="w-4 h-4" // 개별 리뷰 별은 더 작게 표시
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
                          {new Date(review.createdAt).toLocaleDateString(
                            "ko-KR",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            }
                          )}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 text-center py-4">No reviews yet.</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* 모든 선택적 정보가 없을 경우 메시지 */}
        {!selectedPlace.description && !selectedPlace.website && !selectedPlace.openingHours && selectedPlace.reviewCount === 0 && (
          <p className="text-gray-600 text-center py-8">There's no additional info.</p>
        )}
      </div>
    </div>
  );
};

export default SidePanel;