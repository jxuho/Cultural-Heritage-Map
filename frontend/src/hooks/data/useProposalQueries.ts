import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  acceptProposal, 
  fetchAllProposals, 
  fetchMyProposals, 
  rejectProposal, 
  submitProposal 
} from "../../api/proposalApi";
import { Proposal } from "../../types/proposal";

// API 응답 구조가 보통 { data: { proposal: Proposal } } 형태인 경우를 가정한 인터페이스
interface ProposalResponse {
  data: {
    proposal: Proposal;
  };
  message?: string;
}

export const useSubmitProposal = () => {
  return useMutation({
    mutationFn: (newProposal: Partial<Proposal>) => submitProposal(newProposal),
    onSuccess: () => {
      console.log("Proposal submitted successfully!");
    },
    onError: (error: Error) => {
      console.error("Error submitting proposal:", error);
      throw error;
    },
  });
};

export const useProposals = () => {
  return useQuery<Proposal[], Error>({
    queryKey: ['proposals'],
    queryFn: fetchAllProposals,
    // v5부터는 staleTime 등을 queryClient 기본값에서 조정하거나 여기서 설정
    staleTime: 1000 * 60, 
  });
};

// 뮤테이션 인자를 위한 타입 정의
interface ModerationVariables {
  proposalId: string;
  actionType: 'accept' | 'reject';
  adminComment?: string;
}

export const useProposalModeration = () => {
  const queryClient = useQueryClient();

  return useMutation<ProposalResponse, Error, ModerationVariables>({
    mutationFn: async ({ proposalId, actionType, adminComment }) => {
      if (actionType === 'accept') {
        return acceptProposal(proposalId, adminComment);
      } else if (actionType === 'reject') {
        return rejectProposal(proposalId, adminComment);
      }
      throw new Error('Invalid proposal moderation action type.');
    },
    onSuccess: (data, variables) => {
      const { proposalId, actionType } = variables;
      console.log(`Proposal ${proposalId} ${actionType}ed successfully!`, data);

      // 제안 목록 무효화
      queryClient.invalidateQueries({ queryKey: ['proposals'] });

      // 신규 생성 제안이 승인된 경우 문화재 목록 갱신
      if (data?.data?.proposal?.proposalType === 'create' && actionType === 'accept') {
        queryClient.invalidateQueries({ queryKey: ['culturalSites'] });
      }

      // 특정 문화재 수정 제안이 승인된 경우 해당 문화재 상세 정보 갱신
      if (actionType === 'accept' && data?.data?.proposal?.culturalSite) {
        queryClient.invalidateQueries({ 
          queryKey: ['culturalSite', data.data.proposal.culturalSite] 
        });
      }

      alert(`Proposal is successfully ${actionType === 'accept' ? 'accepted' : 'rejected'}.`);
    },
    onError: (error, variables) => {
      console.error(`Error ${variables.actionType}ing proposal ${variables.proposalId}:`, error);
      alert(`Failed to process the ${variables.actionType} proposal: ${error.message || "Unknown error"}`);
    },
  });
};

export const useMyProposals = () => {
  return useQuery<Proposal[], Error>({
    queryKey: ['myProposals'],
    queryFn: fetchMyProposals,
    staleTime: 5 * 60 * 1000,
    // TanStack Query v4/v5에서는 cacheTime이 gcTime으로 이름이 변경되었습니다.
    // v5를 사용 중이시라면 gcTime을 사용하세요.
    gcTime: 10 * 60 * 1000, 
  });
};