import { randomUUID } from 'node:crypto';
import { ValidacaoError } from '../errors/AppError.js';

/** Registro de uma sessão de exercícios efetivamente realizada. */
export class RegistroProgresso {
  constructor({
    id = randomUUID(),
    idosoId,
    planoId,
    dia,
    data = new Date().toISOString(),
    esforcoPercebido = null,
    observacao = '',
  }) {
    this.id = id;
    this.idosoId = idosoId;
    this.planoId = planoId;
    this.dia = dia;
    this.data = data;
    this.esforcoPercebido = esforcoPercebido;
    this.observacao = observacao;
  }

  /**
   * @param plano PlanoTreino ao qual a sessão pertence (usado para validar o dia).
   * esforcoPercebido: escala de 1 (muito leve) a 10 (máximo esforço), opcional.
   */
  static criar(dados = {}, plano) {
    const erros = [];

    if (!Number.isInteger(dados.dia) || !plano.possuiSessao(dados.dia)) {
      erros.push(`dia: use um número de 1 a ${plano.sessoes.length} (sessões do plano)`);
    }

    let data = new Date().toISOString();
    if (dados.data !== undefined) {
      const ms = Date.parse(dados.data);
      if (Number.isNaN(ms)) {
        erros.push('data: use o formato ISO 8601 (ex.: 2026-10-13T09:00:00-03:00)');
      } else if (ms > Date.now() + 60_000) {
        erros.push('data: não pode estar no futuro');
      } else {
        data = new Date(ms).toISOString();
      }
    }

    const esforco = dados.esforcoPercebido ?? null;
    if (esforco !== null && (!Number.isInteger(esforco) || esforco < 1 || esforco > 10)) {
      erros.push('esforcoPercebido: use um inteiro de 1 a 10');
    }

    const observacao = dados.observacao ?? '';
    if (typeof observacao !== 'string' || observacao.length > 500) {
      erros.push('observacao: texto de até 500 caracteres');
    }

    if (erros.length > 0) throw new ValidacaoError(erros);

    return new RegistroProgresso({
      idosoId: plano.idosoId,
      planoId: plano.id,
      dia: dados.dia,
      data,
      esforcoPercebido: esforco,
      observacao: observacao.trim(),
    });
  }
}
