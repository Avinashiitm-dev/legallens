const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? 
      walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

const filesToProcess = [];
walkDir('./src', (filePath) => {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.css')) {
    filesToProcess.push(filePath);
  }
});

filesToProcess.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // General emerald colors replacement
  content = content.replace(/emerald-400/g, 'white');
  content = content.replace(/emerald-500/g, 'zinc-300');
  content = content.replace(/emerald-600/g, 'zinc-400');
  content = content.replace(/emerald-300/g, 'zinc-200');
  content = content.replace(/emerald-700/g, 'zinc-500');
  
  content = content.replace(/bg-emerald-500\/10/g, 'bg-white/10');
  content = content.replace(/bg-emerald-500\/15/g, 'bg-white/10');
  content = content.replace(/bg-emerald-500\/20/g, 'bg-white/10');
  content = content.replace(/bg-emerald-500\/8/g, 'bg-white/5');
  content = content.replace(/bg-emerald-500\/\[0\.03\]/g, 'bg-white/5');
  content = content.replace(/bg-emerald-500\/\[0\.04\]/g, 'bg-white/5');
  content = content.replace(/bg-emerald-500\/\[0\.06\]/g, 'bg-white/5');
  content = content.replace(/bg-emerald-500\/\[0\.08\]/g, 'bg-white/5');
  
  content = content.replace(/border-emerald-500\/25/g, 'border-white/15');
  content = content.replace(/border-emerald-500\/20/g, 'border-white/15');
  content = content.replace(/border-emerald-500\/30/g, 'border-white/20');
  content = content.replace(/border-emerald-500\/40/g, 'border-white/20');
  content = content.replace(/border-emerald-500\/35/g, 'border-white/20');
  content = content.replace(/border-emerald-500\/15/g, 'border-white/10');
  content = content.replace(/border-emerald-500/g, 'border-white/20');

  content = content.replace(/animate-emerald-pulse/g, 'animate-pulse');
  content = content.replace(/text-emerald-400/g, 'text-white');
  content = content.replace(/text-emerald-500/g, 'text-zinc-300');
  content = content.replace(/text-emerald-300/g, 'text-zinc-200');

  // Some specific css variables
  content = content.replace(/--ll-accent-emerald:([^;]+);/g, '--ll-accent-emerald: #d4d4d8;');
  content = content.replace(/--ll-accent-emerald-bright:([^;]+);/g, '--ll-accent-emerald-bright: #ffffff;');
  content = content.replace(/badge-emerald/g, 'badge-zinc');

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});
