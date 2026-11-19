export class QuestionarioController {
  constructor(questionarioService) {
    this.questionarioService = questionarioService;
  }

  obter = (req, res) => res.json(this.questionarioService.obter());

  responder = (req, res) => res.status(201).json(this.questionarioService.responder(req.body));
}
