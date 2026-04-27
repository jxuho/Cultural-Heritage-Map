import { renderHook, waitFor } from '@testing-library/react';

import {
  useAllCulturalSites,
  useCulturalSiteDetail,
  useNearbyOsm,
  useCreateCulturalSite,
  useUpdateCulturalSite,
  useDeleteCulturalSite,
} from './useCulturalSitesQueries';
import { createWrapper } from '../../test/test-utils';


describe('useCulturalSitesQueries', () => {
  describe('Queries', () => {
    test('useAllCulturalSites: All historical sites must be loaded successfully', async () => {
      const { result } = renderHook(() => useAllCulturalSites(), {
        wrapper: createWrapper(),
      });

      // Check initial status
      expect(result.current.isPending).toBe(true);

      // Wait for data fetch completion
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Verify that mockCulturalSites data defined by MSW is returned
      expect(result.current.data).toBeDefined();
      expect(result.current.data?.length).toBeGreaterThan(0);
      expect(result.current.data?.[0].name).toBe('abc');
    });

    test('useCulturalSiteDetail: The historic site with a specific ID must be successfully loaded.', async () => {
      const testId = 'site-123';
      const { result } = renderHook(() => useCulturalSiteDetail(testId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?._id).toBe(testId);
      expect(result.current.data?.name).toBe('abc');
    });

    test('useNearbyOsm: Need to retrieve surrounding OSM data based on latitude and longitude', async () => {
      // Because of the enabled: false property, you need to call refetch manually.
      const { result } = renderHook(() => useNearbyOsm(37.564, 126.974), {
        wrapper: createWrapper(),
      });

      // Run fetch manually
      result.current.refetch();

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
      expect(result.current.data?.[0]._id).toBe('site-123'); // Set to return mockCulturalSites[0] in MSW
    });
  });

  describe('Mutations', () => {
    test('useCreateCulturalSite: You must successfully create a new historic site.', async () => {
      const { result } = renderHook(() => useCreateCulturalSite(), {
        wrapper: createWrapper(),
      });

      const newSiteData = {
        name: 'New Site',
        category: 'artwork',
      };

      // Awaiting Promise result using mutateAsync
      await result.current.mutateAsync(newSiteData);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      
      // MSW is set to return '_id: new-id-999' combined.
      expect(result.current.data?._id).toBe('new-id-999');
      expect(result.current.data?.name).toBe('New Site');
    });

    test('useUpdateCulturalSite: Existing historic sites must be successfully modified.', async () => {
      const { result } = renderHook(() => useUpdateCulturalSite(), {
        wrapper: createWrapper(),
      });

      const updatePayload = {
        culturalSiteId: 'site-123',
        updateData: { name: 'Updated Site Name' },
      };

      await result.current.mutateAsync(updatePayload);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // MSW returns updateData overwritten with existing mock data.
      expect(result.current.data?.name).toBe('Updated Site Name');
      expect(result.current.data?._id).toBe('site-123');
    });

    test('useDeleteCulturalSite: The historic site must be successfully deleted.', async () => {
      const { result } = renderHook(() => useDeleteCulturalSite(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync('site-123');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // API functions are designed to return boolean(true)
      expect(result.current.data).toBe(true);
    });
  });
});