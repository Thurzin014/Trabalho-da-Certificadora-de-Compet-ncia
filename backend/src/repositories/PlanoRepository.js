import path from 'node:path';
import { JsonRepository } from './JsonRepository.js';
import { PlanoTreino } from '../models/PlanoTreino.js';

export class PlanoRepository extends JsonRepository {
  constructor(dataDir) {
    super(path.join(dataDir, 'planos.json'), PlanoTreino);
  }

  listarPorIdoso(idosoId) {
    return this.listar((p) => p.idosoId === idosoId).sort((a, b) => b.geradoEm.localeCompare(a.geradoEm));
  }
}
