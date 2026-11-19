const QUANTIDADE_POR_DURACAO = Object.freeze({ curta: 4, media: 6, longa: 8 });

const CATEGORIA_FOCO = Object.freeze({
  equilibrio: 'equilibrio',
  forca: 'forca',
  flexibilidade: 'flexibilidade',
  geral: 'aerobico',
});

const COMPLEMENTARES = Object.freeze({
  equilibrio: ['forca', 'aerobico'],
  forca: ['equilibrio', 'aerobico'],
  flexibilidade: ['forca', 'equilibrio'],
  geral: ['forca', 'equilibrio'],
});

const AVISOS_POR_CONDICAO = Object.freeze({
  hipertensao:
    'Pressão alta: evite prender a respiração e levante-se devagar. Interrompa em caso de tontura ou dor de cabeça.',
  diabetes:
    'Diabetes: faça uma refeição leve antes e mantenha por perto uma fonte de açúcar, conforme orientação médica.',
  articular:
    'Dor nas articulações/osteoporose: movimentos lentos e sem impacto. Pare se a dor aumentar.',
});

const AVISO_80_MAIS =
  'Faça os exercícios perto de um apoio firme e, sempre que possível, com um acompanhante.';

const AVISO_GERAL =
  'Beba água antes e depois, use roupas confortáveis e pare em caso de dor, tontura ou falta de ar. ' +
  'Este plano é educativo e não substitui a avaliação de um médico ou profissional de educação física.';

/**
 * Regra de negócio central: monta as sessões de um plano a partir do perfil do idoso.
 *
 * Estrutura de cada sessão:
 *   respiração (abertura) -> exercícios principais -> alongamento -> relaxamento (só sessões >= 6 itens)
 *
 * - Só entram exercícios compatíveis com a mobilidade informada.
 * - Os principais alternam, começando pelo foco, o objetivo com categorias complementares.
 * - A lista é girada pelo índice da sessão para que os dias variem entre si.
 * - Faixa etária 80+ reduz 1 exercício por sessão (mínimo de 4).
 */
export class GeradorPlano {
  constructor(catalogo) {
    this.catalogo = catalogo;
  }

  static quantidadePorSessao(duracao, faixaEtaria) {
    const base = QUANTIDADE_POR_DURACAO[duracao];
    return faixaEtaria === '80+' ? Math.max(4, base - 1) : base;
  }

  static avisos(idoso) {
    const avisos = idoso.condicoes.filter((c) => AVISOS_POR_CONDICAO[c]).map((c) => AVISOS_POR_CONDICAO[c]);
    if (idoso.faixaEtaria === '80+') avisos.push(AVISO_80_MAIS);
    avisos.push(AVISO_GERAL);
    return avisos;
  }

  gerar(idoso, { frequencia, duracao }) {
    const disponiveis = this.catalogo.filter((e) => e.permiteMobilidade(idoso.mobilidade));
    const quantidade = GeradorPlano.quantidadePorSessao(duracao, idoso.faixaEtaria);

    const sessoes = [];
    for (let indice = 0; indice < frequencia; indice++) {
      const exercicios = this.#montarSessao(indice, disponiveis, idoso, quantidade);
      sessoes.push({
        dia: indice + 1,
        exercicios: exercicios.map((e, posicao) => ({
          ordem: posicao + 1,
          exercicioId: e.id,
          nome: e.nome,
          categoria: e.categoria,
          serie: e.serie,
          observacao: e.observacao,
          cuidados: e.cuidadosPara(idoso.condicoes),
        })),
      });
    }
    return { sessoes, avisos: GeradorPlano.avisos(idoso) };
  }

  #montarSessao(indice, disponiveis, idoso, quantidade) {
    const girar = (lista) => {
      if (lista.length === 0) return [];
      const deslocamento = indice % lista.length;
      return [...lista.slice(deslocamento), ...lista.slice(0, deslocamento)];
    };
    const usados = new Set();
    const escolher = (exercicio) => {
      if (!exercicio || usados.has(exercicio.id)) return null;
      usados.add(exercicio.id);
      return exercicio;
    };

    const respiracao = disponiveis.filter((e) => e.categoria === 'respiracao');
    const abertura = escolher(girar(respiracao.filter((e) => e.momento === 'inicio'))[0]);
    const encerramento =
      quantidade >= 6 ? escolher(girar(respiracao.filter((e) => e.momento === 'fim'))[0]) : null;
    const alongamento =
      idoso.objetivo !== 'flexibilidade'
        ? escolher(girar(disponiveis.filter((e) => e.categoria === 'flexibilidade'))[0])
        : null;

    const alvo = quantidade - [abertura, encerramento, alongamento].filter(Boolean).length;
    const principais = disponiveis.filter((e) => e.categoria !== 'respiracao');
    const foco = girar(principais.filter((e) => e.categoria === CATEGORIA_FOCO[idoso.objetivo]));
    const complementares = girar(principais.filter((e) => COMPLEMENTARES[idoso.objetivo].includes(e.categoria)));

    const meio = [];
    const adicionar = (exercicio) => {
      const escolhido = escolher(exercicio);
      if (escolhido) meio.push(escolhido);
    };

    let f = 0;
    let c = 0;
    while (meio.length < alvo && (f < foco.length || c < complementares.length)) {
      if (f < foco.length) adicionar(foco[f++]);
      if (meio.length < alvo && c < complementares.length) adicionar(complementares[c++]);
    }
    // Se o foco + complementares não bastaram, completa com qualquer exercício compatível.
    for (const exercicio of girar(principais)) {
      if (meio.length >= alvo) break;
      adicionar(exercicio);
    }

    return [abertura, ...meio, alongamento, encerramento].filter(Boolean);
  }
}
