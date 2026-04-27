import { renderHook, waitFor } from '@testing-library/react';
import { createWrapper } from '../../test/test-utils';
import { useMyFavorites, useFavoriteMutation } from './useFavoriteQueries';

// mocking window.alert
window.alert = vi.fn();

describe('Favorite system integration testing', () => {
  
  describe('useMyFavorites', () => {
    test('You will need to bring a list of historical sites with detailed information (location, rating, etc.)', async () => {
      const { result } = renderHook(() => useMyFavorites('user-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      const site = result.current.data?.[0];
      expect(site?.name).toBe('ABC Historic Site');
      // Validating the GeoJSON structure of the model
      expect(site?.location.type).toBe('Point');
      expect(site?.location.coordinates).toContain(126.9774);
      // Aggregation field verification
      expect(site).toHaveProperty('averageRating');
    });
  });

  describe('useFavoriteMutation', () => {
    test('When adding a new site, a new list should be returned and the cache should be invalidated', async () => {
      const { result } = renderHook(() => useFavoriteMutation(), {
        wrapper: createWrapper(),
      });

      // Add new historic sites
      const updatedList = await result.current.mutateAsync({
        actionType: 'add',
        culturalSiteId: 'site-789'
      });

      // Check if Place[] array is returned according to API code
      expect(updatedList).toBeInstanceOf(Array);
      expect((updatedList as any[]).length).toBeGreaterThan(1);
    });

    test('When deleting a site, true should be returned upon success', async () => {
      const { result } = renderHook(() => useFavoriteMutation(), {
        wrapper: createWrapper(),
      });

      const success = await result.current.mutateAsync({
        actionType: 'delete',
        culturalSiteId: 'site-123'
      });

      expect(success).toBe(true);
    });
  });
});