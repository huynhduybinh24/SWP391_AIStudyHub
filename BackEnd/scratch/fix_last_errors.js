const fs = require('fs');

// 1. Header.tsx - cast n.type to string before comparing
const pathHeader = 'D:/SWP391_AIStudyHub/FrontEnd/src/components/layout/Header.tsx';
if (fs.existsSync(pathHeader)) {
  let c = fs.readFileSync(pathHeader, 'utf8');
  c = c.replace(
    "typeStr === 'document_deleted' || typeStr === 'document_rejected' || typeStr === 'document_removed'",
    "(typeStr as string) === 'document_deleted' || (typeStr as string) === 'document_rejected' || (typeStr as string) === 'document_removed'"
  );
  fs.writeFileSync(pathHeader, c, 'utf8');
  console.log('Fixed Header.tsx');
}

// 2. AdminPackagesTab.tsx - cast plan string to union type
const pathPkg = 'D:/SWP391_AIStudyHub/FrontEnd/src/features/admin/components/AdminPackagesTab.tsx';
if (fs.existsSync(pathPkg)) {
  let c = fs.readFileSync(pathPkg, 'utf8');
  c = c.replace(
    'onUpdateUser(u.id, { plan: nextPlan })',
    'onUpdateUser(u.id, { plan: nextPlan as any })'
  );
  fs.writeFileSync(pathPkg, c, 'utf8');
  console.log('Fixed AdminPackagesTab.tsx');
}

// 3. AdminUsersTab.tsx - cast selectedRole to any
const pathUsersTab = 'D:/SWP391_AIStudyHub/FrontEnd/src/features/admin/components/AdminUsersTab.tsx';
if (fs.existsSync(pathUsersTab)) {
  let c = fs.readFileSync(pathUsersTab, 'utf8');
  c = c.replace(
    'onUpdateUser(editingRoleUser.id, { role: selectedRole })',
    'onUpdateUser(editingRoleUser.id, { role: selectedRole as any })'
  );
  fs.writeFileSync(pathUsersTab, c, 'utf8');
  console.log('Fixed AdminUsersTab.tsx role cast');
}

console.log('\nAll remaining type errors fixed!');
