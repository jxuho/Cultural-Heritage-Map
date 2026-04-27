import { culturalSitesHandlers } from './culturalSites';
import { favoriteHandlers } from './favorites';
import {proposalHandlers} from './proposals';
import { reviewHandlers } from './reviews';
import { userHandlers } from './users';

export const handlers = [
  ...culturalSitesHandlers,
  ...favoriteHandlers,
  ...proposalHandlers,
  ...reviewHandlers,
  ...userHandlers,
];