const fs = require('fs');
const path = require('path');

const pathAnalytics = 'D:/SWP391_AIStudyHub/FrontEnd/src/features/storage/pages/StorageAnalyticsPage.tsx';
let contentAnalytics = fs.readFileSync(pathAnalytics, 'utf8');

// Global replacement for user?.plan === check
contentAnalytics = contentAnalytics.split("user?.plan === 'premium' || user?.plan === 'institutional' || user?.plan === 'enterprise'")
  .join("(user?.plan as string) === 'premium' || (user?.plan as string) === 'institutional' || (user?.plan as string) === 'enterprise'");

// Also replace the other one
contentAnalytics = contentAnalytics.split("(user?.plan === 'premium' || user?.plan === 'institutional' || user?.plan === 'enterprise')")
  .join("((user?.plan as string) === 'premium' || (user?.plan as string) === 'institutional' || (user?.plan as string) === 'enterprise')");

// Replace the audio key issue
contentAnalytics = contentAnalytics.replace("t.storageAnalytics.audio || 'Audio'", "'Audio'");

fs.writeFileSync(pathAnalytics, contentAnalytics, 'utf8');
console.log('Successfully applied final fixes to StorageAnalyticsPage.tsx');
