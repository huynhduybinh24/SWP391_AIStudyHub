import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Search,
  Eye,
  Trash2,
  Lock,
  Unlock,
  Key,
  UserCheck,
  UserX,
  ChevronLeft,
  ChevronRight,
  TrendingDown
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
  onUpdateUser: (id: string, updates: Partial<AdminUser>, reason?: string) => void
  onDeleteUser: (id: string, reason?: string) => void
}) {
  const { language } = useTranslation()
  const toast = useToast()

  const [searchParams] = useSearchParams()
  const keywordParam = searchParams.get('keyword') || ''
  const [searchTerm, setSearchTerm] = useState(keywordParam)

  useEffect(() => {
    setSearchTerm(keywordParam)
  }, [keywordParam])

  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
  const [deleteUserConfirm, setDeleteUserConfirm] = useState<AdminUser | null>(null)
  const [deleteReason, setDeleteReason] = useState('')
  const [lockUserConfirm, setLockUserConfirm] = useState<AdminUser | null>(null)
  const [lockReason, setLockReason] = useState('')
  const [pwResetUserConfirm, setPwResetUserConfirm] = useState<AdminUser | null>(null)
  const [editingRoleUser, setEditingRoleUser] = useState<AdminUser | null>(null)
  const [selectedRole, setSelectedRole] = useState<'admin' | 'teacher' | 'student'>('student')
  const [downgradeUserConfirm, setDowngradeUserConfirm] = useState<AdminUser | null>(null)

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(5) // Default to 5 rows per page to demonstrate pagination easily

  // Search/Filter logic
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const searchLower = searchTerm.toLowerCase()
      const planName = u.plan === 'pro' ? 'pro' : u.plan === 'free' ? 'free' : (u.plan || 'free').toLowerCase()
      const matchesSearch =
        u.name.toLowerCase().includes(searchLower) ||
        u.email.toLowerCase().includes(searchLower) ||
        u.role.toLowerCase().includes(searchLower) ||
        planName.includes(searchLower)
      
      const matchesRole = roleFilter === 'all' || u.role === roleFilter
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'inactive' && (u.status === 'inactive' || u.status === 'locked')) ||
        u.status === statusFilter

      return matchesSearch && matchesRole && matchesStatus
    })
  }, [users, searchTerm, roleFilter, statusFilter])

  // Reset page to 1 when filters or search term changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, roleFilter, statusFilter])

  const totalPages = Math.ceil(filteredUsers.length / rowsPerPage) || 1

  // Slice users for the current page
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage
    return filteredUsers.slice(startIndex, startIndex + rowsPerPage)
  }, [filteredUsers, currentPage, rowsPerPage])

  // Range numbers for pagination display label
  const startRange = filteredUsers.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1
  const endRange = Math.min(currentPage * rowsPerPage, filteredUsers.length)

  // Lock/Unlock Account Action
  const toggleLockUser = (id: string, currentStatus: string) => {
    if (currentStatus === 'active') {
      const userToLock = users.find((u) => u.id === id)
      if (userToLock) {
        setLockUserConfirm(userToLock)
        setLockReason('')
      }
    } else {
      onUpdateUser(id, { status: 'active' })
      const label = language === 'vi' ? 'Đã mở khóa tài khoản thành công' : 'Account unlocked successfully'
      toast.success(label)
    }
  }

  const handleConfirmLockUser = () => {
    if (!lockUserConfirm) return
    onUpdateUser(lockUserConfirm.id, { status: 'locked' }, lockReason)
    const label = language === 'vi'
      ? `Đã khóa tài khoản và gửi email thông báo lý do đến ${lockUserConfirm.email} thành công`
      : `Account locked and notification email with reason sent to ${lockUserConfirm.email} successfully`
    toast.success(label)
    setLockUserConfirm(null)
    setLockReason('')
  }

  // Delete User Confirm Action
  const handleDeleteUser = () => {
    if (!deleteUserConfirm) return
    onDeleteUser(deleteUserConfirm.id, deleteReason)
    const msg = language === 'vi' 
      ? `Đã xóa người dùng và gửi email thông báo lý do đến ${deleteUserConfirm.email} thành công` 
      : `User deleted and notification email with reason sent to ${deleteUserConfirm.email} successfully`
    toast.success(msg)
    setDeleteUserConfirm(null)
    setDeleteReason('')
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
    onUpdateUser(editingRoleUser.id, { role: selectedRole as any })
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
            placeholder={language === 'vi' ? 'Tìm theo tên, email hoặc vai trò...' : 'Search by name, email, or role...'}
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
                  {language === 'vi' ? 'Hoạt động gần nhất' : 'Last Active'}
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
              {paginatedUsers.length > 0 ? (
                paginatedUsers.map((u) => {
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
                          (u.role as string) === 'student' && "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                        )}>
                          {u.role}
                        </Badge>
                      </td>

                      {/* Subscription Plan */}
                      <td className="p-4">
                        {u.role !== 'admin' ? (
                          <Badge className={cn(
                            "font-extrabold text-[10px] rounded-full px-2.5 py-0.5 uppercase tracking-wide",
                            u.plan === 'pro' 
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/15"
                              : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-450"
                          )}>
                            {u.plan === 'pro' ? 'Pro' : 'Free'}
                          </Badge>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-600 font-bold">-</span>
                        )}
                      </td>

                      {/* Storage used */}
                      <td className="p-4 text-xs font-semibold text-slate-600 dark:text-slate-400">
                        {(u.storageUsedMB / 1024).toFixed(2)} GB / {u.plan === 'pro' ? 50 : 10} GB
                      </td>

                      {/* Last Active */}
                      <td className="p-4 text-xs font-semibold text-slate-600 dark:text-slate-400">
                        {u.isOnline 
                          ? (language === 'vi' ? 'Đang hoạt động' : 'Active now')
                          : (language === 'vi' ? (u.lastActiveVi || 'Không rõ') : (u.lastActiveEn || 'Unknown'))}
                      </td>

                      {/* Status */}
                      <td className="p-4">
                        {(() => {
                          const s = u.status; // from DB: 'active' | 'inactive' | 'banned'
                          let badgeBg: string;
                          let dotBg: string;
                          let statusLabel: string;

                          if ((s as string) === 'banned') {
                            badgeBg = "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/15";
                            dotBg = "bg-rose-500";
                            statusLabel = language === 'vi' ? 'Bị cấm' : 'Banned';
                          } else if (s === 'inactive' || s === 'locked') {
                            badgeBg = "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/15";
                            dotBg = "bg-amber-400";
                            statusLabel = s === 'locked' 
                              ? (language === 'vi' ? 'Bị khóa' : 'Locked')
                              : (language === 'vi' ? 'Không hoạt động' : 'Inactive');
                          } else {
                            // active
                            badgeBg = "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/15";
                            dotBg = "bg-emerald-500";
                            statusLabel = language === 'vi' ? 'Hoạt động' : 'Active';
                          }

                          return (
                            <Badge className={cn(
                              "font-extrabold text-[11px] rounded-full px-2.5 py-0.5 flex items-center gap-1.5 w-fit border",
                              badgeBg
                            )}>
                              <span className={cn("size-1.5 rounded-full", dotBg)} />
                              {statusLabel}
                            </Badge>
                          );
                        })()}
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
                              setSelectedRole(
                                u.role === 'admin'
                                  ? 'admin'
                                  : (u.role === 'teacher' || (u.role as string) === 'instructor')
                                    ? 'teacher'
                                    : 'student'
                              )
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-purple-600 hover:bg-purple-55/10 dark:text-slate-400 dark:hover:text-purple-400 dark:hover:bg-purple-955/20 transition-all cursor-pointer"
                            title={language === 'vi' ? 'Đổi vai trò' : 'Change user role'}
                          >
                            <UserCheck className="size-4" />
                          </button>

                          {/* Downgrade Plan (If Pro) */}
                          {u.plan === 'pro' && u.role !== 'admin' && (
                            <button
                              onClick={() => setDowngradeUserConfirm(u)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-500 hover:bg-rose-50 dark:text-slate-400 dark:hover:text-rose-400 dark:hover:bg-rose-955/20 transition-all cursor-pointer"
                              title={language === 'vi' ? 'Hạ cấp gói xuống Free' : 'Downgrade plan to Free'}
                            >
                              <TrendingDown className="size-4" />
                            </button>
                          )}

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
                  <td colSpan={7} className="py-16 text-center">
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

        {/* Pagination Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-slate-200 dark:border-slate-800/60 bg-slate-50/20 dark:bg-slate-900/10 text-xs font-semibold text-slate-500 dark:text-slate-400">
          {/* Left: Rows per page selection */}
          <div className="flex items-center gap-2">
            <span>{language === 'vi' ? 'Số hàng mỗi trang:' : 'Rows per page:'}</span>
            <select
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value))
                setCurrentPage(1)
              }}
              className="px-2 py-1 text-xs font-bold rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
            >
              {[5, 10, 20, 50].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 ml-2 font-medium">
              {language === 'vi'
                ? `Hiển thị ${startRange} - ${endRange} trong tổng số ${filteredUsers.length}`
                : `Showing ${startRange} - ${endRange} of ${filteredUsers.length}`}
            </span>
          </div>

          {/* Right: Previous / Next & Page numbers */}
          <div className="flex items-center gap-1.5">
            {/* Previous Button */}
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={cn(
                "h-8 w-8 rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 flex items-center justify-center font-bold transition-all text-xs cursor-pointer select-none",
                currentPage === 1
                  ? "opacity-40 cursor-not-allowed border-slate-100 dark:border-slate-850"
                  : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 active:scale-95"
              )}
              title={language === 'vi' ? 'Trang trước' : 'Previous page'}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {/* Page numbers */}
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={cn(
                    "h-8 w-8 rounded-lg flex items-center justify-center font-bold text-xs transition-all cursor-pointer select-none",
                    currentPage === page
                      ? "bg-[#3155F6] text-white border border-[#3155F6]"
                      : "border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95"
                  )}
                >
                  {page}
                </button>
              ))}
            </div>

            {/* Next Button */}
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className={cn(
                "h-8 w-8 rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 flex items-center justify-center font-bold transition-all text-xs cursor-pointer select-none",
                currentPage === totalPages
                  ? "opacity-40 cursor-not-allowed border-slate-100 dark:border-slate-850"
                  : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 active:scale-95"
              )}
              title={language === 'vi' ? 'Trang sau' : 'Next page'}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
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
              {selectedUser.role !== 'admin' && (
                <div>
                  <span className="text-slate-400 dark:text-slate-550 font-bold uppercase tracking-wider block mb-1">
                    {language === 'vi' ? 'GÓI CƯỚC' : 'PLAN'}
                  </span>
                  <span className="font-bold capitalize">{selectedUser.plan || 'Free'}</span>
                </div>
              )}
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
                      style={{ width: `${(selectedUser.storageUsedMB / (selectedUser.plan === 'pro' ? 51200 : 10240)) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between font-extrabold text-[10px] text-slate-450 dark:text-slate-500">
                    <span>{(selectedUser.storageUsedMB / 1024).toFixed(2)} GB {language === 'vi' ? 'đã dùng' : 'used'}</span>
                    <span>{selectedUser.plan === 'pro' ? 50 : 10} GB</span>
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
        onClose={() => {
          setDeleteUserConfirm(null)
          setDeleteReason('')
        }}
        title={language === 'vi' ? 'Xóa tài khoản người dùng' : 'Delete User Account'}
        className="max-w-md"
      >
        {deleteUserConfirm && (
          <div className="space-y-4 text-left">
            <div className="flex gap-3 bg-rose-50 dark:bg-rose-955/10 border border-rose-100 dark:border-rose-900/30 p-3.5 rounded-xl">
              <span className="size-2 rounded-full bg-rose-500 mt-1.5 shrink-0" />
              <p className="text-xs font-semibold text-rose-800 dark:text-rose-450 leading-normal">
                {language === 'vi'
                  ? 'Hành động này không thể hoàn tác. Mọi tài liệu và cuộc hội thoại AI của người dùng này sẽ bị xóa vĩnh viễn khỏi hệ thống.'
                  : 'This action is permanent and cannot be undone. User documents and data will be deleted.'}
              </p>
            </div>
            
            <div className="p-3 bg-slate-50 dark:bg-slate-950/50 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300">
              {deleteUserConfirm.name} ({deleteUserConfirm.email})
            </div>

            {/* Deletion Reason Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-500 dark:text-slate-400">
                {language === 'vi' ? 'Lý do xóa tài khoản (sẽ gửi mail cho user):' : 'Reason for deletion (will email user):'}
              </label>
              <textarea
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder={language === 'vi' ? 'Nhập lý do xóa tài khoản...' : 'Enter reason for deletion...'}
                rows={3}
                className="w-full p-3 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/25 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 font-semibold"
              />
              {deleteReason.trim().length === 0 && (
                <p className="text-[10px] text-rose-500 font-bold">
                  {language === 'vi' ? '* Vui lòng nhập lý do để tiếp tục.' : '* Please enter a reason to continue.'}
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button
                onClick={() => {
                  setDeleteUserConfirm(null)
                  setDeleteReason('')
                }}
                className="bg-slate-100 text-slate-655 dark:bg-slate-800 dark:text-slate-350 font-bold px-4 py-2.5 rounded-xl text-xs cursor-pointer"
              >
                {language === 'vi' ? 'Hủy' : 'Cancel'}
              </Button>
              <Button
                onClick={handleDeleteUser}
                disabled={deleteReason.trim().length === 0}
                className="bg-rose-600 hover:bg-rose-550 text-white font-bold px-4 py-2.5 rounded-xl text-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {language === 'vi' ? 'Xóa vĩnh viễn' : 'Delete'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* 3.5. CONFIRM LOCK USER MODAL */}
      <Modal
        isOpen={!!lockUserConfirm}
        onClose={() => {
          setLockUserConfirm(null)
          setLockReason('')
        }}
        title={language === 'vi' ? 'Khóa tài khoản người dùng' : 'Lock User Account'}
        className="max-w-md"
      >
        {lockUserConfirm && (
          <div className="space-y-4 text-left">
            <div className="flex gap-3 bg-amber-50 dark:bg-amber-955/10 border border-amber-100 dark:border-amber-900/30 p-3.5 rounded-xl">
              <span className="size-2 rounded-full bg-amber-500 mt-1.5 shrink-0 animate-pulse" />
              <p className="text-xs font-semibold text-amber-800 dark:text-amber-450 leading-normal">
                {language === 'vi'
                  ? 'Tài khoản của thành viên này sẽ tạm thời bị đình chỉ. Họ sẽ không thể đăng nhập hoặc thực hiện bất kỳ hoạt động nào trên hệ thống.'
                  : 'This user account will be suspended temporarily. They will not be able to log in or perform any actions.'}
              </p>
            </div>
            
            <div className="p-3 bg-slate-50 dark:bg-slate-950/50 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300">
              {lockUserConfirm.name} ({lockUserConfirm.email})
            </div>

            {/* Lock Reason Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-500 dark:text-slate-400">
                {language === 'vi' ? 'Lý do khóa tài khoản (sẽ gửi mail cho user):' : 'Reason for suspension (will email user):'}
              </label>
              <textarea
                value={lockReason}
                onChange={(e) => setLockReason(e.target.value)}
                placeholder={language === 'vi' ? 'Nhập lý do khóa tài khoản...' : 'Enter reason for suspension...'}
                rows={3}
                className="w-full p-3 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/25 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 font-semibold"
              />
              {lockReason.trim().length === 0 && (
                <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">
                  {language === 'vi' ? '* Vui lòng nhập lý do để tiếp tục.' : '* Please enter a reason to continue.'}
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button
                onClick={() => {
                  setLockUserConfirm(null)
                  setLockReason('')
                }}
                className="bg-slate-100 text-slate-655 dark:bg-slate-800 dark:text-slate-350 font-bold px-4 py-2.5 rounded-xl text-xs cursor-pointer"
              >
                {language === 'vi' ? 'Hủy' : 'Cancel'}
              </Button>
              <Button
                onClick={handleConfirmLockUser}
                disabled={lockReason.trim().length === 0}
                className="bg-amber-600 hover:bg-amber-550 text-white font-bold px-4 py-2.5 rounded-xl text-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {language === 'vi' ? 'Khóa tài khoản' : 'Suspend Account'}
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

      {/* Downgrade Subscription Modal */}
      <Modal
        isOpen={!!downgradeUserConfirm}
        onClose={() => setDowngradeUserConfirm(null)}
        title={language === 'vi' ? 'Xác nhận hạ cấp gói thành viên' : 'Confirm Downgrade Plan'}
        className="max-w-md"
      >
        <div className="space-y-6 pt-2">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/20 text-amber-500 flex-shrink-0 border border-amber-100 dark:border-amber-900/30">
              <TrendingDown className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-[#0b1c30] dark:text-slate-100">
                {language === 'vi' ? 'Hạ cấp tài khoản xuống Free?' : 'Downgrade user account to Free?'}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                {language === 'vi' 
                  ? `Hành động này sẽ hủy kích hoạt gói PRO của ${downgradeUserConfirm?.name} và chuyển về gói FREE mặc định (10 GB dung lượng).`
                  : `This action will immediately deactivate ${downgradeUserConfirm?.name}'s PRO package and revert them to the default FREE tier (10 GB storage).`}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 mt-8 border-t border-slate-100 dark:border-slate-800 pt-4">
            <button
              onClick={() => setDowngradeUserConfirm(null)}
              className="px-5 py-2.5 rounded-xl text-sm font-bold bg-slate-50 hover:bg-slate-100 text-slate-600 dark:bg-slate-850 dark:hover:bg-slate-800 dark:text-slate-330 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
            >
              {language === 'vi' ? 'Hủy' : 'Cancel'}
            </button>
            <button
              onClick={() => {
                if (downgradeUserConfirm) {
                  onUpdateUser(downgradeUserConfirm.id, { plan: 'free' })
                  // If downgraded user is stored in settings as well, clear their auto-renew dates!
                  localStorage.removeItem(`aiStudyHubSubAutoRenew:${downgradeUserConfirm.email}`)
                  localStorage.removeItem(`aiStudyHubSubExpiry:${downgradeUserConfirm.email}`)
                  
                  const msg = language === 'vi' 
                    ? `Đã hạ gói thành viên của ${downgradeUserConfirm.name} xuống Free thành công` 
                    : `Successfully downgraded ${downgradeUserConfirm.name}'s plan to Free`
                  toast.success(msg)
                  setDowngradeUserConfirm(null)
                }
              }}
              className="px-5 py-2.5 rounded-xl text-sm font-bold bg-rose-500 hover:bg-rose-600 text-white shadow-md shadow-rose-500/10 transition-all cursor-pointer"
            >
              {language === 'vi' ? 'Hạ gói' : 'Downgrade'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

