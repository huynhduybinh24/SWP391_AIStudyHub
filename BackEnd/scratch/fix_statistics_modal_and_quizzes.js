const fs = require('fs');
const path = require('path');

// 1. StatisticsDetailModal.tsx
const pathModal = 'D:/SWP391_AIStudyHub/FrontEnd/src/features/profile/components/StatisticsDetailModal.tsx';
if (fs.existsSync(pathModal)) {
  let content = fs.readFileSync(pathModal, 'utf8');
  content = content.replace(
    "import { calculateStorageUsage } from '@/utils/storageFormat'",
    "import { calculateStorageUsage, formatStorageSize } from '@/utils/storageFormat'"
  );
  content = content.replace(
    "(user?.plan === 'premium' || user?.plan === 'institutional' || user?.plan === 'enterprise')",
    "((user?.plan as string) === 'premium' || (user?.plan as string) === 'institutional' || (user?.plan as string) === 'enterprise')"
  );
  fs.writeFileSync(pathModal, content, 'utf8');
  console.log('Fixed StatisticsDetailModal.tsx');
}

// 2. QuizzesPage.tsx
const pathQuizzes = 'D:/SWP391_AIStudyHub/FrontEnd/src/features/quizzes/pages/QuizzesPage.tsx';
if (fs.existsSync(pathQuizzes)) {
  let content = fs.readFileSync(pathQuizzes, 'utf8');
  if (!content.includes('import { useAuthStore }')) {
    content = "import { useAuthStore } from '@/stores/authStore'\nimport { documentService } from '@/features/documents/services/documentService'\n" + content;
    fs.writeFileSync(pathQuizzes, content, 'utf8');
    console.log('Fixed QuizzesPage.tsx');
  }
}

// 3. userNotificationService.ts
const pathNotif = 'D:/SWP391_AIStudyHub/FrontEnd/src/features/notifications/services/userNotificationService.ts';
if (fs.existsSync(pathNotif)) {
  let content = fs.readFileSync(pathNotif, 'utf8');
  // Add export keyword to getCurrentUser
  if (content.includes('const getCurrentUser = () => {')) {
    content = content.replace('const getCurrentUser = () => {', 'export const getCurrentUser = () => {');
  } else if (content.includes('const getCurrentUser = () =>')) {
    content = content.replace('const getCurrentUser = () =>', 'export const getCurrentUser = () =>');
  }
  fs.writeFileSync(pathNotif, content, 'utf8');
  console.log('Fixed userNotificationService.ts export');
}
