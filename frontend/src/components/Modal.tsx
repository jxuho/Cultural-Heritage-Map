import React, { useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import useUiStore from "../store/uiStore"; 

const Modal: React.FC = () => {
  // Get state and actions from the store. 
  // (The type is automatically inferred as defined in the interface.)
  const { isModalOpen, modalContent, closeModal } = useUiStore();
  
  // Specify the HTMLDivElement type in Ref.
  const modalRef = useRef<HTMLDivElement>(null);

  // Prevent body scrolling when modal opens
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

  // Close modal with ESC key
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

  // Doesn't render anything when the modal is closed
  if (!isModalOpen) return null;

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 z-1000 flex items-center justify-center bg-black/30"
      onClick={(e: React.MouseEvent<HTMLDivElement>) => {
        // Cast e.target to Node to achieve type compatibility with the contains method.
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
        {/* close button */}
        <button
          onClick={closeModal}
          className="absolute top-2 right-4 text-gray-500 hover:text-gray-700 text-2xl font-bold hover:cursor-pointer"
          type="button"
        >
          &times;
        </button>

        {/* Modal content: ReactNode type, so it can be rendered stably */}
        {modalContent}
      </div>
    </div>,
    document.body
  );
};

export default Modal;