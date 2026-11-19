import { RegistroProgresso } from '../models/RegistroProgresso.js';

const SETE_DIAS_MS = 7 * 24 * 60 * 60 * 1000;

export class ProgressoService {
  constructor({ progressoRepository, planoRepository, idosoService, planoService }) {
    this.progressoRepository = progressoRepository;
    this.planoRepository = planoRepository;
    this.idosoService = idosoService;
    this.planoService = planoService;
  }

  registrar(planoId, dados) {
    const plano = this.planoService.buscar(planoId);
    return this.progressoRepository.salvar(RegistroProgresso.criar(dados, plano));
  }

  historico(idosoId) {
    this.idosoService.buscar(idosoId);
    return this.progressoRepository.listarPorIdoso(idosoId);
  }

  /**
   * Resumo de aderência: sessões feitas nos últimos 7 dias em relação à meta semanal
   * (frequência do plano mais recente), mais esforço médio percebido.
   */
  resumo(idosoId) {
    const registros = this.historico(idosoId);
    const planoAtual = this.planoRepository.listarPorIdoso(idosoId)[0] ?? null;

    const limite = Date.now() - SETE_DIAS_MS;
    const ultimos7Dias = registros.filter((r) => Date.parse(r.data) >= limite).length;
    const metaSemanal = planoAtual?.frequencia ?? null;

    const esforcos = registros.map((r) => r.esforcoPercebido).filter((e) => e !== null);
    const esforcoMedio = esforcos.length
      ? Math.round((esforcos.reduce((a, b) => a + b, 0) / esforcos.length) * 10) / 10
      : null;

    return {
      idosoId,
      planoAtualId: planoAtual?.id ?? null,
      totalSessoesRealizadas: registros.length,
      sessoesUltimos7Dias: ultimos7Dias,
      metaSemanal,
      aderenciaSemanalPercentual: metaSemanal ? Math.min(100, Math.round((ultimos7Dias / metaSemanal) * 100)) : null,
      esforcoMedio,
      ultimaSessaoEm: registros[0]?.data ?? null,
    };
  }
}
