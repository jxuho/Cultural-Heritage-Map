import { useMap } from "react-leaflet";
import { useState } from "react";
import L from "leaflet";
const CurrentLocationButton = () => {
  const map = useMap();
  const [locMarker, setLocMarker] = useState(null);

  const handleClick = () => {
    if (!navigator.geolocation) {
      alert("현재 위치를 사용할 수 없습니다.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        map.setView([latitude, longitude], 16); // 지도 중심 이동

        // 이전 위치 마커 제거
        if (locMarker) {
          map.removeLayer(locMarker);
        }

        // 새 마커 생성
        const marker = L.circleMarker([latitude, longitude], {
          radius: 8,
          color: 'red'
        }).addTo(map);
        setLocMarker(marker);
      },
      () => {
        alert("위치 정보를 가져올 수 없습니다.");
      }
    );
  };

  return (
    <button
      onClick={handleClick}
      className="absolute top-4 right-4 z-[1000] bg-white shadow px-3 py-2 rounded text-sm"
    >
      📍 현재 위치
    </button>
  );
};

export default CurrentLocationButton;