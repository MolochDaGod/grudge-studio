import { Puter } from '@heyputer/puter.js';
import { init } from '@heyputer/puter.js/src/init.cjs';

const puterAuthToken = process.env.puterAuthToken || '';

export const puter = init(puterAuthToken) as Puter;
