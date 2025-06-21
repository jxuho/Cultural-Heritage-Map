// src/hooks/data/useCulturalSitesQueries.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchAllCulturalSites,
  fetchCulturalSiteById,
  getNearbyOsm,
  createCulturalSite,
  deleteCulturalSite,
  updateCulturalSite,
} from '../../api/culturalSitesApi'; // API 함수 임포트

// 모든 문화재 목록 가져오기
export const useAllCulturalSites = (params) => {
  return useQuery({
    queryKey: ['culturalSites', params],
    queryFn: () => fetchAllCulturalSites(params),
    staleTime: 1000 * 60 * 5, // 5분
  });
};

// 특정 문화재 상세 정보 가져오기
export const useCulturalSiteDetail = (id) => {
  return useQuery({
    queryKey: ['culturalSite', id],
    queryFn: () => fetchCulturalSiteById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 1, // 1분
  });
};

// 주변 OpenStreetMap 문화재 정보 가져오기 훅 수정
export const useNearbyOsm = (lat, lon) => {
  const queryResult = useQuery({
    queryKey: ['nearbyOsm', lat, lon],
    queryFn: () => getNearbyOsm(lat, lon),
    enabled: false, // <-- 기본적으로 쿼리 실행을 비활성화합니다.
    staleTime: 1000 * 60 * 10,
    // gcTime: 1000 * 60 * 60, // 필요 시 조정
  });

  // queryResult에서 refetch 함수를 포함하여 반환합니다.
  return { ...queryResult, refetch: queryResult.refetch };
};

// 새로운 Cultural site 생성을 위한 뮤테이션 훅 (관리자용)
export const useCreateCulturalSite = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCulturalSite,
    onSuccess: () => {
      // 성공 시 관련 쿼리 무효화 (예: 지도 데이터 다시 로드)
      queryClient.invalidateQueries({ queryKey: ['culturalSites'] });
      // 필요한 경우 다른 쿼리도 무효화할 수 있습니다.
    },
    onError: (error) => {
      console.error("Failed to create cultural site:", error);
      // 에러 처리 로직 (예: 에러 메시지 표시)
      throw error; // 에러를 다시 던져서 컴포넌트에서 catch할 수 있도록 합니다.
    },
  });
};

// 문화재 정보 업데이트를 위한 뮤테이션 훅 (관리자용, PUT 메서드)
export const useUpdateCulturalSite = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ culturalSiteId, updateData }) => updateCulturalSite(culturalSiteId, updateData),
    onSuccess: (data, variables) => {
      // 성공 시 특정 문화재 상세 정보 쿼리 무효화 및 전체 목록 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: ['culturalSite', variables.culturalSiteId] });
      queryClient.invalidateQueries({ queryKey: ['culturalSites'] });
      console.log(`Cultural site ${variables.culturalSiteId} update success!`);
    },
    onError: (error, variables) => {
      console.error(`Cultural site ${variables.culturalSiteId} update fail:`, error);
      alert(`Cultural site update 실패: ${error.message || "Unknown error"}`);
    },
  });
};

// 문화재 삭제를 위한 뮤테이션 훅 (관리자용, DELETE 메서드)
export const useDeleteCulturalSite = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (culturalSiteId) => deleteCulturalSite(culturalSiteId),
    onSuccess: (_, culturalSiteId) => {
      // 성공 시 특정 문화재 상세 정보 쿼리 무효화 및 전체 목록 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: ['culturalSite', culturalSiteId] });
      queryClient.invalidateQueries({ queryKey: ['culturalSites'] });
      console.log(`Cultural site ${culturalSiteId} is deleted!`);
    },
    onError: (error, culturalSiteId) => {
      console.error(`Failed to delete cultural site ${culturalSiteId}:`, error);
      alert(`Failed to delete cultural site: ${error.message || "Unknown error"}`);
    },
  });
};
