// src/hooks/useCulturalSitesQueries.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchAllCulturalSites,
  fetchCulturalSiteById,
  fetchReviewsByPlaceId,
  createReview,
  updateReview,
  deleteReview,
  fetchMyFavorites,
  addFavorite,
  deleteFavorite,
  getMyReviews,
  getNearbyOsm,
  submitProposal,
  createCulturalSite,
  deleteCulturalSite,
  updateCulturalSite,
  fetchAllProposals,
  acceptProposal,
  rejectProposal,
  deleteMyAccount
} from '../api/culturalSitesApi'; // API 함수 임포트

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

// 특정 문화재 리뷰 목록 가져오기
export const usePlaceReviews = (placeId, isExpanded) => {
  return useQuery({
    queryKey: ['reviews', placeId],
    queryFn: () => fetchReviewsByPlaceId(placeId),
    enabled: !!placeId && isExpanded,
    staleTime: 1000 * 10, // 10초
  });
};

// NEW: Hook to fetch current user's reviews
export const useMyReviews = () => {
  return useQuery({
    queryKey: ['myReviews'],
    queryFn: getMyReviews, // Assuming getMyReviews handles sorting internally or defaults
    staleTime: 1000 * 10, // 10 seconds, adjust as needed
    enabled: true, // This query should always run if the component is mounted
  });
};

// Review Create/Update/Delete Mutation
export const useReviewMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ actionType, placeId, reviewId, reviewData }) => {
      if (actionType === 'create') {
        return createReview(placeId, reviewData);
      } else if (actionType === 'update') {
        return updateReview(placeId, reviewId, reviewData);
      } else if (actionType === 'delete') {
        return deleteReview(placeId, reviewId);
      }
      throw new Error('Invalid review action type.');
    },
    // onSuccess 콜백 수정
    onSuccess: (response, variables) => {
      // 1. 관련된 쿼리들을 무효화하여 최신 데이터를 다시 가져오도록 합니다.
      queryClient.invalidateQueries({ queryKey: ['myReviews'] }); // 사용자 본인의 리뷰 목록
      queryClient.invalidateQueries({ queryKey: ['reviews', variables.placeId] }); // 특정 문화재의 리뷰 목록
      queryClient.invalidateQueries({ queryKey: ['culturalSites'] }); // 전체 문화재 목록 (평점 업데이트 반영)

      // 2. 서버 응답에서 업데이트된 culturalSite 데이터를 추출합니다.
      //    🚨 중요: 백엔드 API가 리뷰 작업 후 업데이트된 문화재 데이터를 응답의 특정 경로에 포함해야 합니다.
      //    예: response.data.data.culturalSite 또는 response.data.updatedCulturalSite 등.
      //    여기서는 response.data.data.culturalSite를 가정했습니다.
      const updatedCulturalSiteData = response?.data?.data?.culturalSite; // 서버 응답 경로에 맞게 조정 필요

      // 3. 만약 서버가 업데이트된 culturalSite 데이터를 제공했다면, 캐시를 직접 업데이트합니다.
      if (updatedCulturalSiteData) {
        queryClient.setQueryData(
          ['culturalSite', variables.placeId],
          updatedCulturalSiteData // 서버에서 받은 최신 데이터를 그대로 캐시에 설정
        );
      } else {
        // 4. 서버가 업데이트된 culturalSite 데이터를 제공하지 않았다면 경고를 로깅합니다.
        //    이 경우, 위에 명시된 invalidateQueries만으로 데이터가 최신 상태로 반영됩니다.
        //    (단, 다음 데이터 접근 시 refetching 발생)
        console.warn(`[useReviewMutation] 서버 응답에 업데이트된 culturalSite 데이터가 포함되어 있지 않습니다.
                      'culturalSite' 캐시 업데이트를 위해 refetching이 발생합니다.
                      더 나은 UX를 위해 서버에서 업데이트된 culturalSite 데이터를 반환하도록 고려해보세요.`);
        // 명시적으로 culturalSite 쿼리를 무효화하여 다음 접근 시 refetching 되도록 합니다.
        // (if 블록에서 setQueryData를 사용하면 invalidate가 필요 없을 수 있지만, 안전을 위해 남겨둘 수 있습니다.)
        queryClient.invalidateQueries({ queryKey: ['culturalSite', variables.placeId] });
      }

      alert("Review is processed successfully!");
    },
    onError: (error) => {
      console.error("Review action fail:", error);
      alert(`Review process fail: ${error.message || "Unknown error"}`);
    },
  });
};


// 내 즐겨찾기 목록 가져오기
export const useMyFavorites = (userId) => {
  return useQuery({
    queryKey: ['myFavorites', userId],
    queryFn: fetchMyFavorites,
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
};

// 즐겨찾기 추가/삭제 뮤테이션
export const useFavoriteMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ actionType, culturalSiteId }) => {
      if (actionType === 'add') {
        return addFavorite(culturalSiteId);
      } else if (actionType === 'delete') {
        return deleteFavorite(culturalSiteId);
      }
      throw new Error('Invalid favorite action type.');
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['myFavorites'] }); // 특정 유저의 즐겨찾기 목록 갱신
      // 필요하다면, 전체 문화재 목록이나 상세 문화재 정보도 갱신
      queryClient.invalidateQueries({ queryKey: ['culturalSite', variables.culturalSiteId] });
    },
    onError: (error) => {
      console.error("Favorite action fail:", error);
      alert(`Favorite process fail: ${error.message || "Unknown error"}`);
    },
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


export const useSubmitProposal = () => {
  return useMutation({
    mutationFn: submitProposal,
    onSuccess: () => {
      // Invalidate queries that might need refetching after a proposal is submitted.
      // For example, if you have a list of pending proposals, you'd invalidate that.
      // queryClient.invalidateQueries({ queryKey: ['proposals', 'pending'] });
      // You might also want to invalidate cultural sites list if the proposal is immediately approved and added
      // queryClient.invalidateQueries({ queryKey: ['culturalSites'] });
      console.log("Proposal submitted successfully!");
    },
    onError: (error) => {
      console.error("Error submitting proposal:", error);
      // You can add more sophisticated error handling here, e.g., display a toast notification
      throw error; // Re-throw to be caught by the component
    },
  });
};


// 새로운 문화 유적지 생성을 위한 뮤테이션 훅 (관리자용)
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
      console.error("문화 유적지 직접 생성 실패:", error);
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
      console.log(`문화 유적지 ${variables.culturalSiteId} 업데이트 성공!`);
    },
    onError: (error, variables) => {
      console.error(`문화 유적지 ${variables.culturalSiteId} 업데이트 실패:`, error);
      alert(`문화 유적지 업데이트 실패: ${error.message || "알 수 없는 오류"}`);
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
      console.log(`문화 유적지 ${culturalSiteId} 삭제 성공!`);
    },
    onError: (error, culturalSiteId) => {
      console.error(`문화 유적지 ${culturalSiteId} 삭제 실패:`, error);
      alert(`문화 유적지 삭제 실패: ${error.message || "알 수 없는 오류"}`);
    },
  });
};

export const useProposals = () => {
  return useQuery({
    queryKey: ['proposals'],
    queryFn: fetchAllProposals, // Use the imported API function
    staleTime: 1000 * 60, // 1 minute stale time for proposals (adjust as needed for admin view)
  });
};

// Proposal 승인/거절을 위한 뮤테이션 훅
export const useProposalModeration = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ proposalId, actionType, adminNotes }) => {
            if (actionType === 'accept') {
                return acceptProposal(proposalId, adminNotes);
            } else if (actionType === 'reject') {
                return rejectProposal(proposalId, adminNotes);
            }
            throw new Error('Invalid proposal moderation action type.');
        },
        onSuccess: (data, variables) => {
            console.log(`Proposal ${variables.proposalId} ${variables.actionType}ed successfully!`, data);
            // 제안 목록 쿼리를 무효화하여 최신 상태를 반영합니다.
            queryClient.invalidateQueries({ queryKey: ['proposals'] });

            // 만약 승인된 제안이 새로운 문화재 생성이라면, 전체 문화재 목록도 무효화해야 합니다.
            // 또는 서버 응답에서 'create' 타입의 제안이 승인되었음을 알리는 정보가 있다면,
            // 'culturalSites' 쿼리도 무효화할 수 있습니다.
            // 여기서는 `data.data.proposal.proposalType` 또는 유사한 필드를 확인한다고 가정합니다.
            // 실제 백엔드 API 응답 구조에 따라 조정하세요.
            if (data?.data?.proposal?.proposalType === 'create' && variables.actionType === 'accept') {
                queryClient.invalidateQueries({ queryKey: ['culturalSites'] });
            }

            // 특정 문화재를 수정하거나 삭제하는 제안이 승인되었다면
            // 해당 문화재 상세 정보 쿼리도 무효화해야 할 수 있습니다.
            // 예를 들어:
            // if (variables.actionType === 'accept' && data?.data?.proposal?.culturalSite) {
            //     queryClient.invalidateQueries({ queryKey: ['culturalSite', data.data.proposal.culturalSite] });
            // }

            alert(`제안이 성공적으로 ${variables.actionType === 'accept' ? '승인' : '거절'}되었습니다.`);
        },
        onError: (error, variables) => {
            console.error(`Error ${variables.actionType}ing proposal ${variables.proposalId}:`, error);
            alert(`제안 ${variables.actionType === 'accept' ? '승인' : '거절'} 실패: ${error.message || "알 수 없는 오류"}`);
        },
    });
};


export const useDeleteMyAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteMyAccount,
    onSuccess: (data) => {
      console.log("Account deleted successfully!", data);
      // Invalidate all queries related to the user, as their data is no longer valid.
      // This is a broad invalidation, consider more specific ones if needed.
      queryClient.invalidateQueries({ queryKey: ['myReviews'] });
      queryClient.invalidateQueries({ queryKey: ['myFavorites'] });
      queryClient.invalidateQueries({ queryKey: ['userProfile'] }); // Assuming you have a user profile query

      alert("Your account has been successfully deleted.");

      // After successful deletion, you might want to redirect the user
      // For example, to the logout page or home page.
      // import { useNavigate } from 'react-router-dom';
      // const navigate = useNavigate();
      // navigate('/logout'); or navigate('/');
    },
    onError: (error) => {
      console.error("Error deleting account:", error);
      alert(`Failed to delete account: ${error.message || "Unknown error"}`);
    },
  });
};