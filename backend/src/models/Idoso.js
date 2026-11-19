import { randomUUID } from 'node:crypto';
import { FAIXAS_ETARIAS, MOBILIDADES, CONDICOES, OBJETIVOS } from './enums.js';
import { ValidacaoError } from '../errors/AppError.js';

export class Idoso {
  constructor({
    id = randomUUID(),
    nome,
    faixaEtaria,
    mobilidade,
    condicoes = ['nenhuma'],
    objetivo,
    criadoEm = new Date().toISOString(),
    atualizadoEm = criadoEm,
  }) {
    this.id = id;
    this.nome = nome;
    this.faixaEtaria = faixaEtaria;
    this.mobilidade = mobilidade;
    this.condicoes = condicoes;
    this.objetivo = objetivo;
    this.criadoEm = criadoEm;
    this.atualizadoEm = atualizadoEm;
  }

  /** Retorna a lista de mensagens de erro (vazia se os dados são válidos). */
  static validar(d) {
    const erros = [];

    if (typeof d.nome !== 'string' || d.nome.trim().length < 2) {
      erros.push('nome: informe ao menos 2 caracteres');
    } else if (d.nome.trim().length > 80) {
      erros.push('nome: máximo de 80 caracteres');
    }
    if (!FAIXAS_ETARIAS.includes(d.faixaEtaria)) {
      erros.push(`faixaEtaria: use um de ${FAIXAS_ETARIAS.join(', ')}`);
    }
    if (!MOBILIDADES.includes(d.mobilidade)) {
      erros.push(`mobilidade: use um de ${MOBILIDADES.join(', ')}`);
    }
    if (!OBJETIVOS.includes(d.objetivo)) {
      erros.push(`objetivo: use um de ${OBJETIVOS.join(', ')}`);
    }

    if (!Array.isArray(d.condicoes) || d.condicoes.length === 0) {
      erros.push(`condicoes: informe uma lista com valores de ${CONDICOES.join(', ')}`);
    } else {
      const invalidas = d.condicoes.filter((c) => !CONDICOES.includes(c));
      if (invalidas.length > 0) {
        erros.push(`condicoes: valores inválidos (${invalidas.join(', ')})`);
      }
      if (d.condicoes.includes('nenhuma') && d.condicoes.length > 1) {
        erros.push('condicoes: "nenhuma" não pode ser combinada com outras condições');
      }
    }
    return erros;
  }

  static criar(dados = {}) {
    const completos = { ...dados, condicoes: dados.condicoes ?? ['nenhuma'] };
    const erros = Idoso.validar(completos);
    if (erros.length > 0) throw new ValidacaoError(erros);
    return new Idoso({
      nome: completos.nome.trim(),
      faixaEtaria: completos.faixaEtaria,
      mobilidade: completos.mobilidade,
      condicoes: [...new Set(completos.condicoes)],
      objetivo: completos.objetivo,
    });
  }

  atualizar(dados = {}) {
    const mesclado = {
      nome: dados.nome ?? this.nome,
      faixaEtaria: dados.faixaEtaria ?? this.faixaEtaria,
      mobilidade: dados.mobilidade ?? this.mobilidade,
      condicoes: dados.condicoes ?? this.condicoes,
      objetivo: dados.objetivo ?? this.objetivo,
    };
    const erros = Idoso.validar(mesclado);
    if (erros.length > 0) throw new ValidacaoError(erros);

    this.nome = mesclado.nome.trim();
    this.faixaEtaria = mesclado.faixaEtaria;
    this.mobilidade = mesclado.mobilidade;
    this.condicoes = [...new Set(mesclado.condicoes)];
    this.objetivo = mesclado.objetivo;
    this.atualizadoEm = new Date().toISOString();
    return this;
  }
}
