/**
 * Health check nativo JS.
 */
module.exports = (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    mode: 'native-js'
  });
};
