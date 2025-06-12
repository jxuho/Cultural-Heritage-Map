import { useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import useModalStore from "../store/modalStore"; // Zustand 스토어 경로를 맞게 설정하세요.

const Modal = () => {
  const { isOpen, modalContent, closeModal } = useModalStore();
  const modalRef = useRef(null);

  // 모달이 열릴 때 body 스크롤 방지
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset"; // 클린업 함수
    };
  }, [isOpen]);

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === "Escape") {
        closeModal();
      }
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscapeKey);
    }
    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [isOpen, closeModal]);

  if (!isOpen) return null;

  // Portal을 사용하여 body 직계 자식으로 렌더링
  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/30"
      onClick={(e) => {
        // 오버레이 클릭 시 모달 닫기
        // 모달 콘텐츠 내부 클릭은 무시
        if (modalRef.current && !modalRef.current.contains(e.target)) {
          closeModal();
        }
      }}
    >
      <div
        ref={modalRef}
        className="relative bg-white p-6 rounded-lg shadow-xl max-w-lg w-full transform transition-all duration-300 ease-out scale-95 opacity-0 data-[state=open]:scale-100 data-[state=open]:opacity-100"
        data-state={isOpen ? "open" : "closed"} // Tailwind transition을 위한 data 속성
      >
        {/* 닫기 버튼 (선택 사항) */}
        <button
          onClick={closeModal}
          className="absolute top-2 right-4 text-gray-500 hover:text-gray-700 text-2xl font-bold hover:cursor-pointer"
        >
          &times;
        </button>

        {/* 모달 콘텐츠 */}
        {modalContent}
      </div>
    </div>,
    document.body // body 태그 아래에 렌더링
  );
};

export default Modal;
