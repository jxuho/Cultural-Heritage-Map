import { http, HttpResponse } from 'msw';

const mockCulturalSites = [
  {
    _id: "site-123",
    name: "abc",
    description: "hello",
    category: "artwork",
    location: {
      type: "Point",
      coordinates: [126.974, 37.564]
    },
    address: "chemnitzer str. 123, 09111 Chemnitz, Germany",
    website: "https://example.com",
    imageUrl: "https://example.com/image.jpg",
    openingHours: "09:00 - 18:00",
    licenseInfo: "Data © OpenStreetMap contributors, ODbL.",
    sourceId: "osm-1",
    reviews: ["hello"],
    favoritesCount: 10,
    originalTags: { amenity: "arts_centre" },
    proposedBy: "admin",
    registeredBy: "system",
    active: true
  }
];
export const culturalSitesHandlers = [
  // [GET] View all historic sites
  http.get('*/cultural-sites', () => {
    // You can also extract params (limits, etc.) from URL.
    // const url = new URL(request.url);
    // const limit = url.searchParams.get('limit');

    return HttpResponse.json({
      success: true,
      data: { culturalSites: mockCulturalSites }
    });
  }),

  // [GET] Search for nearby OSM historic sites (lat, lon query parameters processing)
  http.get('*/cultural-sites/nearby-osm', ({ request }) => {
    const url = new URL(request.url);
    const lat = url.searchParams.get('lat');
    const lon = url.searchParams.get('lon');

    // Error response can be mocked if there is no latitude/longitude
    if (!lat || !lon) {
      return new HttpResponse(null, { status: 400 });
    }

    return HttpResponse.json({
      success: true,
      data: { osmCulturalSites: [mockCulturalSites[0]] } // Return data for testing
    });
  }),

  // [GET] Search for specific ID historic sites
  http.get('*/cultural-sites/:id', ({ params }) => {
    const { id } = params;
    const site = mockCulturalSites.find(p => p._id === id) || mockCulturalSites[0];

    return HttpResponse.json({
      success: true,
      data: { culturalSite: { ...site, _id: id } }
    });
  }),

  // [POST] Create historic site (Admin)
  http.post('*/cultural-sites', async ({ request }) => {
    const siteData = await request.json() as any;
    return HttpResponse.json({
      success: true,
      data: { culturalSite: { ...siteData, _id: 'new-id-999' } }
    }, { status: 201 });
  }),

  // [PUT] Edit historic sites (Admin)
  http.put('*/cultural-sites/:id', async ({ request, params }) => {
    const { id } = params;
    const updateData = await request.json() as any;
    
    return HttpResponse.json({
      success: true,
      data: { culturalSite: { ...mockCulturalSites[0], ...updateData, _id: id } }
    });
  }),

  // [DELETE] Delete historic sites (Admin)
  http.delete('*/cultural-sites/:id', ({ params }) => {
    console.log(`Deleting site: ${params.id}`);
    
    return HttpResponse.json({
      success: true,
      data: null
    });
  }),
];