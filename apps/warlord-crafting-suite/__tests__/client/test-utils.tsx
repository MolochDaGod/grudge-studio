import React from 'react';
import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Test utilities for client (React) components
 */

/**
 * Custom render function that wraps components with providers
 */
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  // Add provider props here if needed
}

const AllProviders = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

export function renderWithProviders(
  ui: ReactElement,
  options?: CustomRenderOptions
) {
  return render(ui, { wrapper: AllProviders, ...options });
}

/**
 * Mock API responses
 */
export const mockApiResponses = {
  character: {
    id: 'char-123',
    userId: 'user-123',
    name: 'Test Character',
    classId: 'Warrior',
    raceId: 'Human',
    level: 1,
    experience: 0,
    health: 100,
    maxHealth: 100,
    gold: 1000,
  },

  inventory: [
    {
      id: 'inv-1',
      characterId: 'char-123',
      itemName: 'Iron Ore',
      quantity: 10,
      itemType: 'material',
    },
    {
      id: 'inv-2',
      characterId: 'char-123',
      itemName: 'Copper Ore',
      quantity: 5,
      itemType: 'material',
    },
  ],

  recipes: [
    {
      id: 'recipe-1',
      name: 'Iron Ingot',
      category: 'material',
      tier: 1,
      materials: [{ name: 'Iron Ore', quantity: 3 }],
      time: 30,
    },
  ],

  user: {
    id: 'user-123',
    username: 'testuser',
    displayName: 'Test User',
    email: 'test@example.com',
    isPremium: false,
  },
};

/**
 * Setup mocked fetch for API calls
 */
export function setupMockFetch(responses: Record<string, any>) {
  global.fetch = vi.fn((url: string, options?: RequestInit) => {
    const urlStr = typeof url === 'string' ? url : url.toString();

    // Find matching response
    for (const [path, response] of Object.entries(responses)) {
      if (urlStr.includes(path)) {
        return Promise.resolve(
          new Response(JSON.stringify(response), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        );
      }
    }

    // Default 404
    return Promise.resolve(
      new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
      })
    );
  });
}

/**
 * Clear all mocked fetch calls
 */
export function clearMockFetch() {
  vi.clearAllMocks();
}

// Re-export common testing utilities
export { render, screen, within, waitFor } from '@testing-library/react';
export { userEvent };
export { vi } from 'vitest';

/**
 * Wait for async operations
 */
export function waitForAsync(ms: number = 0) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
