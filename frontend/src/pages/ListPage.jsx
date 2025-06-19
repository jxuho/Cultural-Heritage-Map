// src/pages/ListPage.jsx
import React, { useState } from 'react';
import { useAllCulturalSites } from "../hooks/useCulturalSitesQueries";
import FilterPanel from '../components/FilterPanel';
import useFilterStore from '../store/filterStore';
import { FaStar, FaRegStar, FaHeart, FaRegHeart, FaCommentAlt } from 'react-icons/fa'; // NEW: 아이콘 임포트
import useUiStore from '../store/uiStore';
import { useNavigate } from 'react-router';

const ListPage = () => {
  const {
    data: culturalSites = [],
    isLoading,
    isError,
    error,
  } = useAllCulturalSites();

  const selectedCategories = useFilterStore((state) => state.selectedCategories);
  const [sortBy, setSortBy] = useState('alphabetical');

  const openSidePanel = useUiStore((state) => state.openSidePanel);
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 text-center mt-10">
        <h1 className="text-3xl font-bold text-gray-800">Cultural Sites</h1>
        <p className="mt-4 text-gray-600">Loading cultural sites...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container mx-auto p-4 text-center mt-10 text-red-600">
        <h1 className="text-3xl font-bold text-gray-800">Error</h1>
        <p className="mt-4">Failed to load cultural sites: {error.message}</p>
      </div>
    );
  }

  let filteredSites = culturalSites.filter((site) => {
    if (selectedCategories.length === 0) {
      return true;
    }
    return selectedCategories.includes(site.category);
  });

  filteredSites = [...filteredSites].sort((a, b) => {
    switch (sortBy) {
      case 'alphabetical':
        return a.name.localeCompare(b.name);
      case 'reviewsCount':
        // reviewCount 필드가 없으면 0으로 간주
        return (b.reviewCount || 0) - (a.reviewCount || 0);
      case 'averageRating':
        // averageRating 필드가 없으면 0으로 간주
        return (b.averageRating || 0) - (a.averageRating || 0);
      case 'favoritesCount':
        // favoritesCount 필드가 없으면 0으로 간주
        return (b.favoritesCount || 0) - (a.favoritesCount || 0);
      default:
        return 0;
    }
  });

  if (culturalSites.length === 0 && selectedCategories.length === 0) {
      return (
          <div className="container mx-auto p-4 text-center mt-10">
              <h1 className="text-3xl font-bold text-gray-800">Cultural Sites</h1>
              <p className="mt-4 text-gray-600">No cultural sites available.</p>
          </div>
      );
  }

  if (filteredSites.length === 0 && selectedCategories.length > 0) {
    return (
      <div className="container mx-auto p-4 mt-5">
        <div className="mb-4 text-left">
          <FilterPanel />
        </div>
        <div className="text-center mt-10">
            <h1 className="text-3xl font-bold text-gray-800">Cultural Sites</h1>
            <p className="mt-4 text-gray-600">No cultural sites found matching the selected filters.</p>
        </div>
      </div>
    );
  }


  // NEW: 별점을 시각적으로 표시하는 헬퍼 함수
  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    const stars = [];

    for (let i = 0; i < fullStars; i++) {
      stars.push(<FaStar key={`full-${i}`} className="text-yellow-400" />);
    }
    // 하프 스타는 현재 FontAwesome에서 제공되지 않아 일단 풀 스타 또는 빈 별로 처리
    // if (hasHalfStar) {
    //   stars.push(<FaStarHalfAlt key="half" className="text-yellow-400" />);
    // }
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<FaRegStar key={`empty-${i}`} className="text-gray-300" />);
    }
    return stars;
  };
  const handleCardClick = (site) => {
    navigate('/'); // 홈 페이지 (지도 뷰)로 이동
    openSidePanel(site); // 사이드 패널 열고 해당 cultural site 정보 전달
  };

  return (
    <div className="container mx-auto p-4 mt-5">
      <div className="flex justify-between items-start mb-4">
        <div className="text-left">
          <FilterPanel />
        </div>

        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="block appearance-none w-full bg-white border border-gray-300 text-gray-700 py-2 px-4 pr-8 rounded-md leading-tight focus:outline-none focus:bg-white focus:border-blue-500"
          >
            <option value="alphabetical">Sort by Alphabetical</option>
            <option value="reviewsCount">Sort by Reviews Count</option>
            <option value="averageRating">Sort by Average Rating</option>
            <option value="favoritesCount">Sort by Favorites Count</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.757 7.586 5.343 9z"/></svg>
          </div>
        </div>
      </div>

      <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">All Cultural Sites List</h1>
      <p className="text-lg text-gray-600 mb-6 text-center">
        Showing **{filteredSites.length}** cultural sites
        {selectedCategories.length > 0 && ` (filtered by ${selectedCategories.map(cat => cat.replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '))})`}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSites.map((site) => (
          <div
            key={site._id}
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 flex flex-col cursor-pointer" // cursor-pointer 추가
            onClick={() => handleCardClick(site)} // NEW: onClick 이벤트 핸들러 추가
          >
            <h2 className="text-xl font-semibold text-chemnitz-blue mb-2">{site.name}</h2>
            
            <div className="flex items-center text-sm text-gray-700 mb-2">
              {site.averageRating !== undefined && site.averageRating !== null && (
                <div className="flex items-center mr-3">
                  {renderStars(site.averageRating)}
                  <span className="ml-1 font-semibold">{site.averageRating.toFixed(1)}</span>
                </div>
              )}
              
              {site.reviewCount !== undefined && site.reviewCount !== null && (
                <div className="flex items-center mr-3">
                  <FaCommentAlt className="text-blue-500 mr-1" />
                  <span>{site.reviewCount} Reviews</span>
                </div>
              )}

              {site.favoritesCount !== undefined && site.favoritesCount !== null && (
                <div className="flex items-center">
                  <FaHeart className="text-red-500 mr-1" />
                  <span>{site.favoritesCount} Favorites</span>
                </div>
              )}
            </div>

            <p className="text-gray-700 text-sm mb-1">
              <strong>Category:</strong> {site.category.replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
            </p>
            <p className="text-gray-600 text-sm mb-2">{site.address}</p>
            {site.description && (
              <p className="text-gray-800 text-sm line-clamp-3 flex-grow">{site.description}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ListPage;