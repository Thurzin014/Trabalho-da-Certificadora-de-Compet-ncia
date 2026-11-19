import { Idoso } from '../models/Idoso.js';
import { PlanoService } from './PlanoService.js';
import { ValidacaoError } from '../errors/AppError.js';
import { FREQUENCIA_MIN, FREQUENCIA_MAX } from '../models/enums.js';

const opcao = (valor, rotulo) => ({ valor, rotulo });

const NOME_PADRAO = 'Sem identificação';

const PERGUNTAS = Object.freeze([
  { campo: 'nome', pergunta: 'Qual é o seu nome?', tipo: 'texto', obrigatoria: true },
  {
    campo: 'faixaEtaria',
    pergunta: 'Qual é a sua faixa de idade?',
    tipo: 'escolha-unica',
    obrigatoria: true,
    opcoes: [opcao('60-69', '60 a 69 anos'), opcao('70-79', '70 a 79 anos'), opcao('80+', '80 anos ou mais')],
  },
  {
    campo: 'mobilidade',
    pergunta: 'Como é a sua mobilidade hoje?',
    tipo: 'escolha-unica',
    obrigatoria: true,
    opcoes: [
      opcao('sentado', 'Faço a maioria das atividades sentado(a)'),
      opcao('apoio', 'Ando com apoio (bengala, andador ou acompanhante)'),
      opcao('independente', 'Ando sem apoio e me sinto ativo(a)'),
    ],
  },
  {
    campo: 'condicoes',
    pergunta: 'Você tem alguma dessas condições?',
    tipo: 'multipla-escolha',
    obrigatoria: true,
    opcoes: [
      opcao('hipertensao', 'Pressão alta (hipertensão)'),
      opcao('diabetes', 'Diabetes'),
      opcao('articular', 'Dor nas articulações / osteoporose'),
      opcao('nenhuma', 'Nenhuma dessas'),
    ],
  },
  {
    campo: 'objetivo',
    pergunta: 'Qual é o seu principal objetivo?',
    tipo: 'escolha-unica',
    obrigatoria: true,
    opcoes: [
      opcao('equilibrio', 'Equilíbrio e prevenir quedas'),
      opcao('forca', 'Ganhar força muscular'),
      opcao('flexibilidade', 'Ganhar flexibilidade'),
      opcao('geral', 'Condicionamento geral'),
    ],
  },
  {
    campo: 'frequencia',
    pergunta: 'Quantos dias por semana você quer se exercitar?',
    tipo: 'numero',
    obrigatoria: true,
    minimo: FREQUENCIA_MIN,
    maximo: FREQUENCIA_MAX,
  },
  {
    campo: 'duracao',
    pergunta: 'Quanto tempo por sessão?',
    tipo: 'escolha-unica',
    obrigatoria: true,
    opcoes: [opcao('curta', '15 a 20 minutos'), opcao('media', '20 a 30 minutos'), opcao('longa', '30 a 45 minutos')],
  },
]);

export class QuestionarioService {
  constructor({ idosoService, planoService }) {
    this.idosoService = idosoService;
    this.planoService = planoService;
  }

  obter() {
    return { perguntas: PERGUNTAS };
  }

  /**
   * Recebe todas as respostas do questionário, cria o perfil do idoso e gera o plano
   * personalizado. Tudo é validado antes de gravar, para não deixar um perfil órfão.
   * O nome é opcional no questionário: quando não informado, usa um rótulo neutro.
   */
  responder(respostas) {
    const corpo = respostas ?? {};
    const semNome = corpo.nome == null || (typeof corpo.nome === 'string' && corpo.nome.trim() === '');
    const dados = {
      ...corpo,
      nome: semNome ? NOME_PADRAO : corpo.nome,
      condicoes: corpo.condicoes ?? ['nenhuma'],
    };

    const erros = [...Idoso.validar(dados), ...PlanoService.validarParametros(corpo)];
    if (erros.length > 0) throw new ValidacaoError(erros);

    const idoso = this.idosoService.cadastrar(dados);
    const plano = this.planoService.gerar(idoso.id, {
      frequencia: corpo.frequencia,
      duracao: corpo.duracao,
    });
    return { idoso, plano };
  }
}
