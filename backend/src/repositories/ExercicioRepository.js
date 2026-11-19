import fs from 'node:fs';
import path from 'node:path';
import { JsonRepository } from './JsonRepository.js';
import { Exercicio } from '../models/Exercicio.js';
import { config } from '../config.js';

/** Na primeira execução, o catálogo é inicializado a partir do arquivo de seed. */
function prepararArquivo(dataDir) {
  const arquivo = path.join(dataDir, 'exercicios.json');
  if (!fs.existsSync(arquivo)) {
    fs.mkdirSync(dataDir, { recursive: true });
    fs.copyFileSync(config.seedExercicios, arquivo);
  }
  return arquivo;
}

export class ExercicioRepository extends JsonRepository {
  constructor(dataDir) {
    super(prepararArquivo(dataDir), Exercicio);
  }
}
