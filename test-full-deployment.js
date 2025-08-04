import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧪 FULL DEPLOYMENT TEST');
console.log('========================');

// Test 1: Check if all required files exist
console.log('\n1️⃣ Testing file structure...');
const requiredFiles = [
  'dist/public/index.html',
  'dist/public/assets',
  'server.render.js',
  'package.json',
  'render.yaml'
];

let allFilesExist = true;
for (const file of requiredFiles) {
  const filePath = path.join(__dirname, file);
  const exists = fs.existsSync(filePath);
  console.log(`   ${exists ? '✅' : '❌'} ${file}`);
  if (!exists) allFilesExist = false;
}

// Test 2: Check index.html content
console.log('\n2️⃣ Testing index.html content...');
const indexPath = path.join(__dirname, 'dist/public/index.html');
if (fs.existsSync(indexPath)) {
  const indexContent = fs.readFileSync(indexPath, 'utf8');
  
  // Check for absolute paths in assets
  const hasAbsolutePaths = indexContent.includes('src="/assets/') && indexContent.includes('href="/assets/');
  console.log(`   ${hasAbsolutePaths ? '✅' : '❌'} Assets use absolute paths`);
  
  // Check for required elements
  const hasRootDiv = indexContent.includes('<div id="root">');
  console.log(`   ${hasRootDiv ? '✅' : '❌'} Root div present`);
  
  // Check for loading fallback
  const hasLoadingFallback = indexContent.includes('Loading Money Management Pro');
  console.log(`   ${hasLoadingFallback ? '✅' : '❌'} Loading fallback present`);
} else {
  console.log('   ❌ index.html not found');
}

// Test 3: Check assets directory
console.log('\n3️⃣ Testing assets directory...');
const assetsPath = path.join(__dirname, 'dist/public/assets');
if (fs.existsSync(assetsPath)) {
  const assets = fs.readdirSync(assetsPath);
  const hasJS = assets.some(file => file.endsWith('.js'));
  const hasCSS = assets.some(file => file.endsWith('.css'));
  
  console.log(`   ✅ Assets directory exists (${assets.length} files)`);
  console.log(`   ${hasJS ? '✅' : '❌'} JavaScript bundle present`);
  console.log(`   ${hasCSS ? '✅' : '❌'} CSS bundle present`);
  
  // List asset files
  console.log('   📁 Asset files:');
  assets.forEach(file => {
    const filePath = path.join(assetsPath, file);
    const stats = fs.statSync(filePath);
    const sizeKB = Math.round(stats.size / 1024);
    console.log(`      - ${file} (${sizeKB} KB)`);
  });
} else {
  console.log('   ❌ Assets directory not found');
}

// Test 4: Check server.render.js
console.log('\n4️⃣ Testing server configuration...');
const serverPath = path.join(__dirname, 'server.render.js');
if (fs.existsSync(serverPath)) {
  const serverContent = fs.readFileSync(serverPath, 'utf8');
  
  // Check for health endpoint
  const hasHealthCheck = serverContent.includes("app.get('/health'");
  console.log(`   ${hasHealthCheck ? '✅' : '❌'} Health check endpoint present`);
  
  // Check for static file serving
  const hasStaticServing = serverContent.includes('express.static');
  console.log(`   ${hasStaticServing ? '✅' : '❌'} Static file serving configured`);
  
  // Check for SPA fallback
  const hasSPAFallback = serverContent.includes("app.get('*'");
  console.log(`   ${hasSPAFallback ? '✅' : '❌'} SPA fallback configured`);
} else {
  console.log('   ❌ server.render.js not found');
}

// Test 5: Check render.yaml
console.log('\n5️⃣ Testing render.yaml configuration...');
const renderYamlPath = path.join(__dirname, 'render.yaml');
if (fs.existsSync(renderYamlPath)) {
  const renderContent = fs.readFileSync(renderYamlPath, 'utf8');
  
  // Check for required fields
  const hasBuildCommand = renderContent.includes('buildCommand:');
  const hasStartCommand = renderContent.includes('startCommand:');
  const hasHealthCheck = renderContent.includes('healthCheckPath:');
  const hasNodeEnv = renderContent.includes('NODE_ENV');
  
  console.log(`   ${hasBuildCommand ? '✅' : '❌'} Build command present`);
  console.log(`   ${hasStartCommand ? '✅' : '❌'} Start command present`);
  console.log(`   ${hasHealthCheck ? '✅' : '❌'} Health check path present`);
  console.log(`   ${hasNodeEnv ? '✅' : '❌'} NODE_ENV configured`);
  
  // Check for simplified build command
  const hasSimpleBuild = renderContent.includes('npm ci --include=dev --legacy-peer-deps && npm run build');
  console.log(`   ${hasSimpleBuild ? '✅' : '❌'} Simplified build command`);
} else {
  console.log('   ❌ render.yaml not found');
}

// Test 6: Check package.json
console.log('\n6️⃣ Testing package.json...');
const packagePath = path.join(__dirname, 'package.json');
if (fs.existsSync(packagePath)) {
  const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  // Check for required scripts
  const hasBuildScript = packageContent.scripts && packageContent.scripts.build;
  console.log(`   ${hasBuildScript ? '✅' : '❌'} Build script present`);
  
  // Check for type: module
  const isESModule = packageContent.type === 'module';
  console.log(`   ${isESModule ? '✅' : '❌'} ES Module configuration`);
  
  // Check for required dependencies
  const requiredDeps = ['express', 'react', 'vite'];
  const hasAllDeps = requiredDeps.every(dep => 
    packageContent.dependencies && packageContent.dependencies[dep]
  );
  console.log(`   ${hasAllDeps ? '✅' : '❌'} Required dependencies present`);
} else {
  console.log('   ❌ package.json not found');
}

// Test 7: Check vite.config.ts
console.log('\n7️⃣ Testing vite configuration...');
const viteConfigPath = path.join(__dirname, 'vite.config.ts');
if (fs.existsSync(viteConfigPath)) {
  const viteContent = fs.readFileSync(viteConfigPath, 'utf8');
  
  // Check for absolute base path
  const hasAbsoluteBase = viteContent.includes('base: "/"');
  console.log(`   ${hasAbsoluteBase ? '✅' : '❌'} Absolute base path configured`);
  
  // Check for correct output directory
  const hasCorrectOutDir = viteContent.includes('outDir: path.resolve(__dirname, "dist/public")');
  console.log(`   ${hasCorrectOutDir ? '✅' : '❌'} Correct output directory`);
} else {
  console.log('   ❌ vite.config.ts not found');
}

console.log('\n🏁 DEPLOYMENT TEST COMPLETE');
console.log('============================');

if (allFilesExist) {
  console.log('✅ All required files are present');
  console.log('🚀 Ready for deployment to Render');
  console.log('\nNext steps:');
  console.log('1. Commit all changes');
  console.log('2. Push to repository');
  console.log('3. Deploy on Render');
  console.log('4. Check https://your-app.onrender.com/health');
} else {
  console.log('❌ Some required files are missing');
  console.log('🔧 Please fix the issues above before deploying');
}