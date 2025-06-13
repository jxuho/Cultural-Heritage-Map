import { create } from 'zustand';
import { devtools } from 'zustand/middleware'

// 필터 관련 상태를 관리하는 스토어 생성
const useFilterStore = create(devtools((set) => ({
  selectedCategories: [], // 초기 선택된 카테고리 없음

  // 카테고리 추가/제거 액션
  toggleCategory: (category) =>
    set((state) => {
      if (state.selectedCategories.includes(category)) {
        // 이미 선택된 카테고리라면 제거
        return {
          selectedCategories: state.selectedCategories.filter(
            (cat) => cat !== category
          ),
        };
      } else {
        // 선택되지 않은 카테고리라면 추가
        return {
          selectedCategories: [...state.selectedCategories, category],
        };
      }
    }),

  // 모든 필터 초기화 (선택적)
  resetFilters: () => set({ selectedCategories: [] }),
})));

export default useFilterStore;