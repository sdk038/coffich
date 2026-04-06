const { createProxyMiddleware } = require('http-proxy-middleware');

/** В dev проксируем API и медиа на Django — браузер ходит на :3000, CORS не нужен. */
module.exports = function setupProxy(app) {
  const target = process.env.REACT_APP_PROXY_TARGET || 'http://127.0.0.1:8000';
  app.use(
    ['/api', '/media'],
    createProxyMiddleware({
      target,
      changeOrigin: true,
    })
  );
};
