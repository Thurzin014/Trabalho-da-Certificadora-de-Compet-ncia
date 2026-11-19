import fs from 'node:fs';
import path from 'node:path';

/**
 * Repositório genérico que persiste uma coleção de entidades em um arquivo JSON.
 * Mantém tudo em memória e grava no disco a cada alteração (escrita atômica via
 * arquivo temporário). Trocar por um banco de dados exige apenas reimplementar
 * esta classe, pois os serviços só conhecem a interface pública.
 */
export class JsonRepository {
  #arquivo;
  #Modelo;
  #itens;

  constructor(arquivo, Modelo) {
    this.#arquivo = arquivo;
    this.#Modelo = Modelo;
    this.#itens = this.#carregar();
  }

  #carregar() {
    if (!fs.existsSync(this.#arquivo)) return [];
    const conteudo = fs.readFileSync(this.#arquivo, 'utf-8').trim();
    if (conteudo === '') return [];
    return JSON.parse(conteudo).map((registro) => new this.#Modelo(registro));
  }

  #persistir() {
    fs.mkdirSync(path.dirname(this.#arquivo), { recursive: true });
    const temporario = `${this.#arquivo}.tmp`;
    fs.writeFileSync(temporario, JSON.stringify(this.#itens, null, 2));
    fs.renameSync(temporario, this.#arquivo);
  }

  listar(filtro = () => true) {
    return this.#itens.filter(filtro);
  }

  buscarPorId(id) {
    return this.#itens.find((item) => item.id === id) ?? null;
  }

  salvar(entidade) {
    const indice = this.#itens.findIndex((item) => item.id === entidade.id);
    if (indice === -1) this.#itens.push(entidade);
    else this.#itens[indice] = entidade;
    this.#persistir();
    return entidade;
  }

  remover(id) {
    const tamanho = this.#itens.length;
    this.#itens = this.#itens.filter((item) => item.id !== id);
    const removeu = this.#itens.length < tamanho;
    if (removeu) this.#persistir();
    return removeu;
  }

  removerVarios(filtro) {
    const tamanho = this.#itens.length;
    this.#itens = this.#itens.filter((item) => !filtro(item));
    const removidos = tamanho - this.#itens.length;
    if (removidos > 0) this.#persistir();
    return removidos;
  }
}
