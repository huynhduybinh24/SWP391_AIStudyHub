const fs = require('fs');
const path = require('path');

// 1. StorageAnalyticsPage.tsx
const pathAnalytics = 'D:/SWP391_AIStudyHub/FrontEnd/src/features/storage/pages/StorageAnalyticsPage.tsx';
let contentAnalytics = fs.readFileSync(pathAnalytics, 'utf8');
contentAnalytics = contentAnalytics.replace(
  "const isPremium = user?.plan === 'premium' || user?.plan === 'institutional' || user?.plan === 'enterprise'",
  "const isPremium = (user?.plan as string) === 'premium' || (user?.plan as string) === 'institutional' || (user?.plan as string) === 'enterprise'"
);
fs.writeFileSync(pathAnalytics, contentAnalytics, 'utf8');
console.log('Fixed StorageAnalyticsPage.tsx');

// 2. StorageCleanupPage.tsx
const pathCleanup = 'D:/SWP391_AIStudyHub/FrontEnd/src/features/storage/pages/StorageCleanupPage.tsx';
let contentCleanup = fs.readFileSync(pathCleanup, 'utf8');
contentCleanup = contentCleanup.replace(
  "(user?.plan === 'premium' || user?.plan === 'institutional' || user?.plan === 'enterprise')",
  "((user?.plan as string) === 'premium' || (user?.plan as string) === 'institutional' || (user?.plan as string) === 'enterprise')"
);
fs.writeFileSync(pathCleanup, contentCleanup, 'utf8');
console.log('Fixed StorageCleanupPage.tsx');

// 3. StorageExplorerPage.tsx
const pathExplorer = 'D:/SWP391_AIStudyHub/FrontEnd/src/features/storage/pages/StorageExplorerPage.tsx';
let contentExplorer = fs.readFileSync(pathExplorer, 'utf8');
contentExplorer = contentExplorer.replace(
  "(user?.plan === 'premium' || user?.plan === 'institutional' || user?.plan === 'enterprise')",
  "((user?.plan as string) === 'premium' || (user?.plan as string) === 'institutional' || (user?.plan as string) === 'enterprise')"
);
fs.writeFileSync(pathExplorer, contentExplorer, 'utf8');
console.log('Fixed StorageExplorerPage.tsx');
