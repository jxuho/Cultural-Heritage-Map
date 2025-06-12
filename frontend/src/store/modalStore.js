import { create } from 'zustand';

const useModalStore = create((set) => ({
  isOpen: false,
  modalContent: null, // 모달 내부에 렌더링할 JSX 또는 컴포넌트
  openModal: (content) => set({ isOpen: true, modalContent: content }),
  closeModal: () => set({ isOpen: false, modalContent: null }),
}));

export default useModalStore;