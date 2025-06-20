// src/components/Filter/FilterButton.jsx 
import React from 'react';

const FilterButton = React.forwardRef(({ isOpen, onClick, ...props }, ref) => (
  <button
    ref={ref}
    onClick={onClick}
    className={`flex items-center justify-center px-4 py-2 rounded-full font-medium transition-colors duration-200 ${
      isOpen
        ? "bg-blue-600 text-white hover:bg-blue-700 mb-2"
        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
    } min-w-[120px]`}
    {...props}
  >
    <span className="mr-2">
      {isOpen ? "Close Filters" : "Open Filters"}
    </span>
    <svg
      className={`w-4 h-4 transform transition-transform duration-300 ${
        isOpen ? "rotate-180" : ""
      }`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M19 9l-7 7-7-7"
      ></path>
    </svg>
  </button>
));

export default FilterButton;