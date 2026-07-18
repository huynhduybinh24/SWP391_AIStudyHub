const fs = require('fs');

// 1. Fix QuizzesPage.tsx import path
const pathQuizzes = 'D:/SWP391_AIStudyHub/FrontEnd/src/features/quizzes/pages/QuizzesPage.tsx';
if (fs.existsSync(pathQuizzes)) {
  let content = fs.readFileSync(pathQuizzes, 'utf8');
  content = content.replace(
    "import { documentService } from '@/features/documents/services/documentService'",
    "import { documentService } from '@/services/documentService'"
  );
  fs.writeFileSync(pathQuizzes, content, 'utf8');
  console.log('Fixed QuizzesPage.tsx import path');
}

// 2. Fix userNotificationService.ts by prepending getCurrentUser export definition
const pathNotif = 'D:/SWP391_AIStudyHub/FrontEnd/src/features/notifications/services/userNotificationService.ts';
if (fs.existsSync(pathNotif)) {
  let content = fs.readFileSync(pathNotif, 'utf8');
  const helperDef = `export const getCurrentUser = () => {
  if (typeof window === 'undefined') {
    return { id: 'admin', email: 'admin@example.com', role: 'admin', name: 'Alex Morgan' };
  }
  const data = localStorage.getItem('aiStudyHubCurrentUser');
  if (!data) {
    return { id: 'admin', email: 'admin@example.com', role: 'admin', name: 'Alex Morgan' };
  }
  try {
    const user = JSON.parse(data);
    return {
      id: user.id || user.email || 'admin',
      email: user.email || 'admin@example.com',
      role: (user.role || 'admin').toLowerCase(),
      name: user.name || 'Alex Morgan',
    };
  } catch (e) {
    return { id: 'admin', email: 'admin@example.com', role: 'admin', name: 'Alex Morgan' };
  }
};

`;
  if (!content.includes('export const getCurrentUser = () =>')) {
    content = content.replace("import { apiClient } from '@/lib/axios';", "import { apiClient } from '@/lib/axios';\n\n" + helperDef);
    fs.writeFileSync(pathNotif, content, 'utf8');
    console.log('Prepend getCurrentUser to userNotificationService.ts');
  }
}
