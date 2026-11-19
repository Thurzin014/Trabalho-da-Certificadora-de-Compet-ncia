import { criarApp } from './src/app.js';
import { config } from './src/config.js';

const app = criarApp();

app.listen(config.porta, () => {
  console.log(`TEDI backend rodando em http://localhost:${config.porta}`);
  console.log(`Dados em: ${config.dataDir}`);
});
