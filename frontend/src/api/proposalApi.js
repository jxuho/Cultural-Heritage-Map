import axios from 'axios';

const API_BASE_URL = import.meta.env.PROD 
  ? "https://chemnitz-cultural-sites-map.onrender.com/api/v1" 
  : "http://localhost:5000/api/v1";


// proposal 제출
export const submitProposal = async (proposalData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/proposals`, proposalData, { withCredentials: true });
    return response.data;
  } catch (error) {
    // It's good practice to re-throw with a more specific error or process it
    throw error.response?.data?.message || 'Failed to submit proposal';
  }
};


// 모든 proposals 가지고오기(관리자용)
export const fetchAllProposals = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/proposals/`, { withCredentials: true });
    // Assuming the structure is response.data.data.proposals
    return response.data.data.proposals || [];
  } catch (error) {
    console.error("Error fetching all proposals:", error);
    throw error;
  }
}

// 등록된 proposal을 승인하는 함수 (관리자용)
export const acceptProposal = async (proposalId, adminComment) => {
    if (!proposalId || !adminComment) {
        throw new Error("Proposal ID and admin notes are required to accept a proposal.");
    }
    try {
        const response = await axios.patch(
            `${API_BASE_URL}/proposals/${proposalId}/accept`,
            { adminComment }, // 요청 본문에 adminComment 포함
            { withCredentials: true }
        );
        // 승인 후 반환되는 데이터를 그대로 반환 (예: 업데이트된 Proposal 객체)
        return response.data;
    } catch (error) {
        console.error(`Error accepting proposal ${proposalId}:`, error);
        throw error.response?.data?.message || 'Failed to accept proposal'; // 서버 오류 메시지 우선 사용
    }
};

// 등록된 proposal을 거절하는 함수 (관리자용)
export const rejectProposal = async (proposalId, adminComment) => {
    if (!proposalId || !adminComment) {
        throw new Error("Proposal ID and admin notes are required to reject a proposal.");
    }
    try {
        const response = await axios.patch(
            `${API_BASE_URL}/proposals/${proposalId}/reject`,
            { adminComment }, // 요청 본문에 adminComment 포함
            { withCredentials: true }
        );
        // 거절 후 반환되는 데이터를 그대로 반환 (예: 업데이트된 Proposal 객체)
        return response.data;
    } catch (error) {
        console.error(`Error rejecting proposal ${proposalId}:`, error);
        throw error.response?.data?.message || 'Failed to reject proposal'; // 서버 오류 메시지 우선 사용
    }
};

// 내가 제출한 proposals 조회
export const fetchMyProposals = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/proposals/my-proposals`,{
      withCredentials: true, 
    });
    console.log(response);
    
    return response.data.data.proposals;
  } catch (error) {
    console.error('Error fetching my proposals:', error);
    throw error;
  }
};