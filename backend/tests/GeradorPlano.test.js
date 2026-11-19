import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { GeradorPlano } from '../src/services/GeradorPlano.js';
import { Exercicio } from '../src/models/Exercicio.js';
import { Idoso } from '../src/models/Idoso.js';
import { config } from '../src/config.js';

const catalogo = JSON.parse(fs.readFileSync(config.seedExercicios, 'utf-8')).map((e) => new Exercicio(e));
const gerador = new GeradorPlano(catalogo);
const porId = new Map(catalogo.map((e) => [e.id, e]));

const perfil = (extra = {}) =>
  Idoso.criar({
    nome: 'Maria',
    faixaEtaria: '60-69',
    mobilidade: 'independente',
    condicoes: ['nenhuma'],
    objetivo: 'geral',
    ...extra,
  });

test('gera uma sessão por dia de frequência', () => {
  const { sessoes } = gerador.gerar(perfil(), { frequencia: 3, duracao: 'media' });
  assert.equal(sessoes.length, 3);
  assert.deepEqual(sessoes.map((s) => s.dia), [1, 2, 3]);
});

test('quantidade de exercícios por duração', () => {
  for (const [duracao, esperado] of [['curta', 4], ['media', 6], ['longa', 8]]) {
    const { sessoes } = gerador.gerar(perfil(), { frequencia: 2, duracao });
    for (const s of sessoes) assert.equal(s.exercicios.length, esperado, `${duracao}`);
  }
});

test('faixa 80+ reduz um exercício por sessão, com mínimo de 4', () => {
  const idoso = perfil({ faixaEtaria: '80+' });
  assert.equal(gerador.gerar(idoso, { frequencia: 1, duracao: 'longa' }).sessoes[0].exercicios.length, 7);
  assert.equal(gerador.gerar(idoso, { frequencia: 1, duracao: 'media' }).sessoes[0].exercicios.length, 5);
  assert.equal(gerador.gerar(idoso, { frequencia: 1, duracao: 'curta' }).sessoes[0].exercicios.length, 4);
});

test('respeita a mobilidade: quem faz tudo sentado só recebe exercícios sentados', () => {
  for (const objetivo of ['equilibrio', 'forca', 'flexibilidade', 'geral']) {
    const idoso = perfil({ mobilidade: 'sentado', objetivo });
    const { sessoes } = gerador.gerar(idoso, { frequencia: 5, duracao: 'longa' });
    for (const s of sessoes) {
      for (const item of s.exercicios) {
        assert.ok(porId.get(item.exercicioId).permiteMobilidade('sentado'), `${item.nome} (${objetivo})`);
      }
    }
  }
});

test('não repete exercícios dentro de uma mesma sessão', () => {
  const { sessoes } = gerador.gerar(perfil(), { frequencia: 5, duracao: 'longa' });
  for (const s of sessoes) {
    const ids = s.exercicios.map((e) => e.exercicioId);
    assert.equal(new Set(ids).size, ids.length);
  }
});

test('sessão começa com respiração e termina com relaxamento nas sessões longas', () => {
  const { sessoes } = gerador.gerar(perfil(), { frequencia: 3, duracao: 'longa' });
  for (const s of sessoes) {
    assert.equal(s.exercicios.at(0).categoria, 'respiracao');
    assert.equal(s.exercicios.at(-1).exercicioId, 'relaxamento-final');
  }
});

test('o objetivo define o foco da sessão', () => {
  for (const mobilidade of ['sentado', 'independente']) {
    const idoso = perfil({ mobilidade, objetivo: 'equilibrio' });
    const { sessoes } = gerador.gerar(idoso, { frequencia: 3, duracao: 'media' });
    for (const s of sessoes) {
      const equilibrio = s.exercicios.filter((e) => e.categoria === 'equilibrio').length;
      assert.ok(equilibrio >= 2, `${mobilidade}: ${equilibrio} exercícios de equilíbrio`);
    }
  }
});

test('os dias do plano variam entre si', () => {
  const { sessoes } = gerador.gerar(perfil({ objetivo: 'forca' }), { frequencia: 2, duracao: 'media' });
  const [a, b] = sessoes.map((s) => s.exercicios.map((e) => e.exercicioId).join(','));
  assert.notEqual(a, b);
});

test('cuidados do exercício aparecem apenas para as condições do idoso', () => {
  const caminhada = porId.get('caminhada-leve');
  assert.deepEqual(caminhada.cuidadosPara(['nenhuma']), []);
  assert.equal(caminhada.cuidadosPara(['diabetes']).length, 1);
  assert.equal(caminhada.cuidadosPara(['diabetes', 'hipertensao']).length, 2);
});

test('avisos incluem condições, faixa 80+ e o aviso geral', () => {
  const avisos = GeradorPlano.avisos(perfil({ faixaEtaria: '80+', condicoes: ['hipertensao', 'diabetes'] }));
  assert.equal(avisos.length, 4);
  assert.match(avisos[0], /Pressão alta/);
  assert.match(avisos.at(-1), /não substitui/);
});
