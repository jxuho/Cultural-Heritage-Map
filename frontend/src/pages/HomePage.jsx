import { useState, useEffect } from 'react';
import axios from 'axios';
import MapComponent from "../components/MapComponent.jsx";
import SidePanel from "../components/SidePanel/SidePanel.jsx";
import FilterPanel from "../components/FilterPanel.jsx"; // FilterPanel 임포트

const HomePage = () => {
  const [culturalSites, setCulturalSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/v1/cultural-sites?limit=1000");
        const culturalSitesArray = response.data.data.culturalSites;
        setCulturalSites(culturalSitesArray);
      } catch (err) {
        setError("Failed to fetch locations. Please check your backend server.");
        console.error("Error fetching locations:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLocations();
  }, []);

  if (loading) return <div className="flex justify-center items-center h-screen text-xl font-semibold">지도 데이터를 불러오는 중입니다...</div>;
  if (error) return <div className="flex justify-center items-center h-screen text-xl text-red-600">오류: {error}</div>;

  return (
    // <div className="relative flex h-screen w-screen"> {/* relative 추가 */}
    <>
      <MapComponent
        culturalSites={culturalSites}
      />
      {/* FilterPanel을 지도 위에 오버레이 */}
      <div className="absolute top-4 left-4 z-20"> {/* 지도 상단 좌측에 위치 (z-index 조정) */}
        <FilterPanel />
      </div>
      <SidePanel />
      </>
    // </div>
  );
}

export default HomePage;