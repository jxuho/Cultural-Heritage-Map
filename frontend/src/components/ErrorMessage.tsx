import React from "react";

interface ErrorMessageProps {
  message: string;
  onClose?: () => void;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onClose }) => {
  return (
    <div className="p-4 text-red-700 bg-red-100 border border-red-200 rounded relative">
      {onClose && (
        <div className="absolute top-4 right-4">
          <button
            type="button" // 폼 내부에서 의도치 않은 제출 방지
            className="text-gray-500 hover:text-gray-700 text-4xl font-bold hover:cursor-pointer p-1"
            onClick={onClose}
            aria-label="Close error message"
          >
            &times;
          </button>
        </div>
      )}
      {/* 에러 메시지 렌더링 */}
      <p className="pr-10">Error: {message}</p> 
    </div>
  );
};

export default ErrorMessage;