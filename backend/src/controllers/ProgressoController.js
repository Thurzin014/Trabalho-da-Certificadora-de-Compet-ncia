export class ProgressoController {
  constructor(progressoService) {
    this.progressoService = progressoService;
  }

  registrar = (req, res) => res.status(201).json(this.progressoService.registrar(req.params.id, req.body));

  historico = (req, res) => res.json(this.progressoService.historico(req.params.id));

  resumo = (req, res) => res.json(this.progressoService.resumo(req.params.id));
}
