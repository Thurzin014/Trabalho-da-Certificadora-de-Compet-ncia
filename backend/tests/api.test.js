import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { criarApp } from '../src/app.js';

let servidor;
let base;
let dataDir;

before(async () => {
  dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tedi-test-'));
  servidor = criarApp({ dataDir }).listen(0);
  await new Promise((resolve) => servidor.once('listening', resolve));
  base = `http://127.0.0.1:${servidor.address().port}`;
});

after(async () => {
  await new Promise((resolve) => servidor.close(resolve));
  fs.rmSync(dataDir, { recursive: true, force: true });
});

const chamar = async (metodo, rota, corpo) => {
  const resposta = await fetch(base + rota, {
    method: metodo,
    headers: corpo ? { 'Content-Type': 'application/json' } : undefined,
    body: corpo ? JSON.stringify(corpo) : undefined,
  });
  const tipo = resposta.headers.get('content-type') ?? '';
  const dados = tipo.includes('json') ? await resposta.json() : await resposta.text();
  return { status: resposta.status, dados, headers: resposta.headers };
};

const perfilValido = {
  nome: 'Dona Maria',
  faixaEtaria: '70-79',
  mobilidade: 'apoio',
  condicoes: ['hipertensao'],
  objetivo: 'equilibrio',
};

test('RF03: questionário lista as perguntas com opções', async () => {
  const { status, dados } = await chamar('GET', '/api/questionario');
  assert.equal(status, 200);
  assert.equal(dados.perguntas.length, 7);
  assert.deepEqual(dados.perguntas.map((p) => p.campo), [
    'nome', 'faixaEtaria', 'mobilidade', 'condicoes', 'objetivo', 'frequencia', 'duracao',
  ]);
});

test('RF01/RF02: CRUD de idoso', async () => {
  const criado = await chamar('POST', '/api/idosos', perfilValido);
  assert.equal(criado.status, 201);
  assert.ok(criado.dados.id);

  const id = criado.dados.id;
  assert.equal((await chamar('GET', `/api/idosos/${id}`)).dados.nome, 'Dona Maria');
  assert.ok((await chamar('GET', '/api/idosos')).dados.some((i) => i.id === id));

  const atualizado = await chamar('PUT', `/api/idosos/${id}`, { mobilidade: 'independente' });
  assert.equal(atualizado.status, 200);
  assert.equal(atualizado.dados.mobilidade, 'independente');
  assert.equal(atualizado.dados.nome, 'Dona Maria');

  assert.equal((await chamar('DELETE', `/api/idosos/${id}`)).status, 204);
  assert.equal((await chamar('GET', `/api/idosos/${id}`)).status, 404);
});

test('RF01: rejeita dados inválidos com detalhes', async () => {
  const { status, dados } = await chamar('POST', '/api/idosos', {
    nome: 'A',
    faixaEtaria: '10-20',
    mobilidade: 'voando',
    condicoes: ['nenhuma', 'diabetes'],
    objetivo: 'geral',
  });
  assert.equal(status, 400);
  assert.equal(dados.detalhes.length, 4);
});

test('JSON malformado retorna 400', async () => {
  const resposta = await fetch(`${base}/api/idosos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{quebrado',
  });
  assert.equal(resposta.status, 400);
});

test('RF04/RF05: lista, filtra e cadastra exercícios', async () => {
  const sentado = await chamar('GET', '/api/exercicios?categoria=equilibrio&mobilidade=sentado');
  assert.equal(sentado.status, 200);
  assert.ok(sentado.dados.length > 0);
  assert.ok(sentado.dados.every((e) => e.categoria === 'equilibrio' && e.mobilidades.includes('sentado')));

  assert.equal((await chamar('GET', '/api/exercicios?categoria=dancando')).status, 400);

  const novo = await chamar('POST', '/api/exercicios', {
    nome: 'Ponte com apoio',
    categoria: 'forca',
    mobilidades: ['apoio', 'independente'],
    serie: '2 séries de 8 repetições',
    observacao: 'Deitado, levante o quadril devagar.',
  });
  assert.equal(novo.status, 201);
  assert.equal((await chamar('GET', `/api/exercicios/${novo.dados.id}`)).dados.nome, 'Ponte com apoio');

  const invalido = await chamar('POST', '/api/exercicios', { nome: 'x' });
  assert.equal(invalido.status, 400);
});

test('RF06/RF08: gera e consulta plano personalizado', async () => {
  const { dados: idoso } = await chamar('POST', '/api/idosos', perfilValido);

  const plano = await chamar('POST', `/api/idosos/${idoso.id}/planos`, { frequencia: 3, duracao: 'media' });
  assert.equal(plano.status, 201);
  assert.equal(plano.dados.sessoes.length, 3);
  assert.equal(plano.dados.totalExercicios, 18);
  assert.ok(plano.dados.avisos.some((a) => /Pressão alta/.test(a)));

  assert.equal((await chamar('GET', `/api/planos/${plano.dados.id}`)).status, 200);
  const lista = await chamar('GET', `/api/idosos/${idoso.id}/planos`);
  assert.equal(lista.dados.length, 1);

  const ruim = await chamar('POST', `/api/idosos/${idoso.id}/planos`, { frequencia: 9, duracao: 'infinita' });
  assert.equal(ruim.status, 400);
  assert.equal((await chamar('POST', '/api/idosos/inexistente/planos', { frequencia: 2, duracao: 'curta' })).status, 404);
});

test('RF07: responder o questionário cria perfil e plano de uma vez', async () => {
  const { status, dados } = await chamar('POST', '/api/questionario/respostas', {
    ...perfilValido,
    nome: 'Seu João',
    frequencia: 2,
    duracao: 'curta',
  });
  assert.equal(status, 201);
  assert.equal(dados.idoso.nome, 'Seu João');
  assert.equal(dados.plano.idosoId, dados.idoso.id);
  assert.equal(dados.plano.sessoes.length, 2);

  const antes = (await chamar('GET', '/api/idosos')).dados.length;
  const invalido = await chamar('POST', '/api/questionario/respostas', { ...perfilValido, frequencia: 2 });
  assert.equal(invalido.status, 400);
  assert.equal((await chamar('GET', '/api/idosos')).dados.length, antes, 'não deve gravar perfil órfão');
});

test('RF07: questionário aceita nome vazio (campo opcional)', async () => {
  const { status, dados } = await chamar('POST', '/api/questionario/respostas', {
    ...perfilValido,
    nome: '   ',
    frequencia: 2,
    duracao: 'curta',
  });
  assert.equal(status, 201);
  assert.equal(dados.idoso.nome, 'Sem identificação');
  assert.equal(dados.plano.sessoes.length, 2);
});

test('RF07: corpo ausente retorna 400 em vez de erro interno', async () => {
  const resposta = await fetch(`${base}/api/questionario/respostas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: 'null',
  });
  assert.equal(resposta.status, 400);
});

test('RF09: exporta o plano em CSV', async () => {
  const { dados } = await chamar('POST', '/api/questionario/respostas', {
    ...perfilValido,
    nome: 'Maria da Conceição',
    frequencia: 2,
    duracao: 'curta',
  });
  const csv = await chamar('GET', `/api/planos/${dados.plano.id}/exportar?formato=csv`);
  assert.equal(csv.status, 200);
  assert.match(csv.headers.get('content-type'), /text\/csv/);
  assert.match(csv.headers.get('content-disposition'), /plano_maria_da_conceicao_tedi\.csv/);

  const linhas = csv.dados.replace('﻿', '').trim().split('\r\n');
  assert.equal(linhas[0], 'Dia;Ordem;Exercício;Séries/Repetições;Como fazer;Cuidados');
  assert.equal(linhas.length, 1 + 2 * 4);

  assert.equal((await chamar('GET', `/api/planos/${dados.plano.id}/exportar?formato=pdf`)).status, 400);
});

test('RF10/RF11: registra sessões e calcula o resumo de aderência', async () => {
  const { dados } = await chamar('POST', '/api/questionario/respostas', {
    ...perfilValido,
    nome: 'Dona Lurdes',
    frequencia: 2,
    duracao: 'curta',
  });
  const { idoso, plano } = dados;

  const primeiro = await chamar('POST', `/api/planos/${plano.id}/progresso`, {
    dia: 1,
    esforcoPercebido: 4,
    observacao: 'Me senti bem',
  });
  assert.equal(primeiro.status, 201);
  assert.equal(primeiro.dados.idosoId, idoso.id);
  await chamar('POST', `/api/planos/${plano.id}/progresso`, { dia: 2, esforcoPercebido: 6 });

  assert.equal((await chamar('POST', `/api/planos/${plano.id}/progresso`, { dia: 3 })).status, 400);
  assert.equal((await chamar('POST', `/api/planos/${plano.id}/progresso`, { dia: 1, esforcoPercebido: 11 })).status, 400);
  const futuro = new Date(Date.now() + 86_400_000).toISOString();
  assert.equal((await chamar('POST', `/api/planos/${plano.id}/progresso`, { dia: 1, data: futuro })).status, 400);

  const historico = await chamar('GET', `/api/idosos/${idoso.id}/progresso`);
  assert.equal(historico.dados.length, 2);

  const { dados: resumo } = await chamar('GET', `/api/idosos/${idoso.id}/progresso/resumo`);
  assert.equal(resumo.totalSessoesRealizadas, 2);
  assert.equal(resumo.sessoesUltimos7Dias, 2);
  assert.equal(resumo.metaSemanal, 2);
  assert.equal(resumo.aderenciaSemanalPercentual, 100);
  assert.equal(resumo.esforcoMedio, 5);
});

test('remover o idoso apaga planos e progresso em cascata', async () => {
  const { dados } = await chamar('POST', '/api/questionario/respostas', {
    ...perfilValido,
    nome: 'Seu Antônio',
    frequencia: 2,
    duracao: 'curta',
  });
  await chamar('POST', `/api/planos/${dados.plano.id}/progresso`, { dia: 1 });

  assert.equal((await chamar('DELETE', `/api/idosos/${dados.idoso.id}`)).status, 204);
  assert.equal((await chamar('GET', `/api/planos/${dados.plano.id}`)).status, 404);
  assert.equal((await chamar('GET', `/api/idosos/${dados.idoso.id}/progresso`)).status, 404);
});

test('os dados persistem em disco e sobrevivem a uma reinicialização', async () => {
  const { dados } = await chamar('POST', '/api/idosos', { ...perfilValido, nome: 'Persistente' });
  const outroServidor = criarApp({ dataDir }).listen(0);
  await new Promise((resolve) => outroServidor.once('listening', resolve));
  try {
    const resposta = await fetch(`http://127.0.0.1:${outroServidor.address().port}/api/idosos/${dados.id}`);
    assert.equal(resposta.status, 200);
    assert.equal((await resposta.json()).nome, 'Persistente');
  } finally {
    await new Promise((resolve) => outroServidor.close(resolve));
  }
});

test('rota inexistente retorna 404 em JSON', async () => {
  const { status, dados } = await chamar('GET', '/api/nada');
  assert.equal(status, 404);
  assert.ok(dados.erro);
});
