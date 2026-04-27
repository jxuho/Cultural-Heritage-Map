import { culturalSitesHandlers } from './culturalSites';
import { favoriteHandlers } from './favorites';
// import { reviewHandlers } from './reviews';
// import { userHandlers } from './users';

export const handlers = [
  ...culturalSitesHandlers,
  ...favoriteHandlers,
  // ...reviewHandlers,
  // ...userHandlers,
];