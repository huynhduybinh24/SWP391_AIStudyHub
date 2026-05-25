const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../src');

// A list of common English terms that should be translated
const targetWords = [
  'Dashboard', 'My Documents', 'Upload', 'AI Chatbot', 'Shared Files', 
  'Cloud Storage', 'Notifications', 'Study Plans', 'Profile', 'Settings', 
  'Upgrade to Pro', 'Open', 'Preview', 'Download', 'Share Access', 
  'Rename', 'Change Permission', 'Remove Access', 'Save', 'Cancel', 
  'Done', 'Search', 'Invite', 'Upload File', 'Generate Summary', 
  'Import', 'Back to Shared Files', 'Back to Documents', 'Back to Notifications',
  'Are you sure', 'Remove Access', 'Import this file', 'Preview opened'
];

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const results = [];
  
  lines.forEach((line, index) => {
    // Check if line contains any of the target words as raw text, or placeholders, or hardcoded strings
    // We want to avoid matching keys in locale files themselves!
    if (filePath.includes('locales') || filePath.includes('scan_i18n')) {
      return;
    }
    
    // Quick checks for common patterns of hardcoded text
    targetWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'i');
      if (regex.test(line)) {
        // Exclude lines that are comments, imports, console.logs, or already use translation variables (e.g. t.common.save)
        if (
          !line.trim().startsWith('//') && 
          !line.trim().startsWith('import') && 
          !line.includes('console.') && 
          !line.includes('t.') && 
          !line.includes('translations.') &&
          !line.includes('t(')
        ) {
          results.push({ lineNum: index + 1, text: line.trim(), matchedWord: word });
        }
      }
    });
  });
  
  return results;
}

function traverse(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      traverse(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      const issues = scanFile(fullPath);
      if (issues.length > 0) {
        console.log(`\nFile: ${path.relative(srcDir, fullPath)}`);
        issues.forEach(issue => {
          console.log(`  Line ${issue.lineNum}: "${issue.text}" (matched: "${issue.matchedWord}")`);
        });
      }
    }
  }
}

console.log("Scanning for hardcoded English texts...");
traverse(srcDir);
