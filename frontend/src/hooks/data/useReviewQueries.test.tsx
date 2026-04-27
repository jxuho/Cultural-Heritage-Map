import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { createWrapper } from '../../test/test-utils';
import { usePlaceReviews, useMyReviews, useReviewMutation } from './useReviewQueries';

// Mocking global alerts
window.alert = vi.fn();

describe('useReviewQueries', () => {
  
  describe('usePlaceReviews', () => {
    it('Retrieves a list of reviews only when isExpanded is true', async () => {
      const { result, rerender } = renderHook(
        ({ expanded }) => usePlaceReviews('site-123', expanded),
        {
          wrapper: createWrapper(),
          initialProps: { expanded: false }
        }
      );

      // Initially inactive (idle)
      expect(result.current.fetchStatus).toBe('idle');

      // Change to extended state
      rerender({ expanded: true });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toHaveLength(1);
      expect(result.current.data?.[0].comment).toBe('It\'s a really cool place!');
    });
  });

  describe('useMyReviews', () => {
    it('Get a list of my reviews based on sorting options', async () => {
      const { result } = renderHook(() => useMyReviews('highest'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toBeDefined();
    });
  });

  describe('useReviewMutation', () => {
    const wrapper = createWrapper();

    it('Successfully perform the review create action', async () => {
      const { result } = renderHook(() => useReviewMutation(), { wrapper });

      await result.current.mutateAsync({
        actionType: 'create',
        placeId: 'site-123',
        reviewData: { rating: 5, comment: 'It\'s the best!' }
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('processed successfully'));
    });

    it('Successfully perform the review update action', async () => {
      const { result } = renderHook(() => useReviewMutation(), { wrapper });

      await result.current.mutateAsync({
        actionType: 'update',
        placeId: 'site-123',
        reviewId: 'rev-1',
        reviewData: { rating: 4, comment: 'Updated comment' }
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
    });

    it('Successfully perform the review delete action', async () => {
      const { result } = renderHook(() => useReviewMutation(), { wrapper });

      const response = await result.current.mutateAsync({
        actionType: 'delete',
        placeId: 'site-123',
        reviewId: 'rev-1'
      });

      expect(response).toBe(true);
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
    });

    it('Shows an error alert when an error occurs', async () => {
      // Artificially sending an incorrect request to create an API error situation
      // In a real environment, you can temporarily write a 500 error handler in MSW and test it.
      const { result } = renderHook(() => useReviewMutation(), { wrapper });

      // API internal error occurs when requesting without placeId
      await expect(result.current.mutateAsync({
        actionType: 'create',
        placeId: '', // Error induction
        reviewData: { rating: 1, comment: '' }
      })).rejects.toThrow();

      expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('Review process failed'));
    });
  });
});