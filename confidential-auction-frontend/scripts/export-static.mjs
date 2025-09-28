import fs from 'fs';
import path from 'path';

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) {
    console.error(`Source directory ${src} does not exist`);
    return;
  }

  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function exportStatic() {
  console.log('📦 Exporting static files...');

  // Ensure out directory exists
  const outDir = './out';
  if (fs.existsSync(outDir)) {
    fs.rmSync(outDir, { recursive: true, force: true });
  }
  fs.mkdirSync(outDir, { recursive: true });

  // Copy static files from .next/server/app
  const serverAppDir = '.next/server/app';
  if (fs.existsSync(serverAppDir)) {
    copyRecursive(serverAppDir, outDir);
    console.log('✅ Copied app files');
  }

  // Copy static assets
  const staticDir = '.next/static';
  if (fs.existsSync(staticDir)) {
    copyRecursive(staticDir, path.join(outDir, '_next/static'));
    console.log('✅ Copied static assets');
  }

  // Copy public files
  const publicDir = './public';
  if (fs.existsSync(publicDir)) {
    copyRecursive(publicDir, outDir);
    console.log('✅ Copied public files');
  }

  // Create a simple index.html if it doesn't exist
  const indexPath = path.join(outDir, 'index.html');
  if (!fs.existsSync(indexPath)) {
    // Copy from server app directory
    const serverIndexPath = path.join(serverAppDir, 'index.html');
    if (fs.existsSync(serverIndexPath)) {
      fs.copyFileSync(serverIndexPath, indexPath);
      console.log('✅ Created index.html');
    }
  }

  console.log('🎉 Static export completed!');
  console.log('📁 Static files available in: ./out/');
  console.log('🚀 To serve locally: npx serve out');
}

exportStatic();
