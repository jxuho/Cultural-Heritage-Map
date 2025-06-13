import { useState, useEffect } from 'react';
import axios from 'axios';
import MapComponent from "../components/MapComponent.jsx";
import SidePanel from "../components/SidePanel/SidePanel.jsx";

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
    <>
      <MapComponent
        culturalSites={culturalSites} // 여전히 모든 원본 데이터는 MapComponent에 전달
        // selectedCategories는 이제 MapComponent 내부에서 Zustand 스토어로부터 직접 가져옴
      />
      <SidePanel
        // selectedCategories와 onCategoryChange prop은 더 이상 필요 없음
        // SidePanel 내부의 FilterPanel이 직접 Zustand 스토어에 접근함
      />
    </>
  );
}

export default HomePage;



// import MapComponent from "../components/MapComponent.jsx";
// import SidePanel from "../components/SidePanel/SidePanel.jsx";

// const HomePage = () => {
//   return (
//     <>
//       <MapComponent />
//       <SidePanel />
//     </>
//   );
// }

// export default HomePage;
