import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { createWrapper } from '../../test/test-utils';
import { 
  useUpdateProfile, 
  useDeleteMyAccount, 
  useUserById, 
  useAllUsers, 
  useUpdateUserRole 
} from './useUserQueries';

// alert mocking
window.alert = vi.fn();

describe('useUserQueries', () => {

  describe('Edit my profile (User)', () => {
    it('should successfully update profile information', async () => {
      const { result } = renderHook(() => useUpdateProfile(), {
        wrapper: createWrapper(),
      });

      const updateData = { username: 'new username', bio: 'new bio' };
      const response = await result.current.mutateAsync(updateData);

      expect(response.status).toBe('success');
      expect(response.data.user.username).toBe('new username');
    });

    it('should show a success message when deleting the account', async () => {
      const { result } = renderHook(() => useDeleteMyAccount(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync();

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('successfully deleted'));
    });
  });

  describe('Search and manage users (Admin)', () => {
    it('should fetch specific user information when userId is provided', async () => {
      const { result } = renderHook(() => useUserById('user-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.username).toBe('max');
    });

    it('should view all users when called by an admin', async () => {
      const { result } = renderHook(() => useAllUsers(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toHaveLength(2);
    });

    it('should modify user permissions when called by an admin', async () => {
      const { result } = renderHook(() => useUpdateUserRole(), {
        wrapper: createWrapper(),
      });

      const response = await result.current.mutateAsync({
        userId: 'user-1',
        newRole: 'admin'
      });

      expect(response.data.user.role).toBe('admin');
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
    });
  });
});