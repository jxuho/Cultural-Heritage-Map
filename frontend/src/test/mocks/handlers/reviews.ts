import { http, HttpResponse } from 'msw';

const mockReviews = [
  {
    _id: 'rev-1',
    culturalSite: 'site-123',
    user: { _id: 'user-1', name: 'max' },
    rating: 5,
    comment: 'It\'s a really cool place!',
    createdAt: new Date().toISOString(),
  },
];

export const reviewHandlers = [
  // 1. Check the review list of a specific historic site
  http.get('*/cultural-sites/:placeId/reviews', () => {
    return HttpResponse.json({
      status: 'success',
      data: { reviews: mockReviews }
    });
  }),

  // 2. View my review list (including sorting)
  http.get('*/users/me/reviews', ({ request }) => {
    const url = new URL(request.url);
    const sort = url.searchParams.get('reviewSort');
    return HttpResponse.json({
      status: 'success',
      data: { reviews: mockReviews, sortApplied: sort }
    });
  }),

  // 3. Create a review
  http.post('*/cultural-sites/:placeId/reviews', async ({ request }) => {
    const body = await request.json() as any;
    return HttpResponse.json({
      status: 'success',
      data: { review: { ...body, _id: 'new-rev', createdAt: new Date().toISOString() } }
    }, { status: 201 });
  }),

  // 4. Edit review
  http.patch('*/cultural-sites/:placeId/reviews/:reviewId', async ({ request }) => {
    const body = await request.json() as any;
    return HttpResponse.json({
      status: 'success',
      data: { review: { ...body, _id: 'rev-1' } }
    });
  }),

  // 5. Delete review
  http.delete('*/cultural-sites/:placeId/reviews/:reviewId', () => {
    return HttpResponse.json({ status: 'success' }, { status: 204 });
  }),
];