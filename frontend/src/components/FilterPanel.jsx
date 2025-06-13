import useFilterStore from '../store/filterStore'; // Zustand 스토어 임포트

function FilterPanel() {
  // 스토어에서 selectedCategories와 toggleCategory 액션 가져오기
  const selectedCategories = useFilterStore((state) => state.selectedCategories);
  const toggleCategory = useFilterStore((state) => state.toggleCategory);

  const categories = [
    'artwork', 'gallery', 'museum', 'restaurant', 'theatre',
    'arts_centre', 'community_centre', 'library', 'cinema', 'other',
  ];

  return (
    <div className="bg-white p-4 border-b border-gray-200 shadow-sm">
      {/* <h3 className="text-lg font-bold text-gray-800 mb-3 text-center">카테고리 필터</h3> */}
      <div className="flex flex-wrap justify-center gap-2">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => toggleCategory(category)} // Zustand 액션 호출
            className={`
              px-4 py-2 rounded-full text-sm font-medium
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
      {/* {selectedCategories.length > 0 && (
        <div className="mt-4 text-center text-sm text-gray-600">
          선택됨: {selectedCategories.map(cat => cat.replace(/_/g, ' ')).join(', ')}
        </div>
      )} */}
    </div>
  );
}

export default FilterPanel;