declare global {
  interface Window {
    puter: {
      auth: {
        signIn: () => Promise<void>;
        signOut: () => Promise<void>;
        isSignedIn: () => boolean;
        getUser: () => Promise<{ uuid: string; username: string; email_confirmed: boolean }>;
      };
      ai: {
        chat: (
          prompt: string | Array<{ role: string; content: string }>,
          options?: {
            model?: string;
            stream?: boolean;
            max_tokens?: number;
            temperature?: number;
          }
        ) => Promise<{ message: { role: string; content: string } } | AsyncIterable<{ text: string }>>;
        txt2img: (prompt: string, options?: { model?: string; quality?: string }) => Promise<HTMLImageElement>;
        img2txt: (image: string) => Promise<string>;
        txt2speech: (text: string, options?: { language?: string; voice?: string; engine?: string }) => Promise<HTMLAudioElement>;
      };
      kv: {
        set: (key: string, value: unknown) => Promise<void>;
        get: (key: string) => Promise<unknown>;
        del: (key: string) => Promise<void>;
        list: () => Promise<string[]>;
      };
      fs: {
        write: (path: string, content: string | Blob, options?: { createMissingParents?: boolean }) => Promise<{ path: string }>;
        read: (path: string) => Promise<Blob>;
        delete: (path: string) => Promise<void>;
        mkdir: (path: string) => Promise<void>;
        list: (path: string) => Promise<Array<{ name: string; is_dir: boolean }>>;
      };
      print: (content: string) => void;
      randName: () => string;
    };
  }
}

export const isPuterAvailable = (): boolean => {
  return typeof window !== 'undefined' && typeof window.puter !== 'undefined';
};

export const getPuter = () => {
  if (!isPuterAvailable()) {
    throw new Error('Puter is not available. Make sure to include the Puter.js script.');
  }
  return window.puter;
};

export interface PuterUser {
  uuid: string;
  username: string;
  email_confirmed: boolean;
}

export interface GrudgeCharacter {
  id: string;
  puterUuid: string;
  name: string;
  classId: string;
  level: number;
  experience: number;
  gold: number;
  skillPoints: number;
  profession?: string;
}

export const CHARACTER_STORAGE_KEY = 'grudge_character';
export const CHARACTERS_LIST_KEY = 'grudge_characters_list';

export async function signInWithPuter(): Promise<PuterUser | null> {
  try {
    const puter = getPuter();
    
    if (!puter.auth.isSignedIn()) {
      await puter.auth.signIn();
    }
    
    const user = await puter.auth.getUser();
    return user;
  } catch (error) {
    console.error('Puter sign-in failed:', error);
    return null;
  }
}

export async function signOutFromPuter(): Promise<void> {
  try {
    const puter = getPuter();
    await puter.auth.signOut();
  } catch (error) {
    console.error('Puter sign-out failed:', error);
  }
}

export async function saveCharacterToPuter(character: GrudgeCharacter): Promise<void> {
  try {
    const puter = getPuter();
    await puter.kv.set(`${CHARACTER_STORAGE_KEY}_${character.id}`, character);
    
    const existingList = await puter.kv.get(CHARACTERS_LIST_KEY) as string[] || [];
    if (!existingList.includes(character.id)) {
      existingList.push(character.id);
      await puter.kv.set(CHARACTERS_LIST_KEY, existingList);
    }
  } catch (error) {
    console.error('Failed to save character:', error);
    throw error;
  }
}

export async function getCharactersFromPuter(puterUuid: string): Promise<GrudgeCharacter[]> {
  try {
    const puter = getPuter();
    const characterIds = await puter.kv.get(CHARACTERS_LIST_KEY) as string[] || [];
    
    const characters: GrudgeCharacter[] = [];
    for (const id of characterIds) {
      const char = await puter.kv.get(`${CHARACTER_STORAGE_KEY}_${id}`) as GrudgeCharacter;
      if (char && char.puterUuid === puterUuid) {
        characters.push(char);
      }
    }
    
    return characters;
  } catch (error) {
    console.error('Failed to get characters:', error);
    return [];
  }
}

export async function deleteCharacterFromPuter(characterId: string): Promise<void> {
  try {
    const puter = getPuter();
    await puter.kv.del(`${CHARACTER_STORAGE_KEY}_${characterId}`);
    
    const existingList = await puter.kv.get(CHARACTERS_LIST_KEY) as string[] || [];
    const updatedList = existingList.filter(id => id !== characterId);
    await puter.kv.set(CHARACTERS_LIST_KEY, updatedList);
  } catch (error) {
    console.error('Failed to delete character:', error);
    throw error;
  }
}

export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Guest Account System
export interface GuestAccount {
  id: string;
  username: string;
  passwordHash: string;
  createdAt: string;
  lastLogin: string;
}

const GUEST_ACCOUNTS_KEY = 'grudge_guest_accounts';
const CURRENT_GUEST_KEY = 'grudge_current_guest';

// Simple hash function for passwords (not cryptographically secure, for demo purposes)
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

export async function getGuestAccounts(): Promise<GuestAccount[]> {
  if (isPuterAvailable()) {
    try {
      const puter = getPuter();
      const accounts = await puter.kv.get(GUEST_ACCOUNTS_KEY) as GuestAccount[] | null;
      return accounts || [];
    } catch {
      return [];
    }
  }
  const stored = localStorage.getItem(GUEST_ACCOUNTS_KEY);
  return stored ? JSON.parse(stored) : [];
}

export async function saveGuestAccounts(accounts: GuestAccount[]): Promise<void> {
  if (isPuterAvailable()) {
    try {
      const puter = getPuter();
      await puter.kv.set(GUEST_ACCOUNTS_KEY, accounts);
    } catch (error) {
      console.error('Failed to save guest accounts to Puter:', error);
    }
  }
  localStorage.setItem(GUEST_ACCOUNTS_KEY, JSON.stringify(accounts));
}

export async function registerGuestAccount(username: string, password: string): Promise<{ success: boolean; error?: string; account?: GuestAccount }> {
  const accounts = await getGuestAccounts();
  
  // Check if username already exists
  if (accounts.find(a => a.username.toLowerCase() === username.toLowerCase())) {
    return { success: false, error: 'Username already exists' };
  }

  // Validate username
  if (username.length < 3 || username.length > 20) {
    return { success: false, error: 'Username must be 3-20 characters' };
  }

  // Validate password
  if (password.length < 4) {
    return { success: false, error: 'Password must be at least 4 characters' };
  }

  const newAccount: GuestAccount = {
    id: generateUUID(),
    username: username.trim(),
    passwordHash: simpleHash(password),
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
  };

  accounts.push(newAccount);
  await saveGuestAccounts(accounts);

  return { success: true, account: newAccount };
}

export async function loginGuestAccount(username: string, password: string): Promise<{ success: boolean; error?: string; account?: GuestAccount }> {
  const accounts = await getGuestAccounts();
  const account = accounts.find(a => a.username.toLowerCase() === username.toLowerCase());

  if (!account) {
    return { success: false, error: 'Account not found' };
  }

  if (account.passwordHash !== simpleHash(password)) {
    return { success: false, error: 'Incorrect password' };
  }

  // Update last login
  account.lastLogin = new Date().toISOString();
  await saveGuestAccounts(accounts);

  // Store current guest
  localStorage.setItem(CURRENT_GUEST_KEY, JSON.stringify(account));

  return { success: true, account };
}

export function getCurrentGuest(): GuestAccount | null {
  const stored = localStorage.getItem(CURRENT_GUEST_KEY);
  return stored ? JSON.parse(stored) : null;
}

export function logoutGuest(): void {
  localStorage.removeItem(CURRENT_GUEST_KEY);
}

export async function getGuestCharacters(guestId: string): Promise<GrudgeCharacter[]> {
  if (isPuterAvailable()) {
    try {
      const puter = getPuter();
      const characterIds = await puter.kv.get(`guest_${guestId}_characters`) as string[] || [];
      const characters: GrudgeCharacter[] = [];
      for (const id of characterIds) {
        const char = await puter.kv.get(`${CHARACTER_STORAGE_KEY}_${id}`) as GrudgeCharacter;
        if (char) {
          characters.push(char);
        }
      }
      return characters;
    } catch {
      return [];
    }
  }
  
  // Fallback to localStorage
  const stored = localStorage.getItem(`guest_${guestId}_characters`);
  if (!stored) return [];
  const characterIds = JSON.parse(stored) as string[];
  const characters: GrudgeCharacter[] = [];
  for (const id of characterIds) {
    const charData = localStorage.getItem(`${CHARACTER_STORAGE_KEY}_${id}`);
    if (charData) {
      characters.push(JSON.parse(charData));
    }
  }
  return characters;
}

export async function saveGuestCharacter(guestId: string, character: GrudgeCharacter): Promise<void> {
  if (isPuterAvailable()) {
    try {
      const puter = getPuter();
      await puter.kv.set(`${CHARACTER_STORAGE_KEY}_${character.id}`, character);
      const existingIds = await puter.kv.get(`guest_${guestId}_characters`) as string[] || [];
      if (!existingIds.includes(character.id)) {
        existingIds.push(character.id);
        await puter.kv.set(`guest_${guestId}_characters`, existingIds);
      }
      return;
    } catch (error) {
      console.error('Failed to save guest character to Puter:', error);
    }
  }
  
  // Fallback to localStorage
  localStorage.setItem(`${CHARACTER_STORAGE_KEY}_${character.id}`, JSON.stringify(character));
  const stored = localStorage.getItem(`guest_${guestId}_characters`);
  const existingIds = stored ? JSON.parse(stored) as string[] : [];
  if (!existingIds.includes(character.id)) {
    existingIds.push(character.id);
    localStorage.setItem(`guest_${guestId}_characters`, JSON.stringify(existingIds));
  }
}

export async function deleteGuestCharacter(guestId: string, characterId: string): Promise<void> {
  if (isPuterAvailable()) {
    try {
      const puter = getPuter();
      await puter.kv.del(`${CHARACTER_STORAGE_KEY}_${characterId}`);
      const existingIds = await puter.kv.get(`guest_${guestId}_characters`) as string[] || [];
      const updatedIds = existingIds.filter(id => id !== characterId);
      await puter.kv.set(`guest_${guestId}_characters`, updatedIds);
      return;
    } catch (error) {
      console.error('Failed to delete guest character from Puter:', error);
    }
  }
  
  // Fallback to localStorage
  localStorage.removeItem(`${CHARACTER_STORAGE_KEY}_${characterId}`);
  const stored = localStorage.getItem(`guest_${guestId}_characters`);
  if (stored) {
    const existingIds = JSON.parse(stored) as string[];
    const updatedIds = existingIds.filter(id => id !== characterId);
    localStorage.setItem(`guest_${guestId}_characters`, JSON.stringify(updatedIds));
  }
}

// Delete a guest account and all their characters
export async function deleteGuestAccount(guestId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Get fresh copy of accounts
    const accounts = await getGuestAccounts();
    const accountIndex = accounts.findIndex(a => a.id === guestId);
    
    if (accountIndex === -1) {
      return { success: false, error: 'Account not found' };
    }

    // Get character IDs for this account
    const characters = await getGuestCharacters(guestId);
    const characterIds = characters.map(c => c.id);

    // Delete character data directly (not through deleteGuestCharacter to avoid repeated saves)
    if (isPuterAvailable()) {
      try {
        const puter = getPuter();
        for (const charId of characterIds) {
          await puter.kv.del(`${CHARACTER_STORAGE_KEY}_${charId}`);
        }
        await puter.kv.del(`guest_${guestId}_characters`);
      } catch {
        // Continue with localStorage cleanup
      }
    }
    
    // Clean up localStorage
    for (const charId of characterIds) {
      localStorage.removeItem(`${CHARACTER_STORAGE_KEY}_${charId}`);
    }
    localStorage.removeItem(`guest_${guestId}_characters`);

    // Remove account from list (get fresh copy to avoid stale reference)
    const freshAccounts = await getGuestAccounts();
    const updatedAccounts = freshAccounts.filter(a => a.id !== guestId);
    await saveGuestAccounts(updatedAccounts);

    // If this was the current guest, log them out
    const currentGuest = getCurrentGuest();
    if (currentGuest?.id === guestId) {
      logoutGuest();
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to delete guest account:', error);
    return { success: false, error: 'Failed to delete account' };
  }
}

// Reset guest password (requires knowing the old password or admin access)
export async function resetGuestPassword(
  username: string, 
  newPassword: string, 
  oldPassword?: string
): Promise<{ success: boolean; error?: string }> {
  const accounts = await getGuestAccounts();
  const accountIndex = accounts.findIndex(a => a.username.toLowerCase() === username.toLowerCase());

  if (accountIndex === -1) {
    return { success: false, error: 'Account not found' };
  }

  const account = accounts[accountIndex];

  // If old password provided, verify it
  if (oldPassword !== undefined && account.passwordHash !== simpleHash(oldPassword)) {
    return { success: false, error: 'Current password is incorrect' };
  }

  // Validate new password
  if (newPassword.length < 4) {
    return { success: false, error: 'New password must be at least 4 characters' };
  }

  // Update password
  accounts[accountIndex] = {
    ...account,
    passwordHash: simpleHash(newPassword),
  };

  await saveGuestAccounts(accounts);

  // Update current guest session if they're changing their own password
  const currentGuest = getCurrentGuest();
  if (currentGuest?.id === account.id) {
    localStorage.setItem(CURRENT_GUEST_KEY, JSON.stringify(accounts[accountIndex]));
  }

  return { success: true };
}

// Admin reset password (no old password required)
export async function adminResetGuestPassword(
  guestId: string, 
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  const accounts = await getGuestAccounts();
  const accountIndex = accounts.findIndex(a => a.id === guestId);

  if (accountIndex === -1) {
    return { success: false, error: 'Account not found' };
  }

  if (newPassword.length < 4) {
    return { success: false, error: 'New password must be at least 4 characters' };
  }

  accounts[accountIndex] = {
    ...accounts[accountIndex],
    passwordHash: simpleHash(newPassword),
  };

  await saveGuestAccounts(accounts);
  return { success: true };
}

// Export character data as JSON
export interface CharacterExport {
  version: string;
  exportedAt: string;
  account: {
    username: string;
    createdAt: string;
  };
  characters: GrudgeCharacter[];
}

export async function exportGuestData(guestId: string): Promise<CharacterExport | null> {
  try {
    const accounts = await getGuestAccounts();
    const account = accounts.find(a => a.id === guestId);
    
    if (!account) return null;

    // Await all character data to be fully loaded
    const characters = await getGuestCharacters(guestId);
    
    // Create a deep copy of characters to avoid reference issues
    const charactersCopy = JSON.parse(JSON.stringify(characters)) as GrudgeCharacter[];

    return {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      account: {
        username: account.username,
        createdAt: account.createdAt,
      },
      characters: charactersCopy,
    };
  } catch (error) {
    console.error('Failed to export guest data:', error);
    return null;
  }
}

// Download export as file
export function downloadExport(data: CharacterExport): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `grudge-warlords-${data.account.username}-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
