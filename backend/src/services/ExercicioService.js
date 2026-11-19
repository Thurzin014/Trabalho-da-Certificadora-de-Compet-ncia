import { Exercicio } from '../models/Exercicio.js';
import { NaoEncontradoError, ValidacaoError } from '../errors/AppError.js';
import { CATEGORIAS, MOBILIDADES } from '../models/enums.js';

export class ExercicioService {
  constructor({ exercicioRepository }) {
    this.exercicioRepository = exercicioRepository;
  }

  /** Filtros opcionais: categoria, mobilidade e busca (trecho do nome). */
  listar({ categoria, mobilidade, busca } = {}) {
    const erros = [];
    if (categoria && !CATEGORIAS.includes(categoria)) {
      erros.push(`categoria: use uma de ${CATEGORIAS.join(', ')}`);
    }
    if (mobilidade && !MOBILIDADES.includes(mobilidade)) {
      erros.push(`mobilidade: use uma de ${MOBILIDADES.join(', ')}`);
    }
    if (erros.length > 0) throw new ValidacaoError(erros);

    const termo = busca?.trim().toLowerCase();
    return this.exercicioRepository.listar(
      (e) =>
        (!categoria || e.categoria === categoria) &&
        (!mobilidade || e.permiteMobilidade(mobilidade)) &&
        (!termo || e.nome.toLowerCase().includes(termo)),
    );
  }

  buscar(id) {
    const exercicio = this.exercicioRepository.buscarPorId(id);
    if (!exercicio) throw new NaoEncontradoError('Exercício');
    return exercicio;
  }

  cadastrar(dados) {
    return this.exercicioRepository.salvar(Exercicio.criar(dados));
  }
}
