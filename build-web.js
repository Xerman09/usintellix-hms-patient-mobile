const esbuild = require('esbuild');
const path = require('path');

async function build() {
  console.log('Building React Native Web bundle...');
  await esbuild.build({
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
      '.jpg': 'dataurl',
      '.svg': 'text'
    },
    alias: {
      'react-native': 'react-native-web'
    },
    sourcemap: true
  });
  console.log('Build completed: dist/bundle.js');
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
