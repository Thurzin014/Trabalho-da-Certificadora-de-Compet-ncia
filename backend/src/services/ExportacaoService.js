const CABECALHO = ['Dia', 'Ordem', 'Exercício', 'Séries/Repetições', 'Como fazer', 'Cuidados'];

const escapar = (valor) => {
  const texto = String(valor ?? '');
  return /[;"\n\r]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
};

const slug = (texto) =>
  texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');

export class ExportacaoService {
  constructor({ planoService, idosoService }) {
    this.planoService = planoService;
    this.idosoService = idosoService;
  }

  /**
   * Gera a planilha em CSV (separador ";" e BOM UTF-8, para abrir direto no Excel
   * e no Google Planilhas em português).
   */
  exportarCsv(planoId) {
    const plano = this.planoService.buscar(planoId);
    const idoso = this.idosoService.buscar(plano.idosoId);

    const linhas = [CABECALHO];
    for (const sessao of plano.sessoes) {
      for (const e of sessao.exercicios) {
        linhas.push([sessao.dia, e.ordem, e.nome, e.serie, e.observacao, e.cuidados.join(' ')]);
      }
    }

    return {
      nomeArquivo: `plano_${slug(idoso.nome)}_tedi.csv`,
      conteudo: '﻿' + linhas.map((l) => l.map(escapar).join(';')).join('\r\n') + '\r\n',
    };
  }
}
