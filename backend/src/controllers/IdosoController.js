export class IdosoController {
  constructor(idosoService) {
    this.idosoService = idosoService;
  }

  cadastrar = (req, res) => res.status(201).json(this.idosoService.cadastrar(req.body));

  listar = (req, res) => res.json(this.idosoService.listar());

  buscar = (req, res) => res.json(this.idosoService.buscar(req.params.id));

  atualizar = (req, res) => res.json(this.idosoService.atualizar(req.params.id, req.body));

  remover = (req, res) => {
    this.idosoService.remover(req.params.id);
    res.status(204).end();
  };
}
