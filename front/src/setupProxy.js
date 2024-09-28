const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
    app.use(
        '/sdapi',
        createProxyMiddleware({
            target: 'http://221.148.97.237:7860',
            changeOrigin: true,
        })
    );

    app.use(
        '/chat',
        createProxyMiddleware({
            target: 'http://221.148.97.238:8000',
            changeOrigin: true,
        })
    );

    app.use(
        '/uploadfile',
        createProxyMiddleware({
            target: 'http://221.148.97.237:8001',
            changeOrigin: true,
        })
    );

    app.use(
        '/generate',
        createProxyMiddleware({
            target: 'http://221.148.97.237:8000',
            changeOrigin: true,
        })
    );
};