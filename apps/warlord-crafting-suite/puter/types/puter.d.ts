declare global {
  const puter: PuterSDK;
}

export interface PuterSDK {
  auth: PuterAuth;
  ai: PuterAI;
  fs: PuterFS;
  kv: PuterKV;
  apps: PuterApps;
  hosting: PuterHosting;
  net: PuterNet;
  ui: PuterUI;
  print: (content: string) => void;
  randName: () => string;
  appDataPath?: string;
  path?: {
    join: (...paths: string[]) => string;
  };
}

export interface PuterAuth {
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  isSignedIn: () => boolean;
  getUser: () => Promise<PuterUser>;
  getToken: () => Promise<string>;
}

export interface PuterUser {
  uuid: string;
  username: string;
  email_confirmed: boolean;
}

export interface PuterAI {
  chat: (
    prompt: string | Array<{ role: string; content: string }>,
    options?: {
      model?: string;
      stream?: boolean;
      max_tokens?: number;
      temperature?: number;
    }
  ) => Promise<PuterAIResponse | AsyncIterable<{ text: string }>>;
  txt2img: (prompt: string, options?: { model?: string; quality?: string }) => Promise<HTMLImageElement>;
  img2txt: (image: string | Blob) => Promise<string>;
  txt2speech: (text: string, options?: { language?: string; voice?: string; engine?: string }) => Promise<HTMLAudioElement>;
}

export interface PuterAIResponse {
  message?: {
    role: string;
    content: string;
  };
}

export interface PuterFS {
  write: (path: string, content: string | Blob, options?: { createMissingParents?: boolean }) => Promise<{ path: string }>;
  read: (path: string) => Promise<Blob>;
  delete: (path: string) => Promise<void>;
  mkdir: (path: string) => Promise<void>;
  readdir: (path: string) => Promise<Array<{ name: string; is_dir: boolean }>>;
  stat: (path: string) => Promise<{ size: number; created: string; modified: string; is_dir: boolean }>;
  copy: (source: string, destination: string) => Promise<void>;
  move: (source: string, destination: string) => Promise<void>;
  rename: (oldPath: string, newPath: string) => Promise<void>;
}

export interface PuterKV {
  set: (key: string, value: unknown) => Promise<void>;
  get: <T = unknown>(key: string) => Promise<T | null>;
  del: (key: string) => Promise<void>;
  list: () => Promise<string[]>;
  incr: (key: string, amount?: number) => Promise<number>;
  decr: (key: string, amount?: number) => Promise<number>;
  flush: () => Promise<void>;
}

export interface PuterApps {
  create: (name: string, indexURL: string) => Promise<PuterApp>;
  update: (name: string, options: Partial<PuterAppOptions>) => Promise<PuterApp>;
  get: (name: string) => Promise<PuterApp>;
  list: () => Promise<PuterApp[]>;
  delete: (name: string) => Promise<void>;
}

export interface PuterApp {
  name: string;
  indexURL: string;
  title?: string;
  description?: string;
  icon?: string;
  maximizeOnStart?: boolean;
  background?: boolean;
  metadata?: Record<string, unknown>;
}

export interface PuterAppOptions {
  name: string;
  indexURL: string;
  title: string;
  description: string;
  icon: string;
  maximizeOnStart: boolean;
  background: boolean;
  filetypeAssociations: string[];
  metadata: Record<string, unknown>;
}

export interface PuterHosting {
  create: (subdomain: string, directory: string) => Promise<{ url: string }>;
  update: (subdomain: string, directory: string) => Promise<void>;
  delete: (subdomain: string) => Promise<void>;
  list: () => Promise<Array<{ subdomain: string; url: string }>>;
}

export interface PuterNet {
  fetch: (url: string, options?: RequestInit) => Promise<Response>;
  socket: (url: string) => WebSocket;
}

export interface PuterUI {
  alert: (message: string) => Promise<void>;
  confirm: (message: string) => Promise<boolean>;
  prompt: (message: string, defaultValue?: string) => Promise<string | null>;
  showOpenFilePicker: (options?: { multiple?: boolean; accept?: string[] }) => Promise<File[]>;
  showSaveFilePicker: (options?: { suggestedName?: string }) => Promise<{ write: (content: Blob | string) => Promise<void> }>;
}

export {};
