import { useState } from 'react';
import useFilterStore from '../store/filterStore';

function FilterPanel() {
  const selectedCategories = useFilterStore((state) => state.selectedCategories);
  const toggleCategory = useFilterStore((state) => state.toggleCategory);

  const [isOpen, setIsOpen] = useState(false); // 기본적으로 닫힌 상태로 시작 (지도 위에 버튼만 보일 때)

  const categories = [
    'artwork', 'gallery', 'museum', 'restaurant', 'theatre',
    'arts_centre', 'community_centre', 'library', 'cinema', 'other',
  ];

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  return (
    // 배경색과 그림자는 패널이 펼쳐질 때만 보이도록 조건부 적용
    <div className={`
      relative
      transition-all duration-300 ease-in-out
      ${isOpen ? 'bg-white shadow-lg rounded-lg p-2' : ''} // 펼쳐졌을 때 스타일
    `}>
      {/* 토글 버튼 */}
      <button
        onClick={handleToggle}
        className={`
          flex items-center justify-center
          px-4 py-2 rounded-full font-medium
          transition-colors duration-200 ease-in-out
          ${isOpen ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
          ${isOpen ? 'mb-2' : ''} // 펼쳐졌을 때 아래 여백
          min-w-[120px] // 버튼 최소 너비 설정
        `}
      >
        <span className="mr-2">
          {isOpen ? 'Close Filters' : 'Open Filters'}
        </span>
        <svg
          className={`w-4 h-4 transform transition-transform duration-300 ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M19 9l-7 7-7-7"
          ></path>
        </svg>
      </button>

      {/* 카테고리 버튼 컨테이너 (접혔을 때는 숨김) */}
      <div
        className={`
          grid transition-all duration-300 ease-in-out
          ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 pointer-events-none'}
        `}
      >
        <div className="overflow-hidden">
          <div className="flex flex-wrap justify-center gap-2 pb-2"> {/* 버튼 자체 패딩은 px-4 py-2에 있으므로 여기서는 padding-bottom만 */}
            {categories.map((category) => (
              <button
                key={category}
                onClick={(e) => {
                  e.stopPropagation(); // 버튼 클릭 시 패널이 접히지 않도록 이벤트 전파 중단
                  toggleCategory(category);
                }}
                className={`
                  px-3 py-1.5 rounded-full text-xs font-medium // 좀 더 작게 조정
                  transition-colors duration-200 ease-in-out
                  ${
                    selectedCategories.includes(category)
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
              >
                {category.replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
              </button>
            ))}
          </div>
          {/* 선택된 카테고리 표시 (선택 사항)
          {selectedCategories.length > 0 && (
             <div className="mt-2 text-center text-xs text-gray-600 px-2 pb-2">
               선택됨: {selectedCategories.map(cat => cat.replace(/_/g, ' ')).join(', ')}
             </div>
           )} */}
        </div>
      </div>
    </div>
  );
}

export default FilterPanel;