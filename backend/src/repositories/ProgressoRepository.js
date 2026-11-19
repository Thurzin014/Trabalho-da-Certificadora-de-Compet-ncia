import path from 'node:path';
import { JsonRepository } from './JsonRepository.js';
import { RegistroProgresso } from '../models/RegistroProgresso.js';

export class ProgressoRepository extends JsonRepository {
  constructor(dataDir) {
    super(path.join(dataDir, 'progresso.json'), RegistroProgresso);
  }

  listarPorIdoso(idosoId) {
    return this.listar((r) => r.idosoId === idosoId).sort((a, b) => b.data.localeCompare(a.data));
  }
}
