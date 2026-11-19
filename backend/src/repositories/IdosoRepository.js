import path from 'node:path';
import { JsonRepository } from './JsonRepository.js';
import { Idoso } from '../models/Idoso.js';

export class IdosoRepository extends JsonRepository {
  constructor(dataDir) {
    super(path.join(dataDir, 'idosos.json'), Idoso);
  }
}
