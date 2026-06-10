const fs = require('fs');

// ============================================================
// 1. adminService.ts - fix implicit any in reduce + unused params
// ============================================================
const pathAdmin = 'D:/SWP391_AIStudyHub/FrontEnd/src/features/admin/services/adminService.ts';
if (fs.existsSync(pathAdmin)) {
  let c = fs.readFileSync(pathAdmin, 'utf8');
  // Fix reduce implicit any
  c = c.replace(
    '(statsData.newRegistrationsLast7Days || []).reduce((a, b) => a + b, 0)',
    '(statsData.newRegistrationsLast7Days || []).reduce((a: number, b: number) => a + b, 0)'
  );
  // Fix unused 'reason' parameter in deleteUser
  c = c.replace(
    'export const deleteUser = async (userId: string, reason?: string): Promise<{ success: boolean }> => {',
    'export const deleteUser = async (userId: string, _reason?: string): Promise<{ success: boolean }> => {'
  );
  // Fix unused 'reason' parameter in deleteDocument
  c = c.replace(
    'export const deleteDocument = async (documentId: string, reason?: string): Promise<{ success: boolean }> => {',
    'export const deleteDocument = async (documentId: string, _reason?: string): Promise<{ success: boolean }> => {'
  );
  fs.writeFileSync(pathAdmin, c, 'utf8');
  console.log('Fixed adminService.ts');
}

// ============================================================
// 2. AdminUsersTab.tsx - cast role/status to string for comparisons
// ============================================================
const pathUsersTab = 'D:/SWP391_AIStudyHub/FrontEnd/src/features/admin/components/AdminUsersTab.tsx';
if (fs.existsSync(pathUsersTab)) {
  let c = fs.readFileSync(pathUsersTab, 'utf8');
  // Fix role === 'student' comparison
  c = c.split("u.role === 'student'").join("(u.role as string) === 'student'");
  // Fix status === 'banned' comparison
  c = c.split("s === 'banned'").join("(s as string) === 'banned'");
  // Fix role === 'instructor' comparison
  c = c.split("u.role === 'instructor'").join("(u.role as string) === 'instructor'");
  fs.writeFileSync(pathUsersTab, c, 'utf8');
  console.log('Fixed AdminUsersTab.tsx');
}

// ============================================================
// 3. AdminDashboardPage.tsx - add 'avatar' to adminService updateUser call
// ============================================================
const pathAdminDash = 'D:/SWP391_AIStudyHub/FrontEnd/src/features/admin/pages/AdminDashboardPage.tsx';
if (fs.existsSync(pathAdminDash)) {
  let c = fs.readFileSync(pathAdminDash, 'utf8');
  // avatar doesn't exist on AdminUser - cast to any
  c = c.replace(
    "avatar: updated.avatar || '/logo.png'",
    "avatar: (updated as any).avatar || '/logo.png'"
  );
  fs.writeFileSync(pathAdminDash, c, 'utf8');
  console.log('Fixed AdminDashboardPage.tsx');
}

// ============================================================
// 4. ChatPage.tsx - userId must be number
// ============================================================
const pathChat = 'D:/SWP391_AIStudyHub/FrontEnd/src/features/ai-chatbot/pages/ChatPage.tsx';
if (fs.existsSync(pathChat)) {
  let c = fs.readFileSync(pathChat, 'utf8');
  // Change userId from `user?.id || 1` to `Number(user?.id || 1)`
  c = c.replace(
    'const userId = user?.id || 1',
    'const userId = Number(user?.id || 1)'
  );
  fs.writeFileSync(pathChat, c, 'utf8');
  console.log('Fixed ChatPage.tsx');
}

// ============================================================
// 5. userNotificationService.ts - fix unused 'email' param in deleteNotification
// ============================================================
const pathNotif = 'D:/SWP391_AIStudyHub/FrontEnd/src/features/notifications/services/userNotificationService.ts';
if (fs.existsSync(pathNotif)) {
  let c = fs.readFileSync(pathNotif, 'utf8');
  c = c.replace(
    'async deleteNotification(id: string): Promise<void> {',
    'async deleteNotification(id: string, _email?: string): Promise<void> {'
  );
  fs.writeFileSync(pathNotif, c, 'utf8');
  console.log('Fixed userNotificationService.ts unused param');
}

console.log('\nAll done!');
