// Demonstração para a apresentação: sobe a API em memória (pasta temporária) e
// percorre os requisitos funcionais, imprimindo cada chamada e o resultado.
//   npm run demo
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { criarApp } from '../src/app.js';

const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tedi-demo-'));
const servidor = criarApp({ dataDir }).listen(0);
await new Promise((resolve) => servidor.once('listening', resolve));
const base = `http://127.0.0.1:${servidor.address().port}`;

async function chamar(titulo, metodo, rota, corpo) {
  console.log(`\n=== ${titulo}\n${metodo} ${rota}`);
  const resposta = await fetch(base + rota, {
    method: metodo,
    headers: corpo ? { 'Content-Type': 'application/json' } : undefined,
    body: corpo ? JSON.stringify(corpo) : undefined,
  });
  const texto = await resposta.text();
  console.log(`-> ${resposta.status}`);
  let dados = texto;
  try {
    dados = JSON.parse(texto);
  } catch {
    /* resposta não-JSON (CSV) */
  }
  return dados;
}

try {
  const q = await chamar('RF03 — Questionário', 'GET', '/api/questionario');
  console.log(`${q.perguntas.length} perguntas:`, q.perguntas.map((p) => p.campo).join(', '));

  const { idoso, plano } = await chamar('RF07 — Responder questionário (cria perfil + plano)', 'POST', '/api/questionario/respostas', {
    nome: 'Dona Maria',
    faixaEtaria: '70-79',
    mobilidade: 'apoio',
    condicoes: ['hipertensao', 'articular'],
    objetivo: 'equilibrio',
    frequencia: 3,
    duracao: 'media',
  });
  console.log(`Idoso ${idoso.nome} (${idoso.id})`);
  console.log(`Plano ${plano.id}: ${plano.sessoes.length} sessões, ${plano.totalExercicios} exercícios`);
  console.log('Dia 1:');
  for (const e of plano.sessoes[0].exercicios) console.log(`  ${e.ordem}. [${e.categoria}] ${e.nome} — ${e.serie}`);
  console.log('Avisos:', plano.avisos);

  const lista = await chamar('RF04 — Exercícios de equilíbrio para quem usa apoio', 'GET', '/api/exercicios?categoria=equilibrio&mobilidade=apoio');
  console.log(lista.map((e) => e.nome));

  const csv = await chamar('RF09 — Exportar plano em CSV', 'GET', `/api/planos/${plano.id}/exportar?formato=csv`);
  console.log(csv.split('\r\n').slice(0, 4).join('\n'), '\n...');

  await chamar('RF10 — Registrar sessão realizada', 'POST', `/api/planos/${plano.id}/progresso`, {
    dia: 1,
    esforcoPercebido: 5,
    observacao: 'Fiz tudo com calma',
  });
  const resumo = await chamar('RF11 — Resumo de aderência', 'GET', `/api/idosos/${idoso.id}/progresso/resumo`);
  console.log(resumo);

  const erro = await chamar('Validação — perfil inválido', 'POST', '/api/idosos', { nome: 'A', faixaEtaria: '10-20' });
  console.log(erro);
} finally {
  await new Promise((resolve) => servidor.close(resolve));
  fs.rmSync(dataDir, { recursive: true, force: true });
}
