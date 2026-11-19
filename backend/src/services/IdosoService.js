import { Idoso } from '../models/Idoso.js';
import { NaoEncontradoError } from '../errors/AppError.js';

export class IdosoService {
  constructor({ idosoRepository, planoRepository, progressoRepository }) {
    this.idosoRepository = idosoRepository;
    this.planoRepository = planoRepository;
    this.progressoRepository = progressoRepository;
  }

  cadastrar(dados) {
    return this.idosoRepository.salvar(Idoso.criar(dados));
  }

  listar() {
    return this.idosoRepository.listar();
  }

  buscar(id) {
    const idoso = this.idosoRepository.buscarPorId(id);
    if (!idoso) throw new NaoEncontradoError('Idoso');
    return idoso;
  }

  atualizar(id, dados) {
    const idoso = this.buscar(id);
    idoso.atualizar(dados);
    return this.idosoRepository.salvar(idoso);
  }

  /** Remove o idoso e, em cascata, seus planos e registros de progresso. */
  remover(id) {
    this.buscar(id);
    this.planoRepository.removerVarios((p) => p.idosoId === id);
    this.progressoRepository.removerVarios((r) => r.idosoId === id);
    this.idosoRepository.remover(id);
  }
}
