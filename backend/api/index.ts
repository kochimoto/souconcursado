const app = require('../src/index');

/**
 * Ponto de entrada nativo para a Vercel (CommonJS).
 * Vercel detecta e executa nativamente sem necessidade de transpilação ESM complexa.
 */
module.exports = app;
