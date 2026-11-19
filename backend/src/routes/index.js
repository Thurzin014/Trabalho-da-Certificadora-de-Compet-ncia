import { Router } from 'express';

export function criarRotas({ idosoController, exercicioController, questionarioController, planoController, progressoController }) {
  const router = Router();

  // RF03 / RF07 — Questionário
  router.get('/questionario', questionarioController.obter);
  router.post('/questionario/respostas', questionarioController.responder);

  // RF04 / RF05 — Catálogo de exercícios
  router.get('/exercicios', exercicioController.listar);
  router.get('/exercicios/:id', exercicioController.buscar);
  router.post('/exercicios', exercicioController.cadastrar);

  // RF01 / RF02 — Perfil do idoso
  router.post('/idosos', idosoController.cadastrar);
  router.get('/idosos', idosoController.listar);
  router.get('/idosos/:id', idosoController.buscar);
  router.put('/idosos/:id', idosoController.atualizar);
  router.delete('/idosos/:id', idosoController.remover);

  // RF06 / RF08 / RF09 — Planos de treino
  router.post('/idosos/:id/planos', planoController.gerar);
  router.get('/idosos/:id/planos', planoController.listarPorIdoso);
  router.get('/planos/:id', planoController.buscar);
  router.get('/planos/:id/exportar', planoController.exportar);

  // RF10 / RF11 — Progresso
  router.post('/planos/:id/progresso', progressoController.registrar);
  router.get('/idosos/:id/progresso', progressoController.historico);
  router.get('/idosos/:id/progresso/resumo', progressoController.resumo);

  return router;
}
