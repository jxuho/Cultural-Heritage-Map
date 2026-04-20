import React, { useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import useUiStore from "../store/uiStore"; 

const Modal: React.FC = () => {
  // 스토어에서 상태와 액션을 가져옵니다. 
  // (인터페이스에 정의된 대로 타입을 자동으로 추론합니다.)
  const { isModalOpen, modalContent, closeModal } = useUiStore();
  
  // Ref에 HTMLDivElement 타입을 명시합니다.
  const modalRef = useRef<HTMLDivElement>(null);

  // 모달이 열릴 때 body 스크롤 방지
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isModalOpen]);

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeModal();
      }
    };
    
    if (isModalOpen) {
      document.addEventListener("keydown", handleEscapeKey);
    }
    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [isModalOpen, closeModal]);

  // 모달이 닫혀있으면 아무것도 렌더링하지 않음
  if (!isModalOpen) return null;

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/30"
      onClick={(e: React.MouseEvent<HTMLDivElement>) => {
        // e.target을 Node로 캐스팅하여 contains 메서드와의 타입 호환성을 맞춥니다.
        if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
          closeModal();
        }
      }}
    >
      <div
        ref={modalRef}
        className="relative bg-white p-6 rounded-lg shadow-xl max-w-lg w-full transform transition-all duration-300 ease-out scale-95 opacity-0 data-[state=open]:scale-100 data-[state=open]:opacity-100"
        data-state={isModalOpen ? "open" : "closed"}
      >
        {/* 닫기 버튼 */}
        <button
          onClick={closeModal}
          className="absolute top-2 right-4 text-gray-500 hover:text-gray-700 text-2xl font-bold hover:cursor-pointer"
          type="button"
        >
          &times;
        </button>

        {/* 모달 콘텐츠: ReactNode 타입이므로 안정적으로 렌더링 가능 */}
        {modalContent}
      </div>
    </div>,
    document.body
  );
};

export default Modal;