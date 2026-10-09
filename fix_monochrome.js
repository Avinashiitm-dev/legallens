const fs = require('fs');
const path = require('path');

const walk = (dir, callback) => {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walk(dirPath, callback);
    } else {
      if (f.endsWith('.tsx') && !f.includes('Login') && !f.includes('liquid')) {
        callback(dirPath);
      }
    }
  });
};

const replaceColors = (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace gradients
  content = content.replace(/bg-gradient-to-[a-z]+\s+from-(amber|orange|indigo|purple|violet)-[0-9]+\/[0-9]+\s+to-(amber|orange|indigo|purple|violet|slate|zinc)-[0-9]+\/[0-9]+/g, 'bg-zinc-900/50');
  content = content.replace(/from-(amber|orange|indigo|purple|violet)-[0-9]+(\/[0-9]+)?/g, 'from-zinc-500/20');
  content = content.replace(/to-(amber|orange|indigo|purple|violet)-[0-9]+(\/[0-9]+)?/g, 'to-zinc-500/20');

  // Replace background glows
  content = content.replace(/bg-(amber|orange|indigo|purple|violet)-[0-9]+\/[0-9]+/g, 'bg-zinc-800');
  content = content.replace(/bg-(amber|orange|indigo|purple|violet)-[0-9]+/g, 'bg-zinc-700');
  
  // Replace borders
  content = content.replace(/border-(amber|orange|indigo|purple|violet)-[0-9]+\/[0-9]+/g, 'border-zinc-700');
  content = content.replace(/border-(amber|orange|indigo|purple|violet)-[0-9]+/g, 'border-zinc-600');
  content = content.replace(/ring-(amber|orange|indigo|purple|violet)-[0-9]+\/[0-9]+/g, 'ring-zinc-700');
  
  // Replace text colors
  content = content.replace(/text-(amber|orange|indigo|purple|violet)-[0-9]+/g, 'text-zinc-300');
  
  // Shadows
  content = content.replace(/shadow-(amber|orange|indigo|purple|violet)-[0-9]+\/[0-9]+/g, 'shadow-zinc-900/10');
  
  // hover states
  content = content.replace(/hover:bg-(amber|orange|indigo|purple|violet)-[0-9]+\/[0-9]+/g, 'hover:bg-zinc-700');
  content = content.replace(/hover:bg-(amber|orange|indigo|purple|violet)-[0-9]+/g, 'hover:bg-zinc-600');
  content = content.replace(/hover:text-(amber|orange|indigo|purple|violet)-[0-9]+/g, 'hover:text-zinc-200');
  content = content.replace(/hover:border-(amber|orange|indigo|purple|violet)-[0-9]+/g, 'hover:border-zinc-500');

  fs.writeFileSync(filePath, content);
};

walk('src/components', replaceColors);
walk('src/pages', replaceColors);

console.log('Colors replaced successfully');
