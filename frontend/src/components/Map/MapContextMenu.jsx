import { useEffect } from "react";
import useUiStore from "../../store/uiStore";
import { Menu, MenuItem } from "../ContextMenu";
import { useNearbyOsm } from "../../hooks/data/useCulturalSitesQueries";
import useAuthStore from "../../store/authStore";

const MapContextMenu = () => {
  // UI 스토어에서 컨텍스트 메뉴가 열린 위치의 위경도를 가져옵니다.
  const selectedLatLng = useUiStore((state) => state.selectedLatLng);
  // UI 스토어에 주변 문화재 데이터를 설정하고, 사이드 패널을 여는 함수를 가져옵니다.
  const setNearbySites = useUiStore((state) => state.setNearbySites);
  const openSidePanel = useUiStore((state) => state.openSidePanel); // SidePanel 열기 함수
  const setNearbySitesLoading = useUiStore(
    (state) => state.setNearbySitesLoading
  ); // nearbySites 로딩 상태 설정 함수
  const setNearbySitesError = useUiStore((state) => state.setNearbySitesError); // nearbySites 에러 상태 설정 함수
  const user = useAuthStore((state) => state.user);

  const {
    data: nearbyOsmData,
    isLoading: isNearbyOsmLoading,
    isError: isNearbyOsmError,
    isSuccess: isNearbyOsmSuccess,
    error: nearbyOsmError,
    refetch: refetchNearbyOsm,
  } = useNearbyOsm(selectedLatLng?.lat, selectedLatLng?.lng, {
    enabled: false,
  });

  // "이 지역 검색" 버튼 클릭 시 호출될 함수
  const queryThisArea = () => {
    if (selectedLatLng?.lat && selectedLatLng?.lng) {
      openSidePanel(); // SidePanel을 엽니다.
      setNearbySitesLoading(true); // 주변 검색 시작 시 로딩 상태를 true로 설정
      setNearbySitesError(null); // 이전 에러 상태 초기화
      refetchNearbyOsm(); // 주변 OSM 데이터 가져오기 시작
    } else {
      console.warn(
        "The surrounding area cannot be searched due to lack of valid latitude and longitude information."
      );
      setNearbySitesError(
        new Error("There is no valid latitude and longitude information.")
      ); // 에러 상태 설정
    }
  };

  // useNearbyOsm의 데이터, 로딩, 에러 상태를 Zustand 스토어에 반영
  useEffect(() => {
    setNearbySitesLoading(isNearbyOsmLoading);
    if (isNearbyOsmSuccess && nearbyOsmData) {
      console.log(nearbyOsmData);
      setNearbySites(nearbyOsmData); // 응답 구조에 맞게 `data.osmCulturalSites` 접근
      console.log(
        "Surrounding OSM cultural site data is set in the UI store:",
        nearbyOsmData
      );
    }
    if (isNearbyOsmError) {
      console.error(
        "Error occurred while retrieving surrounding OSM cultural site:",
        nearbyOsmError
      );
      setNearbySites([]); // 에러 발생 시 빈 배열로 초기화
      setNearbySitesError(nearbyOsmError); // 에러 객체를 Zustand 스토어에 저장
      // 사용자에게 에러 메시지를 표시할 수도 있습니다.
    }
  }, [
    isNearbyOsmSuccess,
    nearbyOsmData,
    isNearbyOsmLoading,
    isNearbyOsmError,
    nearbyOsmError,
    setNearbySites,
    setNearbySitesLoading,
    setNearbySitesError,
  ]);

  return (
    <>
      {user && (
        <Menu>
          <MenuItem onClick={queryThisArea}>
            <div className="px-1 mx-1 text-xs">
              {user.role === "admin" ? "Add new place" : "Suggest new place"}
            </div>
          </MenuItem>
        </Menu>
      )}
    </>
  );
};

export default MapContextMenu;
