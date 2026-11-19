import { randomUUID } from 'node:crypto';

/**
 * Plano semanal personalizado.
 * sessoes: [{ dia, exercicios: [{ ordem, exercicioId, nome, categoria, serie, observacao, cuidados }] }]
 */
export class PlanoTreino {
  constructor({
    id = randomUUID(),
    idosoId,
    objetivo,
    frequencia,
    duracao,
    sessoes,
    avisos = [],
    geradoEm = new Date().toISOString(),
  }) {
    this.id = id;
    this.idosoId = idosoId;
    this.objetivo = objetivo;
    this.frequencia = frequencia;
    this.duracao = duracao;
    this.sessoes = sessoes;
    this.avisos = avisos;
    this.geradoEm = geradoEm;
  }

  get totalExercicios() {
    return this.sessoes.reduce((soma, s) => soma + s.exercicios.length, 0);
  }

  possuiSessao(dia) {
    return this.sessoes.some((s) => s.dia === dia);
  }

  toJSON() {
    return {
      id: this.id,
      idosoId: this.idosoId,
      objetivo: this.objetivo,
      frequencia: this.frequencia,
      duracao: this.duracao,
      sessoes: this.sessoes,
      avisos: this.avisos,
      totalExercicios: this.totalExercicios,
      geradoEm: this.geradoEm,
    };
  }
}
