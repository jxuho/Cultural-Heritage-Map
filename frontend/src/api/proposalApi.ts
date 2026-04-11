import axiosInstance from './axiosInstance';
import { ApiResponse } from '../types/api';
import { Proposal } from '../types/proposal';
import { AxiosError } from 'axios';

/**
 * Submit a new proposal
 */
export const submitProposal = async (
  proposalData: Partial<Proposal>
): Promise<ApiResponse<{ proposal: Proposal }>> => {
  try {
    const response = await axiosInstance.post<ApiResponse<{ proposal: Proposal }>>(
      '/proposals', 
      proposalData
    );
    return response.data;
  } catch (error) {
    const err = error as AxiosError<{ message: string }>;
    throw err.response?.data?.message || 'Failed to submit proposal';
  }
};

/**
 * Fetch all proposals (Admin only)
 */
export const fetchAllProposals = async (): Promise<Proposal[]> => {
  try {
    const response = await axiosInstance.get<ApiResponse<{ proposals: Proposal[] }>>(
      '/proposals/'
    );
    return response.data.data.proposals || [];
  } catch (error) {
    const err = error as AxiosError;
    console.error("Error fetching all proposals:", err);
    throw err;
  }
};
/**
 * Accept a proposal (Admin)
 */
export const acceptProposal = async (
  proposalId: string, 
  adminComment?: string // ?를 추가하여 선택적 매개변수로 변경
): Promise<ApiResponse<{ proposal: Proposal }>> => {
  try {
    const response = await axiosInstance.patch<ApiResponse<{ proposal: Proposal }>>(
      `/proposals/${proposalId}/accept`,
      { adminComment }
    );
    return response.data;
  } catch (error) {
    const err = error as AxiosError<{ message: string }>;
    throw err.response?.data?.message || 'Failed to accept proposal';
  }
};

/**
 * Reject a proposal (Admin only)
 */
export const rejectProposal = async (
  proposalId: string, 
  adminComment?: string // ?를 추가하여 선택적 매개변수로 변경
): Promise<ApiResponse<{ proposal: Proposal }>> => {
  try {
    const response = await axiosInstance.patch<ApiResponse<{ proposal: Proposal }>>(
      `/proposals/${proposalId}/reject`,
      { adminComment }
    );
    return response.data;
  } catch (error) {
    const err = error as AxiosError<{ message: string }>;
    throw err.response?.data?.message || 'Failed to reject proposal';
  }
};

/**
 * Fetch the list of proposals I submitted
 */
export const fetchMyProposals = async (): Promise<Proposal[]> => {
  try {
    const response = await axiosInstance.get<ApiResponse<{ proposals: Proposal[] }>>(
      '/proposals/my-proposals'
    );
    return response.data.data.proposals || [];
  } catch (error) {
    const err = error as AxiosError;
    console.error('Error fetching my proposals:', err);
    throw err;
  }
};