const esbuild = require('esbuild');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 7001;
const DIST_DIR = path.resolve(__dirname, 'dist');
if (!fs.existsSync(DIST_DIR)) {
  fs.mkdirSync(DIST_DIR, { recursive: true });
}

async function startServer() {
  // Create an esbuild context for watching & compiling React Native Web instantly
  const ctx = await esbuild.context({
    entryPoints: ['index.web.js'],
    bundle: true,
    outfile: 'dist/bundle.web.js',
    define: {
      'process.env.NODE_ENV': '"development"',
      '__DEV__': 'true'
    },
    loader: {
      '.js': 'jsx',
      '.png': 'dataurl',
      '.jpg': 'dataurl'
    },
    alias: {
      'react-native': 'react-native-web'
    },
    sourcemap: true
  });

  // Compile initial bundle
  await ctx.rebuild();
  console.log('React Native Web bundle built successfully.');

  // Watch for any changes in App.js or screens
  await ctx.watch();
  console.log('Watching for file changes...');

  // Lightweight HTTP dev server (No Webpack socket bugs, no `require is not defined`)
  const server = http.createServer((req, res) => {
    let filePath = req.url.split('?')[0];
    
    if (filePath === '/' || filePath === '/index.html') {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <meta name="theme-color" content="#2563eb">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="default">
  <meta name="apple-mobile-web-app-title" content="USIntellix">
  <link rel="manifest" href="/manifest.json">
  <link rel="apple-touch-icon" href="/assets/logo.png">
  <link rel="icon" type="image/png" href="/assets/logo.png">
  <title>USIntellix Patient Mobile App (React Native)</title>
  <style>
    html, body {
      height: 100%;
      width: 100%;
      margin: 0;
      padding: 0;
      background-color: #f1f5f9;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      overflow-x: hidden;
      display: flex;
    }
    #root {
      display: flex;
      flex-direction: column;
      flex: 1;
      width: 100%;
      height: 100%;
      max-width: 440px;
      margin: 0 auto;
      box-shadow: 0 10px 40px rgba(0,0,0,0.08);
      position: relative;
      background-color: #ffffff;
    }
    @media (min-width: 480px) {
      body {
        align-items: center;
        justify-content: center;
        padding: 20px 0;
        background: #e2e8f0;
      }
      #root {
        height: 90vh;
        max-height: 860px;
        border-radius: 24px;
        overflow: hidden;
        border: 1px solid #cbd5e1;
      }
    }
    /* Web Input reset so React Native Web inputs don't get browser black borders or outline rings */
    input, textarea, select, button {
      outline: none !important;
      border: none;
      background: transparent;
      box-shadow: none;
      font-family: inherit;
      -webkit-appearance: none;
      -moz-appearance: none;
      appearance: none;
    }
    input:focus, textarea:focus {
      outline: none !important;
      box-shadow: none !important;
    }
  </style>
</head>
<body>
  <div id="root"></div>
  <script src="/dist/bundle.web.js"></script>
</body>
</html>`);
      return;
    }

    if (filePath === '/dist/bundle.web.js' || filePath === '/bundle.web.js') {
      const bundlePath = path.resolve(DIST_DIR, 'bundle.web.js');
      if (fs.existsSync(bundlePath)) {
        res.writeHead(200, { 'Content-Type': 'application/javascript' });
        res.end(fs.readFileSync(bundlePath));
        return;
      }
    }

    if (filePath === '/manifest.json') {
      const manifestPath = path.resolve(__dirname, 'manifest.json');
      if (fs.existsSync(manifestPath)) {
        res.writeHead(200, { 'Content-Type': 'application/manifest+json' });
        res.end(fs.readFileSync(manifestPath));
        return;
      }
    }

    if (filePath === '/assets/logo.png' || filePath === '/logo.png') {
      const logoPath = path.resolve(__dirname, 'assets', 'logo.png');
      if (fs.existsSync(logoPath)) {
        res.writeHead(200, { 'Content-Type': 'image/png' });
        res.end(fs.readFileSync(logoPath));
        return;
      }
    }

    res.writeHead(404);
    res.end('Not Found');
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n======================================================`);
    console.log(`🚀 React Native Mobile App Running in Web Mode!`);
    console.log(`👉 Local: http://localhost:${PORT}/`);
    console.log(`👉 On Phone (same Wi-Fi): http://192.168.0.72:${PORT}/`);
    console.log(`======================================================\n`);
  });
}

startServer().catch(err => {
  console.error(err);
  process.exit(1);
});
