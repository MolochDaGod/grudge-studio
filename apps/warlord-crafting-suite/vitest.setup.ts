import { expect, afterEach, vi } from 'vitest';
import '@testing-library/jest-dom';

// Cleanup after each test
afterEach(() => {
  vi.clearAllMocks();
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock fetch if needed
global.fetch = vi.fn();
