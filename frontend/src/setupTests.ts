import '@testing-library/jest-dom'

import { server } from './test/mocks/server';

// Start the server before starting the test
beforeAll(() => server.listen());

// Initialize handlers after each test (to avoid affecting other tests)
afterEach(() => server.resetHandlers());

// Stop the server after all tests are completed
afterAll(() => server.close());