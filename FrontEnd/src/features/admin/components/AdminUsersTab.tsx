import { useState, useMemo } from 'react'
import {
  Search,
  Eye,
  Trash2,
  Lock,
  Unlock,
  Key,
  UserCheck,
  UserX
} from 'lucide-react'
import { useTranslation } from '@/context/LanguageContext'
import { useToast } from '@/components/ui/Toast'
import { Modal } from '@/components/ui/Modal'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { AdminUser } from '../services/adminService'

export function AdminUsersTab({
  users,
  onUpdateUser,
  onDeleteUser
}: {
  users: AdminUser[]
  onUpdateUser: (id: string, updates: Partial<AdminUser>) => void
  onDeleteUser: (id: string) => void
}) {
  const { language } = useTranslation()
  const toast = useToast()

  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
  const [deleteUserConfirm, setDeleteUserConfirm] = useState<AdminUser | null>(null)
  const [pwResetUserConfirm, setPwResetUserConfirm] = useState<AdminUser | null>(null)
  const [editingRoleUser, setEditingRoleUser] = useState<AdminUser | null>(null)
  const [selectedRole, setSelectedRole] = useState<'admin' | 'teacher' | 'student'>('student')

  // Search/Filter logic
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesRole = roleFilter === 'all' || u.role === roleFilter
      const matchesStatus = statusFilter === 'all' || u.status === statusFilter

      return matchesSearch && matchesRole && matchesStatus
    })
  }, [users, searchTerm, roleFilter, statusFilter])

  // Lock/Unlock Account Action
  const toggleLockUser = (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'inactive' : 'active'
    onUpdateUser(id, { status: nextStatus })
    const label = nextStatus === 'active'
      ? (language === 'vi' ? 'Đã mở khóa tài khoản thành công' : 'Account unlocked successfully')
      : (language === 'vi' ? 'Đã khóa tài khoản thành công' : 'Account locked successfully')
    toast.success(label)
  }

  // Delete User Confirm Action
  const handleDeleteUser = () => {
    if (!deleteUserConfirm) return
    onDeleteUser(deleteUserConfirm.id)
    const msg = language === 'vi' ? 'Đã xóa người dùng thành công' : 'User deleted successfully'
    toast.success(msg)
    setDeleteUserConfirm(null)
  }

  // Reset Password Action
  const handleResetPassword = () => {
    if (!pwResetUserConfirm) return
    const msg = language === 'vi' 
      ? `Đã reset mật khẩu của ${pwResetUserConfirm.name} về mặc định "LumiEdu@2026"` 
      : `Reset ${pwResetUserConfirm.name}'s password to temporary "LumiEdu@2026"`
    toast.success(msg)
    setPwResetUserConfirm(null)
  }

  // Save Role Changes
  const handleSaveRole = () => {
    if (!editingRoleUser) return
    onUpdateUser(editingRoleUser.id, { role: selectedRole })
    const msg = language === 'vi' 
      ? `Đã cập nhật vai trò của ${editingRoleUser.name} thành ${selectedRole}` 
      : `Updated ${editingRoleUser.name}'s role to ${selectedRole}`
    toast.success(msg)
    setEditingRoleUser(null)
  }

  return (
    <div className="space-y-6 select-none text-left">
      {/* Search & Filter Inputs bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-4 rounded-3xl backdrop-blur-sm">
        {/* Search Input box */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder={language === 'vi' ? 'Tìm kiếm người dùng...' : 'Search users by name or email...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/25 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 font-semibold"
          />
        </div>

        {/* Dropdown filters */}
        <div className="flex items-center gap-3">
          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 text-slate-700 dark:text-slate-300 font-bold focus:outline-none"
          >
            <option value="all">{language === 'vi' ? 'Mọi vai trò' : 'All Roles'}</option>
            <option value="admin">Admin</option>
            <option value="teacher">Teacher</option>
            <option value="student">Student</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 text-slate-700 dark:text-slate-300 font-bold focus:outline-none"
          >
            <option value="all">{language === 'vi' ? 'Mọi trạng thái' : 'All Status'}</option>
            <option value="active">{language === 'vi' ? 'Hoạt động' : 'Active'}</option>
            <option value="inactive">{language === 'vi' ? 'Bị khóa/Không HĐ' : 'Inactive'}</option>
          </select>
        </div>
      </div>

      {/* Users table */}
      <Card className="rounded-[28px] overflow-hidden shadow-md">
        <div className="overflow-x-auto overflow-y-auto max-h-[580px] scrollbar-thin relative z-0">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800">
                <th className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900 p-4 pl-6 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider shadow-[inset_0_-1px_0_rgba(0,0,0,0.05)] dark:shadow-[inset_0_-1px_0_rgba(255,255,255,0.05)]">
                  {language === 'vi' ? 'Thành viên' : 'User'}
                </th>
                <th className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900 p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider shadow-[inset_0_-1px_0_rgba(0,0,0,0.05)] dark:shadow-[inset_0_-1px_0_rgba(255,255,255,0.05)]">
                  {language === 'vi' ? 'Vai trò' : 'Role'}
                </th>
                <th className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900 p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider shadow-[inset_0_-1px_0_rgba(0,0,0,0.05)] dark:shadow-[inset_0_-1px_0_rgba(255,255,255,0.05)]">
                  {language === 'vi' ? 'Gói sử dụng' : 'Plan'}
                </th>
                <th className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900 p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider shadow-[inset_0_-1px_0_rgba(0,0,0,0.05)] dark:shadow-[inset_0_-1px_0_rgba(255,255,255,0.05)]">
                  {language === 'vi' ? 'Dung lượng' : 'Storage'}
                </th>
                <th className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900 p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider shadow-[inset_0_-1px_0_rgba(0,0,0,0.05)] dark:shadow-[inset_0_-1px_0_rgba(255,255,255,0.05)]">
                  {language === 'vi' ? 'Trạng thái' : 'Status'}
                </th>
                <th className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900 p-4 pr-6 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right shadow-[inset_0_-1px_0_rgba(0,0,0,0.05)] dark:shadow-[inset_0_-1px_0_rgba(255,255,255,0.05)]">
                  {language === 'vi' ? 'Thao tác' : 'Actions'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((u) => {
                  const firstChar = u.name.charAt(0).toUpperCase()
                  
                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-slate-100/70 dark:hover:bg-slate-800/40 even:bg-slate-50/40 dark:even:bg-slate-900/20 transition-all duration-200 group"
                    >
                      {/* Member Info */}
                      <td className="p-4 pl-6 font-bold text-slate-800 dark:text-slate-200">
                        <div className="flex items-center gap-3">
                          <div className="size-9 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-xs select-none">
                            {firstChar}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[14px] leading-tight font-extrabold">{u.name}</span>
                            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5">{u.email}</span>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="p-4">
                        <Badge className={cn(
                          "font-extrabold text-[10px] uppercase tracking-wider rounded-full px-2.5 py-0.5",
                          u.role === 'admin' && "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20",
                          u.role === 'teacher' && "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20",
                          u.role === 'student' && "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                        )}>
                          {u.role}
                        </Badge>
                      </td>

                      {/* Subscription Plan */}
                      <td className="p-4">
                        <Badge className={cn(
                          "font-extrabold text-[10px] rounded-full px-2.5 py-0.5 uppercase tracking-wide",
                          u.plan === 'pro' 
                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/15"
                            : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-450"
                        )}>
                          {u.plan === 'pro' ? 'Pro' : 'Free'}
                        </Badge>
                      </td>

                      {/* Storage used */}
                      <td className="p-4 text-xs font-semibold text-slate-600 dark:text-slate-400">
                        {(u.storageUsedMB / 1024).toFixed(2)} GB / 10 GB
                      </td>

                      {/* Status */}
                      <td className="p-4">
                        <Badge className={cn(
                          "font-extrabold text-[11px] rounded-full px-2.5 py-0.5 flex items-center gap-1.5 w-fit border",
                          u.status === 'active' 
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/15"
                            : "bg-rose-500/10 text-rose-600 dark:text-rose-450 border-rose-500/15"
                        )}>
                          <span className={cn("size-1.5 rounded-full", u.status === 'active' ? "bg-emerald-500" : "bg-rose-500")} />
                          {u.status === 'active' 
                            ? (language === 'vi' ? 'Hoạt động' : 'Active') 
                            : (language === 'vi' ? 'Bị khóa' : 'Inactive')}
                        </Badge>
                      </td>

                      {/* Actions */}
                      <td className="p-4 pr-6 text-right">
                        <div className="flex items-center justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                          {/* Toggle Lock */}
                          <button
                            onClick={() => toggleLockUser(u.id, u.status)}
                            className={cn(
                              "p-1.5 rounded-lg transition-all cursor-pointer",
                              u.status === 'active'
                                ? "text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                                : "text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-955/40"
                            )}
                            title={u.status === 'active' ? (language === 'vi' ? 'Khóa tài khoản' : 'Lock Account') : (language === 'vi' ? 'Mở khóa tài khoản' : 'Unlock Account')}
                          >
                            {u.status === 'active' ? <Unlock className="size-4" /> : <Lock className="size-4" />}
                          </button>

                          {/* View account info */}
                          <button
                            onClick={() => setSelectedUser(u)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:text-slate-400 dark:hover:text-blue-400 dark:hover:bg-blue-955/20 transition-all cursor-pointer"
                            title={language === 'vi' ? 'Xem thông tin' : 'View account details'}
                          >
                            <Eye className="size-4" />
                          </button>

                          {/* Change Role */}
                          <button
                            onClick={() => {
                              setEditingRoleUser(u)
                              setSelectedRole(u.role)
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-purple-600 hover:bg-purple-55/10 dark:text-slate-400 dark:hover:text-purple-400 dark:hover:bg-purple-955/20 transition-all cursor-pointer"
                            title={language === 'vi' ? 'Đổi vai trò' : 'Change user role'}
                          >
                            <UserCheck className="size-4" />
                          </button>

                          {/* Reset Password */}
                          <button
                            onClick={() => setPwResetUserConfirm(u)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:text-slate-400 dark:hover:text-amber-450 dark:hover:bg-amber-950/20 transition-all cursor-pointer"
                            title={language === 'vi' ? 'Reset mật khẩu' : 'Reset Password'}
                          >
                            <Key className="size-4" />
                          </button>

                          {/* Delete user */}
                          <button
                            onClick={() => setDeleteUserConfirm(u)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:text-slate-500 dark:hover:text-rose-450 dark:hover:bg-rose-955/20 transition-all cursor-pointer"
                            title={language === 'vi' ? 'Xóa người dùng' : 'Delete User'}
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-700">
                      <UserX className="size-10 stroke-[1.25] mb-2" />
                      <p className="font-extrabold text-sm text-slate-700 dark:text-slate-350">
                        {language === 'vi' ? 'Không tìm thấy người dùng nào' : 'No users found'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 1. VIEW USER DETAIL MODAL */}
      <Modal
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        title={language === 'vi' ? 'Thông tin tài khoản' : 'Account Details'}
        className="max-w-md"
      >
        {selectedUser && (
          <div className="space-y-5 text-slate-800 dark:text-slate-200">
            <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="size-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg select-none">
                {selectedUser.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-base font-extrabold">{selectedUser.name}</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold">{selectedUser.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs leading-normal">
              <div>
                <span className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block mb-1">
                  {language === 'vi' ? 'VAI TRÒ' : 'ROLE'}
                </span>
                <span className="font-bold">{selectedUser.role}</span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-505 font-bold uppercase tracking-wider block mb-1">
                  {language === 'vi' ? 'GÓI CƯỚC' : 'PLAN'}
                </span>
                <span className="font-bold capitalize">{selectedUser.plan || 'Free'}</span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block mb-1">
                  {language === 'vi' ? 'TỔNG TÀI LIỆU' : 'TOTAL UPLOADS'}
                </span>
                <span className="font-bold">{selectedUser.documentsCount} files</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block mb-1">
                  {language === 'vi' ? 'DUNG LƯỢNG LƯU TRỮ' : 'STORAGE'}
                </span>
                <div className="space-y-1.5">
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-600 dark:bg-blue-500 rounded-full" 
                      style={{ width: `${(selectedUser.storageUsedMB / 10240) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between font-extrabold text-[10px] text-slate-450 dark:text-slate-500">
                    <span>{(selectedUser.storageUsedMB / 1024).toFixed(2)} GB {language === 'vi' ? 'đã dùng' : 'used'}</span>
                    <span>10 GB</span>
                  </div>
                </div>
              </div>
              <div className="col-span-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                <span className="text-slate-400 dark:text-slate-500 font-bold block">
                  {language === 'vi' ? 'Ngày gia nhập:' : 'Joined date:'} <span className="font-semibold text-slate-700 dark:text-slate-300 ml-1">{selectedUser.joinedAt}</span>
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button
                onClick={() => setSelectedUser(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 font-bold px-5 py-2.5 rounded-xl text-xs cursor-pointer border-none"
              >
                {language === 'vi' ? 'Đóng' : 'Close'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* 2. CONFIRM PASSWORD RESET MODAL */}
      <Modal
        isOpen={!!pwResetUserConfirm}
        onClose={() => setPwResetUserConfirm(null)}
        title={language === 'vi' ? 'Xác nhận reset mật khẩu' : 'Confirm Password Reset'}
        className="max-w-sm"
      >
        {pwResetUserConfirm && (
          <div className="space-y-4">
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 leading-relaxed">
              {language === 'vi' 
                ? `Bạn có chắc chắn muốn khôi phục mật khẩu của người dùng ${pwResetUserConfirm.name} về mặc định không?`
                : `Are you sure you want to reset password for ${pwResetUserConfirm.name}?`}
            </p>
            <div className="p-3 bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-850 rounded-xl text-xs font-extrabold text-slate-700 dark:text-slate-300">
              {pwResetUserConfirm.name} ({pwResetUserConfirm.email})
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-105 dark:border-slate-800/80">
              <Button
                onClick={() => setPwResetUserConfirm(null)}
                className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-350 font-bold px-4 py-2.5 rounded-xl text-xs cursor-pointer"
              >
                {language === 'vi' ? 'Hủy bỏ' : 'Cancel'}
              </Button>
              <Button
                onClick={handleResetPassword}
                className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs cursor-pointer"
              >
                {language === 'vi' ? 'Reset' : 'Reset'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* 3. CONFIRM DELETE USER MODAL */}
      <Modal
        isOpen={!!deleteUserConfirm}
        onClose={() => setDeleteUserConfirm(null)}
        title={language === 'vi' ? 'Xóa tài khoản người dùng' : 'Delete User Account'}
        className="max-w-sm"
      >
        {deleteUserConfirm && (
          <div className="space-y-4 text-left">
            <div className="flex gap-3 bg-rose-50 dark:bg-rose-955/10 border border-rose-100 dark:border-rose-900/30 p-3.5 rounded-xl">
              <span className="size-2 rounded-full bg-rose-500 mt-1.5 shrink-0" />
              <p className="text-xs font-semibold text-rose-800 dark:text-rose-400 leading-normal">
                {language === 'vi'
                  ? 'Hành động này không thể hoàn tác. Mọi tài liệu và cuộc hội thoại AI của người dùng này sẽ bị xóa vĩnh viễn khỏi hệ thống.'
                  : 'This action is permanent and cannot be undone. User documents and data will be deleted.'}
              </p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-950/50 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300">
              {deleteUserConfirm.name} ({deleteUserConfirm.email})
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button
                onClick={() => setDeleteUserConfirm(null)}
                className="bg-slate-100 text-slate-655 dark:bg-slate-800 dark:text-slate-350 font-bold px-4 py-2.5 rounded-xl text-xs cursor-pointer"
              >
                {language === 'vi' ? 'Hủy' : 'Cancel'}
              </Button>
              <Button
                onClick={handleDeleteUser}
                className="bg-rose-600 hover:bg-rose-550 text-white font-bold px-4 py-2.5 rounded-xl text-xs cursor-pointer"
              >
                {language === 'vi' ? 'Xóa vĩnh viễn' : 'Delete'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* 4. EDIT USER ROLE MODAL */}
      <Modal
        isOpen={!!editingRoleUser}
        onClose={() => setEditingRoleUser(null)}
        title={language === 'vi' ? 'Thay đổi vai trò thành viên' : 'Edit User Role'}
        className="max-w-xs"
      >
        {editingRoleUser && (
          <div className="space-y-4">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wide">
              {language === 'vi' ? 'Chọn vai trò mới cho:' : 'Select role for:'} <span className="font-extrabold text-slate-800 dark:text-white block mt-0.5">{editingRoleUser.name}</span>
            </p>
            <div className="space-y-2">
              {(['student', 'teacher', 'admin'] as const).map((r) => (
                <label
                  key={r}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedRole === r
                      ? 'border-[#3155F6] bg-blue-50/20 dark:border-blue-500/80 dark:bg-blue-955/10'
                      : 'border-slate-200 dark:border-slate-850 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                  }`}
                >
                  <input
                    type="radio"
                    name="edit-role"
                    value={r}
                    checked={selectedRole === r}
                    onChange={() => setSelectedRole(r)}
                    className="sr-only"
                  />
                  <div className={`size-4 rounded-full border flex items-center justify-center shrink-0 ${
                    selectedRole === r ? 'border-blue-600' : 'border-slate-300'
                  }`}>
                    {selectedRole === r && <div className="size-2 rounded-full bg-blue-600" />}
                  </div>
                  <span className="text-xs font-bold capitalize">{r}</span>
                </label>
              ))}
            </div>
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 mt-4">
              <Button
                onClick={() => setEditingRoleUser(null)}
                className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-350 font-bold px-4 py-2.5 rounded-xl text-xs cursor-pointer"
              >
                {language === 'vi' ? 'Hủy' : 'Cancel'}
              </Button>
              <Button
                onClick={handleSaveRole}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs cursor-pointer shadow-md shadow-blue-500/10"
              >
                {language === 'vi' ? 'Lưu thay đổi' : 'Save'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

