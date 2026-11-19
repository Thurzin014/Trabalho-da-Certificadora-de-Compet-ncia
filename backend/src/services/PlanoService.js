import { GeradorPlano } from './GeradorPlano.js';
import { PlanoTreino } from '../models/PlanoTreino.js';
import { AppError, NaoEncontradoError, ValidacaoError } from '../errors/AppError.js';
import { DURACOES, FREQUENCIA_MIN, FREQUENCIA_MAX } from '../models/enums.js';

export class PlanoService {
  constructor({ exercicioRepository, planoRepository, idosoService }) {
    this.exercicioRepository = exercicioRepository;
    this.planoRepository = planoRepository;
    this.idosoService = idosoService;
  }

  /** Valida os parâmetros do plano (dias por semana e duração da sessão). */
  static validarParametros({ frequencia, duracao } = {}) {
    const erros = [];
    if (!Number.isInteger(frequencia) || frequencia < FREQUENCIA_MIN || frequencia > FREQUENCIA_MAX) {
      erros.push(`frequencia: use um inteiro de ${FREQUENCIA_MIN} a ${FREQUENCIA_MAX} dias por semana`);
    }
    if (!DURACOES.includes(duracao)) {
      erros.push(`duracao: use uma de ${DURACOES.join(', ')}`);
    }
    return erros;
  }

  gerar(idosoId, parametros = {}) {
    const idoso = this.idosoService.buscar(idosoId);
    const erros = PlanoService.validarParametros(parametros);
    if (erros.length > 0) throw new ValidacaoError(erros);

    const gerador = new GeradorPlano(this.exercicioRepository.listar());
    const { sessoes, avisos } = gerador.gerar(idoso, parametros);
    if (sessoes.some((s) => s.exercicios.length === 0)) {
      throw new AppError(422, 'O catálogo não possui exercícios suficientes para este perfil');
    }

    const plano = new PlanoTreino({
      idosoId: idoso.id,
      objetivo: idoso.objetivo,
      frequencia: parametros.frequencia,
      duracao: parametros.duracao,
      sessoes,
      avisos,
    });
    return this.planoRepository.salvar(plano);
  }

  listarPorIdoso(idosoId) {
    this.idosoService.buscar(idosoId);
    return this.planoRepository.listarPorIdoso(idosoId);
  }

  buscar(id) {
    const plano = this.planoRepository.buscarPorId(id);
    if (!plano) throw new NaoEncontradoError('Plano');
    return plano;
  }
}
