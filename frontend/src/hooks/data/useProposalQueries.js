import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { acceptProposal, fetchAllProposals, fetchMyProposals, rejectProposal, submitProposal } from "../../api/proposalApi";

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
        mutationFn: async ({ proposalId, actionType, adminComment }) => {
            if (actionType === 'accept') {
                return acceptProposal(proposalId, adminComment);
            } else if (actionType === 'reject') {
                return rejectProposal(proposalId, adminComment);
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

            alert(`Proposal is successfully ${variables.actionType === 'accept' ? 'accepted' : 'rejected'}.`);
        },
        onError: (error, variables) => {
            console.error(`Error ${variables.actionType}ing proposal ${variables.proposalId}:`, error);
            alert(`Failed to process the ${variables.actionType === 'accept' ? 'accept' : 'reject'} proposal: ${error.message || "Unknown error"}`);
        },
    });
};


export const useMyProposals = () => {
  return useQuery({
    queryKey: ['myProposals'], // 고유한 쿼리 키
    queryFn: fetchMyProposals,
    staleTime: 5 * 60 * 1000, // 5분 동안 fresh 상태 유지 (선택 사항)
    cacheTime: 10 * 60 * 1000, // 10분 동안 캐시 유지 (선택 사항)
    onError: (error) => {
      console.error('Failed to fetch my proposals:', error);
      // 사용자에게 에러 메시지를 표시하는 로직 추가 가능
    },
    // select: (data) => data.filter(proposal => proposal.status === 'pending'), // 특정 상태만 필터링하는 예시 (선택 사항)
  });
};