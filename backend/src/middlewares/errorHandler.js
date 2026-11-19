import { AppError } from '../errors/AppError.js';

export function naoEncontrado(req, res) {
  res.status(404).json({ erro: `Rota não encontrada: ${req.method} ${req.originalUrl}` });
}

// Express identifica middlewares de erro pela assinatura com 4 parâmetros.
// eslint-disable-next-line no-unused-vars
export function tratadorDeErros(err, req, res, next) {
  if (err instanceof AppError) {
    return res.status(err.status).json({ erro: err.message, detalhes: err.detalhes });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ erro: 'JSON inválido no corpo da requisição', detalhes: [] });
  }
  console.error(err);
  return res.status(500).json({ erro: 'Erro interno do servidor', detalhes: [] });
}
