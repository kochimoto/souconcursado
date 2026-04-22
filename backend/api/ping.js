module.exports = (req, res) => {
  res.status(200).json({
    status: 'infra_ok',
    timestamp: new Date().toISOString(),
    engine: 'Native Node.js (CommonJS)',
    message: 'Se você está vendo isso, o roteamento Monorepo está FUNCIONANDO.'
  });
};
