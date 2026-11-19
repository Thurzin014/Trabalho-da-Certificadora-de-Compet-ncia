export class AppError extends Error {
  constructor(status, mensagem, detalhes = []) {
    super(mensagem);
    this.name = this.constructor.name;
    this.status = status;
    this.detalhes = detalhes;
  }
}

export class ValidacaoError extends AppError {
  constructor(detalhes) {
    super(400, 'Dados inválidos', detalhes);
  }
}

export class NaoEncontradoError extends AppError {
  constructor(recurso) {
    super(404, `${recurso} não encontrado(a)`);
  }
}
