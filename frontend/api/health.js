// @ts-nocheck
module.exports = (req, res) => {
  res.status(200).json({
    status: 'ok',
    engine: 'self-contained-health',
    timestamp: new Date().toISOString()
  });
};
