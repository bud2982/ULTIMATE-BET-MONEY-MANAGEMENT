import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 RENDER DEBUG INFORMATION');
console.log('============================');
console.log('Current directory:', __dirname);
console.log('Process cwd:', process.cwd());
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);

console.log('\n📁 Directory structure:');
try {
  const files = fs.readdirSync(__dirname);
  console.log('Root files:', files);
  
  if (files.includes('dist')) {
    console.log('\n📁 dist/ contents:');
    const distFiles = fs.readdirSync(path.join(__dirname, 'dist'));
    console.log('dist files:', distFiles);
    
    if (distFiles.includes('public')) {
      console.log('\n📁 dist/public/ contents:');
      const publicFiles = fs.readdirSync(path.join(__dirname, 'dist', 'public'));
      console.log('public files:', publicFiles);
      
      const indexPath = path.join(__dirname, 'dist', 'public', 'index.html');
      console.log('\n📄 index.html exists:', fs.existsSync(indexPath));
      
      if (fs.existsSync(indexPath)) {
        const stats = fs.statSync(indexPath);
        console.log('index.html size:', stats.size, 'bytes');
        console.log('index.html modified:', stats.mtime);
      }
    }
  }
} catch (error) {
  console.error('Error reading directories:', error.message);
}

console.log('\n🌐 Testing server paths...');
const distPath = path.join(__dirname, 'dist', 'public');
const indexPath = path.join(distPath, 'index.html');

console.log('Expected distPath:', distPath);
console.log('Expected indexPath:', indexPath);
console.log('distPath exists:', fs.existsSync(distPath));
console.log('indexPath exists:', fs.existsSync(indexPath));

console.log('\n✅ Debug complete');