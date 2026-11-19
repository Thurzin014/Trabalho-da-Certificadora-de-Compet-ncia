export class ExercicioController {
  constructor(exercicioService) {
    this.exercicioService = exercicioService;
  }

  listar = (req, res) => res.json(this.exercicioService.listar(req.query));

  buscar = (req, res) => res.json(this.exercicioService.buscar(req.params.id));

  cadastrar = (req, res) => res.status(201).json(this.exercicioService.cadastrar(req.body));
}
