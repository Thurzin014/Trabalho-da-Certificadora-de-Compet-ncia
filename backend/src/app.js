import express from 'express';
import { config } from './config.js';
import { criarRotas } from './routes/index.js';
import { naoEncontrado, tratadorDeErros } from './middlewares/errorHandler.js';

import { IdosoRepository } from './repositories/IdosoRepository.js';
import { ExercicioRepository } from './repositories/ExercicioRepository.js';
import { PlanoRepository } from './repositories/PlanoRepository.js';
import { ProgressoRepository } from './repositories/ProgressoRepository.js';

import { IdosoService } from './services/IdosoService.js';
import { ExercicioService } from './services/ExercicioService.js';
import { PlanoService } from './services/PlanoService.js';
import { QuestionarioService } from './services/QuestionarioService.js';
import { ProgressoService } from './services/ProgressoService.js';
import { ExportacaoService } from './services/ExportacaoService.js';

import { IdosoController } from './controllers/IdosoController.js';
import { ExercicioController } from './controllers/ExercicioController.js';
import { QuestionarioController } from './controllers/QuestionarioController.js';
import { PlanoController } from './controllers/PlanoController.js';
import { ProgressoController } from './controllers/ProgressoController.js';

function permitirOrigemCruzada(req, res, next) {
  res.set({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  if (req.method === 'OPTIONS') return res.status(204).end();
  return next();
}

/**
 * Composition root: cria os repositórios, injeta nos serviços e os serviços nos
 * controllers. Receber `dataDir` permite que os testes usem uma pasta temporária.
 */
export function criarApp({ dataDir = config.dataDir } = {}) {
  const idosoRepository = new IdosoRepository(dataDir);
  const exercicioRepository = new ExercicioRepository(dataDir);
  const planoRepository = new PlanoRepository(dataDir);
  const progressoRepository = new ProgressoRepository(dataDir);

  const idosoService = new IdosoService({ idosoRepository, planoRepository, progressoRepository });
  const exercicioService = new ExercicioService({ exercicioRepository });
  const planoService = new PlanoService({ exercicioRepository, planoRepository, idosoService });
  const questionarioService = new QuestionarioService({ idosoService, planoService });
  const progressoService = new ProgressoService({ progressoRepository, planoRepository, idosoService, planoService });
  const exportacaoService = new ExportacaoService({ planoService, idosoService });

  const rotas = criarRotas({
    idosoController: new IdosoController(idosoService),
    exercicioController: new ExercicioController(exercicioService),
    questionarioController: new QuestionarioController(questionarioService),
    planoController: new PlanoController(planoService, exportacaoService),
    progressoController: new ProgressoController(progressoService),
  });

  const app = express();
  app.use(permitirOrigemCruzada);
  app.use(express.json());

  app.get('/', (req, res) => res.json({ projeto: 'TEDI — Plano de Exercícios', api: '/api', saude: '/saude' }));
  app.get('/saude', (req, res) => res.json({ status: 'ok' }));
  app.use('/api', rotas);

  app.use(naoEncontrado);
  app.use(tratadorDeErros);
  return app;
}
