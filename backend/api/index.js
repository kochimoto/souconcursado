/**
 * Ponto de entrada nativo JS para a Vercel.
 * Bypass do compilador de TypeScript para estabilidade máxima.
 */
const app = require('../src/index');

module.exports = (req, res) => {
  return app(req, res);
};
