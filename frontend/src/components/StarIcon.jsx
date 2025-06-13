// 반쪽 별 아이콘을 위한 SVG Path (Full Star와 Half Star SVG Path를 정의합니다)
// Google Fonts Icons (Filled star)와 유사한 형태입니다.
const FULL_STAR_PATH = "M10 15.27L16.18 19l-1.64-7.03L20 8.24l-7.19-.61L10 1l-2.81 6.63L0 8.24l5.46 3.73L3.82 19z";
const HALF_STAR_PATH = "M10 1L7.19 7.63 0 8.24l5.46 3.73L3.82 19l6.18-3.73z"; // 왼쪽 절반만 채워지는 형태

const StarIcon = ({ rating, index }) => {
    // 별점을 "반올림"하여 최종적으로 몇 개의 FULL_STAR를 보여줄지 결정합니다.
    // 예를 들어, 4.2는 4, 4.3은 4.5, 4.8은 5로 처리
    let normalizedRating = rating;

    // 소수점 부분을 추출
    const decimalPart = rating - Math.floor(rating);

    if (decimalPart >= 0.2 && decimalPart < 0.3) {
        // x.2는 내림
        normalizedRating = Math.floor(rating);
    } else if (decimalPart >= 0.3 && decimalPart < 0.8) {
        // x.3 ~ x.7은 반 개 처리
        normalizedRating = Math.floor(rating) + 0.5;
    } else if (decimalPart >= 0.8) {
        // x.8 이상은 올림
        normalizedRating = Math.floor(rating) + 1;
    } else {
        // x.0, x.1은 내림 (기존 Math.floor와 동일)
        normalizedRating = Math.floor(rating);
    }

    const floorNormalizedRating = Math.floor(normalizedRating);
    const hasHalfStar = normalizedRating - floorNormalizedRating >= 0.5;

    if (index < floorNormalizedRating) {
        // 완벽하게 채워진 별
        return (
            <svg
                className="w-5 h-5 text-yellow-400"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path d={FULL_STAR_PATH}></path>
            </svg>
        );
    } else if (index === floorNormalizedRating && hasHalfStar) {
        // 반쪽 채워진 별
        return (
            <svg
                className="w-5 h-5 text-yellow-400"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path d={HALF_STAR_PATH}></path>
                {/* 비어있는 별의 나머지 절반을 투명하게 렌더링하여 완전한 별의 형태를 유지 (배경색 위) */}
                <path d="M10 15.27L16.18 19l-1.64-7.03L20 8.24l-7.19-.61L10 1z" fill="transparent" stroke="currentColor" strokeWidth="0" className="text-gray-300"></path>
            </svg>
        );
    } else {
        // 비어있는 별
        return (
            <svg
                className="w-5 h-5 text-gray-300"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path d={FULL_STAR_PATH}></path>
            </svg>
        );
    }
};

export default StarIcon; // StarIcon 컴포넌트를 별도 파일로 분리하는 경우