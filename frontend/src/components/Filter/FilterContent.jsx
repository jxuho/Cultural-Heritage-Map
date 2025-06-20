// src/components/Filter/FilterContent.jsx
import React, { useMemo } from "react";
import useFilterStore from "../../store/filterStore";
import { CULTURAL_CATEGORY } from "../../config/culturalSiteConfig";
import debounce from "lodash.debounce";
import { categoryBorderColors } from "../../config/colors"; // <--- IMPORT HERE

const FilterContent = React.forwardRef(
  ({ isOpen, floatingStyles, ...props }, ref) => {
    const selectedCategories = useFilterStore(
      (state) => state.selectedCategories
    );
    const toggleCategory = useFilterStore((state) => state.toggleCategory);
    const searchQuery = useFilterStore((state) => state.searchQuery);
    const setSearchQuery = useFilterStore((state) => state.setSearchQuery);
    const [localSearchInput, setLocalSearchInput] = React.useState(searchQuery);

    const debouncedSetSearchQuery = useMemo(
      () =>
        debounce((value) => {
          setSearchQuery(value);
        }, 300),
      [setSearchQuery]
    );

    const handleSearchInputChange = (e) => {
      const value = e.target.value;
      setLocalSearchInput(value);
      debouncedSetSearchQuery(value);
    };

    const handleClearSearch = () => {
      setLocalSearchInput("");
      setSearchQuery("");
      debouncedSetSearchQuery.cancel();
    };

    const isPositioned =
      floatingStyles &&
      typeof floatingStyles.left === "number" &&
      typeof floatingStyles.top === "number";

    return (
      <div
        ref={ref}
        style={floatingStyles}
        className={`
          bg-white shadow-lg rounded-lg p-2
          transition-opacity duration-300
          ${
            isOpen && isPositioned
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 pointer-events-none"
          }
        `}
        {...props}
      >
        <div className="flex flex-wrap justify-center gap-2 pb-2">
          {CULTURAL_CATEGORY.map((category) => {
            const isCategorySelected = selectedCategories.includes(category);
            // Use the imported categoryBorderColors
            const categorySpecificBorderColor =
              categoryBorderColors[category] || categoryBorderColors.other;

            // Define inline style for the border color
            const buttonBorderStyle = {
              borderColor: isCategorySelected
                ? categorySpecificBorderColor
                : "transparent",
              borderWidth: "3px", // Ensure border width is applied
              borderStyle: "solid", // Ensure border style is applied
            };

            return (
              <button
                key={category}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleCategory(category);
                }}
                // Apply inline style for border
                style={buttonBorderStyle}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors
                  ${
                    isCategorySelected
                      ? // Keep default background/text and add shadow when selected
                        `bg-gray-100 text-gray-700 shadow-md`
                      : // If not selected, use default gray background and no explicit shadow
                        `bg-gray-100 text-gray-700 hover:bg-gray-200`
                  }`}
              >
                {category
                  .replace(/_/g, " ")
                  .replace(/\b\w/g, (c) => c.toUpperCase())}
              </button>
            );
          })}
        </div>

        <div className="p-2 relative">
          <input
            type="text"
            value={localSearchInput}
            onChange={handleSearchInputChange}
            placeholder="Search by name or description..."
            className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 pr-10"
          />
          {localSearchInput && (
            <button
              onClick={handleClearSearch}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              aria-label="Clear search"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                ></path>
              </svg>
            </button>
          )}
        </div>
      </div>
    );
  }
);

export default FilterContent;