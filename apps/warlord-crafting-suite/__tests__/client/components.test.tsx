import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  renderWithProviders,
  screen,
  userEvent,
  waitForAsync,
  mockApiResponses,
  setupMockFetch,
  clearMockFetch,
} from './test-utils';
import React from 'react';

/**
 * Example tests for client components
 * These test React components and user interactions
 */

// Mock component for testing
function LoginForm() {
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      localStorage.setItem('token', data.token);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        data-testid="username-input"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        data-testid="password-input"
      />
      <button type="submit" disabled={loading} data-testid="login-button">
        {loading ? 'Logging in...' : 'Login'}
      </button>
      {error && <p data-testid="error-message">{error}</p>}
    </form>
  );
}

describe('Client - LoginForm Component', () => {
  beforeEach(() => {
    clearMockFetch();
    localStorage.clear();
  });

  it('should render login form', () => {
    renderWithProviders(<LoginForm />);

    expect(screen.getByTestId('username-input')).toBeInTheDocument();
    expect(screen.getByTestId('password-input')).toBeInTheDocument();
    expect(screen.getByTestId('login-button')).toBeInTheDocument();
  });

  it('should update input values on user typing', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginForm />);

    const usernameInput = screen.getByTestId('username-input') as HTMLInputElement;
    const passwordInput = screen.getByTestId('password-input') as HTMLInputElement;

    await user.type(usernameInput, 'testuser');
    await user.type(passwordInput, 'password123');

    expect(usernameInput.value).toBe('testuser');
    expect(passwordInput.value).toBe('password123');
  });

  it('should submit form and store token', async () => {
    const user = userEvent.setup();
    setupMockFetch({
      '/api/auth/login': { token: 'test-token-123' },
    });

    renderWithProviders(<LoginForm />);

    await user.type(screen.getByTestId('username-input'), 'testuser');
    await user.type(screen.getByTestId('password-input'), 'password123');
    await user.click(screen.getByTestId('login-button'));

    await waitForAsync(100);

    expect(localStorage.setItem).toHaveBeenCalledWith('token', 'test-token-123');
  });

  it('should show loading state while submitting', async () => {
    const user = userEvent.setup();
    setupMockFetch({
      '/api/auth/login': { token: 'test-token-123' },
    });

    renderWithProviders(<LoginForm />);

    await user.type(screen.getByTestId('username-input'), 'testuser');
    await user.type(screen.getByTestId('password-input'), 'password123');

    const loginButton = screen.getByTestId('login-button') as HTMLButtonElement;
    await user.click(loginButton);

    expect(loginButton.textContent).toBe('Logging in...');
    expect(loginButton.disabled).toBe(true);
  });
});

// Example: Character display component
function CharacterCard({ character }: { character: any }) {
  return (
    <div data-testid="character-card">
      <h2 data-testid="character-name">{character.name}</h2>
      <p data-testid="character-level">Level {character.level}</p>
      <p data-testid="character-class">{character.classId}</p>
      <p data-testid="character-gold">{character.gold} Gold</p>
    </div>
  );
}

describe('Client - CharacterCard Component', () => {
  it('should display character information', () => {
    renderWithProviders(<CharacterCard character={mockApiResponses.character} />);

    expect(screen.getByTestId('character-name')).toHaveTextContent('Test Character');
    expect(screen.getByTestId('character-level')).toHaveTextContent('Level 1');
    expect(screen.getByTestId('character-class')).toHaveTextContent('Warrior');
    expect(screen.getByTestId('character-gold')).toHaveTextContent('1000 Gold');
  });

  it('should update when character prop changes', () => {
    const { rerender } = renderWithProviders(
      <CharacterCard character={mockApiResponses.character} />
    );

    expect(screen.getByTestId('character-name')).toHaveTextContent('Test Character');

    const updatedCharacter = { ...mockApiResponses.character, level: 5 };
    rerender(<CharacterCard character={updatedCharacter} />);

    expect(screen.getByTestId('character-level')).toHaveTextContent('Level 5');
  });
});
