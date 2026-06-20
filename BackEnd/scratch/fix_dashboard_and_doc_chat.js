const fs = require('fs');

// 1. dashboardService.ts
const pathDashboard = 'D:/SWP391_AIStudyHub/FrontEnd/src/features/dashboard/services/dashboardService.ts';
if (fs.existsSync(pathDashboard)) {
  let content = fs.readFileSync(pathDashboard, 'utf8');
  content = content.replace(
    "(user?.plan === 'premium' || user?.plan === 'institutional' || user?.plan === 'enterprise')",
    "((user?.plan as string) === 'premium' || (user?.plan as string) === 'institutional' || (user?.plan as string) === 'enterprise')"
  );
  fs.writeFileSync(pathDashboard, content, 'utf8');
  console.log('Fixed dashboardService.ts');
}

// 2. DocumentsPage.tsx
const pathDocs = 'D:/SWP391_AIStudyHub/FrontEnd/src/features/documents/pages/DocumentsPage.tsx';
if (fs.existsSync(pathDocs)) {
  let content = fs.readFileSync(pathDocs, 'utf8');
  content = content.replace(
    "const session = await aiService.createOrGetChatSession(doc.id, userId)",
    "const session = await aiService.createOrGetChatSession([Number(doc.id)], Number(userId))"
  );
  content = content.replace(
    "const session = await aiService.createOrGetChatSession(selectedDocForChat.id, userId)",
    "const session = await aiService.createOrGetChatSession([Number(selectedDocForChat.id)], Number(userId))"
  );
  fs.writeFileSync(pathDocs, content, 'utf8');
  console.log('Fixed DocumentsPage.tsx');
}
