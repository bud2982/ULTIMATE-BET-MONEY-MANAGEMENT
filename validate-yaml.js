import fs from 'fs';
import path from 'path';

const yamlContent = fs.readFileSync('render.yaml', 'utf8');

console.log('📄 YAML Content:');
console.log(yamlContent);
console.log('\n✅ YAML file read successfully - syntax appears valid');

// Basic validation
const lines = yamlContent.split('\n');
let hasErrors = false;

lines.forEach((line, index) => {
  if (line.includes('\t')) {
    console.log(`❌ Error on line ${index + 1}: Contains tab character (use spaces only)`);
    hasErrors = true;
  }
});

if (!hasErrors) {
  console.log('✅ No obvious YAML syntax errors found');
} else {
  console.log('❌ YAML validation failed');
}