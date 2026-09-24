import path from 'path';
import express from 'express';
import app, { db } from './api/index';

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// Local Dev & Production server (Non-Vercel)
if (!process.env.VERCEL) {
  import('vite').then(async ({ createServer: createViteServer }) => {
    if (process.env.NODE_ENV !== 'production') {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa'
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), 'dist');
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`\n======================================================`);
      console.log(`🚀 Congregazioni in esecuzione!`);
      console.log(`📱 Locale:       http://localhost:${PORT}`);
      console.log(`🌐 Rete / WiFi:  http://0.0.0.0:${PORT}`);
      console.log(`⚡ Database:     ${db.getStatus().provider}`);
      console.log(`======================================================\n`);
    });
  });
}

export default app;
