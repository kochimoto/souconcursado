/**
 * DIAGNÓSTICO MASTER (Root)
 */
module.exports = (req, res) => {
  try {
    const backendHealth = require('../backend/api/health');
    return backendHealth(req, res);
  } catch (e) {
    res.status(200).json({
      status: 'root_proxy_ok',
      backend_bridge: 'failed',
      error: e.message
    });
  }
};
