import React from 'react';

// Props 인터페이스 정의
interface StarIconProps {
  rating: number;
  index: number;
  className?: string;
  onClick?: (event: React.MouseEvent<SVGSVGElement>) => void;
  displayMode?: 'reviewForm' | 'averageRating';
}

const FULL_STAR_PATH = "M10 15.27L16.18 19l-1.64-7.03L20 8.24l-7.19-.61L10 1l-2.81 6.63L0 8.24l5.46 3.73L3.82 19z";
const HALF_STAR_PATH = "M10 1L7.19 7.63 0 8.24l5.46 3.73L3.82 19l6.18-3.73z";

const StarIcon: React.FC<StarIconProps> = ({ 
  rating, 
  index, 
  className = "", 
  onClick, 
  displayMode = 'reviewForm' 
}) => {
  const starValue = index + 1; // 이 별이 나타내는 점수 (1부터 5까지)

  let isFilled = false;
  let hasHalfStar = false;

  if (displayMode === 'reviewForm') {
    // ReviewForm에서는 정수 단위로만 채움
    isFilled = starValue <= rating;
  } else if (displayMode === 'averageRating') {
    // SidePanel (평균 별점)에서는 0.5 단위로 처리
    let normalizedRating = rating;
    const decimalPart = rating - Math.floor(rating);

    if (decimalPart >= 0.2 && decimalPart < 0.3) {
      normalizedRating = Math.floor(rating); // x.2는 버림
    } else if (decimalPart >= 0.3 && decimalPart < 0.8) {
      normalizedRating = Math.floor(rating) + 0.5; // x.3 ~ x.7은 반개
    } else if (decimalPart >= 0.8) {
      normalizedRating = Math.floor(rating) + 1; // x.8 이상은 올림
    } else {
      normalizedRating = Math.floor(rating); // x.0, x.1은 버림
    }

    const floorNormalizedRating = Math.floor(normalizedRating);
    hasHalfStar = (normalizedRating - floorNormalizedRating) >= 0.5;

    isFilled = starValue <= floorNormalizedRating;
    
    if (starValue === floorNormalizedRating + 1 && hasHalfStar) {
      isFilled = false; // 반쪽 별을 위해 현재 별은 채우지 않음
    }
  }

  const fillColorClass = isFilled ? "text-yellow-400" : "text-gray-300";

  // 반쪽 별을 위한 조건부 렌더링
  const renderHalfStarOverlay = (
    displayMode === 'averageRating' && 
    starValue === Math.floor(rating) + 1 && 
    hasHalfStar
  );

  return (
    <svg
      className={className}
      fill="currentColor"
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
      onClick={onClick}
    >
      {/* 기본 별 (채워지거나 비어있거나) */}
      <path className={fillColorClass} d={FULL_STAR_PATH}></path>

      {/* 반쪽 별 오버레이 (평균 별점 모드에서만) */}
      {renderHalfStarOverlay && (
        <React.Fragment>
          {/* 채워진 반쪽 */}
          <path className="text-yellow-400" d={HALF_STAR_PATH}></path>
          {/* 비어있는 나머지 반쪽 */}
          <path 
            className="text-gray-300" 
            d="M10 15.27L16.18 19l-1.64-7.03L20 8.24l-7.19-.61L10 1z" 
            fill="transparent" 
          />
        </React.Fragment>
      )}
    </svg>
  );
};

export default StarIcon;