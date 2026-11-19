import { randomUUID } from 'node:crypto';
import { CATEGORIAS, MOBILIDADES, CONDICOES, MOMENTOS } from './enums.js';
import { ValidacaoError } from '../errors/AppError.js';

export class Exercicio {
  /**
   * @param momento 'inicio' | 'fim' para exercícios de respiração (abertura/encerramento
   *                da sessão); null para os demais.
   * @param cuidados mapa condição -> orientação específica (ex.: { hipertensao: '...' })
   */
  constructor({
    id = randomUUID(),
    nome,
    categoria,
    momento = null,
    mobilidades,
    serie,
    observacao,
    cuidados = {},
  }) {
    this.id = id;
    this.nome = nome;
    this.categoria = categoria;
    this.momento = momento;
    this.mobilidades = mobilidades;
    this.serie = serie;
    this.observacao = observacao;
    this.cuidados = cuidados;
  }

  static validar(d) {
    const erros = [];
    if (typeof d.nome !== 'string' || d.nome.trim().length < 3) {
      erros.push('nome: informe ao menos 3 caracteres');
    }
    if (!CATEGORIAS.includes(d.categoria)) {
      erros.push(`categoria: use uma de ${CATEGORIAS.join(', ')}`);
    }
    if (d.categoria === 'respiracao' && !MOMENTOS.includes(d.momento)) {
      erros.push(`momento: exercícios de respiração exigem um de ${MOMENTOS.join(', ')}`);
    }
    if (d.categoria !== 'respiracao' && d.momento != null) {
      erros.push('momento: só se aplica a exercícios de respiração');
    }
    if (
      !Array.isArray(d.mobilidades) ||
      d.mobilidades.length === 0 ||
      d.mobilidades.some((m) => !MOBILIDADES.includes(m))
    ) {
      erros.push(`mobilidades: informe uma lista com valores de ${MOBILIDADES.join(', ')}`);
    }
    if (typeof d.serie !== 'string' || d.serie.trim() === '') {
      erros.push('serie: informe as séries/repetições (ex.: "2 séries de 10 repetições")');
    }
    if (typeof d.observacao !== 'string' || d.observacao.trim() === '') {
      erros.push('observacao: explique como executar o exercício');
    }
    if (d.cuidados != null) {
      const ehObjeto = typeof d.cuidados === 'object' && !Array.isArray(d.cuidados);
      if (!ehObjeto || Object.keys(d.cuidados).some((c) => !CONDICOES.includes(c) || c === 'nenhuma')) {
        erros.push('cuidados: use um objeto { condicao: "texto" } com condições válidas');
      }
    }
    return erros;
  }

  static criar(dados = {}) {
    const erros = Exercicio.validar(dados);
    if (erros.length > 0) throw new ValidacaoError(erros);
    return new Exercicio({
      nome: dados.nome.trim(),
      categoria: dados.categoria,
      momento: dados.categoria === 'respiracao' ? dados.momento : null,
      mobilidades: [...new Set(dados.mobilidades)],
      serie: dados.serie.trim(),
      observacao: dados.observacao.trim(),
      cuidados: dados.cuidados ?? {},
    });
  }

  permiteMobilidade(mobilidade) {
    return this.mobilidades.includes(mobilidade);
  }

  /** Orientações extras do exercício para as condições de saúde informadas. */
  cuidadosPara(condicoes) {
    return condicoes.filter((c) => this.cuidados[c]).map((c) => this.cuidados[c]);
  }
}
