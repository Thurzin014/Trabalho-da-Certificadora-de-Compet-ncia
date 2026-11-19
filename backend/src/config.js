import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raizBackend = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const config = Object.freeze({
  porta: Number(process.env.PORT) || 3000,
  dataDir: process.env.DATA_DIR || path.join(raizBackend, 'data'),
  seedExercicios: path.join(raizBackend, 'src', 'data', 'exercicios.seed.json'),
});
