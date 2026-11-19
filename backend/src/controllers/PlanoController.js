import { ValidacaoError } from '../errors/AppError.js';

export class PlanoController {
  constructor(planoService, exportacaoService) {
    this.planoService = planoService;
    this.exportacaoService = exportacaoService;
  }

  gerar = (req, res) => res.status(201).json(this.planoService.gerar(req.params.id, req.body));

  listarPorIdoso = (req, res) => res.json(this.planoService.listarPorIdoso(req.params.id));

  buscar = (req, res) => res.json(this.planoService.buscar(req.params.id));

  exportar = (req, res) => {
    const formato = req.query.formato ?? 'csv';
    if (formato !== 'csv') throw new ValidacaoError(['formato: apenas "csv" é suportado']);

    const { nomeArquivo, conteudo } = this.exportacaoService.exportarCsv(req.params.id);
    res
      .type('text/csv; charset=utf-8')
      .set('Content-Disposition', `attachment; filename="${nomeArquivo}"`)
      .send(conteudo);
  };
}
