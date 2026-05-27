import { useState, useMemo } from 'react'
import { Zap, HardDrive, Edit3, Save, Users, Search, ArrowDownCircle } from 'lucide-react'
import { useTranslation } from '@/context/LanguageContext'
import { useToast } from '@/components/ui/Toast'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { AdminUser } from '../services/adminService'
import { cn } from '@/lib/utils'

interface PackageItem {
  id: string
  name: string
  storageLimit: number // in GB
  priceMonthly: number // in VND
  usersCount: number
  perks: string[]
  color: string
}

export function AdminPackagesTab({
  users = [],
  onUpdateUser
}: {
  users?: AdminUser[]
  onUpdateUser: (id: string, updates: Partial<AdminUser>) => void
}) {
  const { language } = useTranslation()
  const toast = useToast()

  const [packages, setPackages] = useState<PackageItem[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('aiStudyHubPackages')
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch (e) {
          console.error('Error loading packages from localStorage:', e)
        }
      }
    }
    return [
      {
        id: 'pkg-free',
        name: 'Free Plan',
        storageLimit: 10,
        priceMonthly: 0,
        usersCount: 11406,
        perks: [
          language === 'vi' ? 'Dung lượng lưu trữ 10 GB' : '10 GB storage limit',
          language === 'vi' ? 'AI Chatbot trợ giúp cơ bản' : 'Basic AI Chatbot assistance',
          language === 'vi' ? 'Chia sẻ tài liệu tối đa 3 người' : 'Share files with up to 3 members',
          language === 'vi' ? 'Tốc độ tải xuống tiêu chuẩn' : 'Standard download speed'
        ],
        color: 'border-slate-200 dark:border-slate-800'
      },
      {
        id: 'pkg-pro',
        name: 'Pro Plan',
        storageLimit: 50,
        priceMonthly: 12,
        usersCount: 3842,
        perks: [
          language === 'vi' ? 'Dung lượng lưu trữ 50 GB' : '50 GB storage limit',
          language === 'vi' ? 'AI Chatbot nâng cao & phân tích sâu' : 'Advanced AI chatbot & deep analysis',
          language === 'vi' ? 'Chia sẻ tệp tin không giới hạn' : 'Unlimited file sharing',
          language === 'vi' ? 'Tốc độ tải xuống băng thông cao' : 'High speed download bandwidth',
          language === 'vi' ? 'Bảo mật dữ liệu nâng cao bằng AI Guard' : 'Advanced security via AI Guard'
        ],
        color: 'border-amber-500/30 dark:border-amber-500/20'
      }
    ]
  })

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editedStorage, setEditedStorage] = useState<number>(10)
  const [editedPrice, setEditedPrice] = useState<number>(12)

  // Subscription upgrade search state
  const [userSearchTerm, setUserSearchTerm] = useState('')

  const handleEditClick = (pkg: PackageItem) => {
    setEditingId(pkg.id)
    setEditedStorage(pkg.storageLimit)
    setEditedPrice(pkg.priceMonthly)
  }

  const handleSaveClick = (id: string) => {
    const nextPackages = packages.map((pkg) =>
      pkg.id === id
        ? {
            ...pkg,
            storageLimit: editedStorage,
            priceMonthly: editedPrice,
            perks: pkg.perks.map((perk, i) => {
              if (i === 0) {
                return language === 'vi'
                  ? `Dung lượng lưu trữ ${editedStorage} GB`
                  : `${editedStorage} GB storage limit`
              }
              return perk
            })
          }
        : pkg
    )
    setPackages(nextPackages)
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('aiStudyHubPackages', JSON.stringify(nextPackages))
      } catch (e) {
        console.error('Error saving packages to localStorage:', e)
      }
    }
    setEditingId(null)
    const msg = language === 'vi' ? 'Đã lưu cấu hình gói cước thành công' : 'Package config saved successfully'
    toast.success(msg)
  }

  // Filter users for upgrades search
  const searchedUsers = useMemo(() => {
    if (!userSearchTerm.trim()) return []
    return users.filter(
      u =>
        u.name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearchTerm.toLowerCase())
    )
  }, [users, userSearchTerm])

  const handleToggleUserPlan = (user: AdminUser) => {
    const isCurrentlyPro = user.plan === 'pro'
    const nextPlan = isCurrentlyPro ? 'free' : 'pro'
    
    onUpdateUser(user.id, { 
      plan: nextPlan
    })

    const msg = language === 'vi'
      ? `Đã nâng cấp ${user.name} lên gói Pro thành công`
      : `Successfully upgraded ${user.name} to Pro Plan`
    
    const downgradeMsg = language === 'vi'
      ? `Đã hạ gói ${user.name} xuống gói Free`
      : `Downgraded ${user.name} to Free Plan`

    toast.success(isCurrentlyPro ? downgradeMsg : msg)
  }

  return (
    <div className="space-y-6 select-none text-left">
      {/* Overview Cards row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {packages.map((pkg) => {
          const isPro = pkg.id === 'pkg-pro'
          const isEditing = editingId === pkg.id

          return (
            <Card
              key={pkg.id}
              className={`relative overflow-hidden group hover:shadow-lg transition-all duration-300 rounded-[28px] border-2 bg-white dark:bg-slate-900 ${pkg.color}`}
            >
              {isPro && (
                <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-500 to-amber-600 dark:from-amber-600 dark:to-amber-550 text-white font-extrabold text-[9px] tracking-widest uppercase py-1 px-4 rounded-bl-2xl">
                  {language === 'vi' ? 'PHỔ BIẾN' : 'POPULAR'}
                </div>
              )}

              <CardContent className="p-6 flex flex-col justify-between h-full min-h-[300px]">
                <div className="space-y-4">
                  {/* Package name and statistics */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-black text-slate-855 dark:text-white leading-tight">
                        {pkg.name}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-500 dark:text-slate-455 font-bold">
                        <Users className="size-4" />
                        <span>{pkg.usersCount.toLocaleString()} {language === 'vi' ? 'người dùng' : 'active users'}</span>
                      </div>
                    </div>

                    <div className={`p-2.5 rounded-xl ${isPro ? 'bg-amber-50 dark:bg-amber-955/40 text-amber-500' : 'bg-slate-50 dark:bg-slate-800 text-slate-500'}`}>
                      {isPro ? <Zap className="size-5" /> : <HardDrive className="size-5" />}
                    </div>
                  </div>

                  {/* Pricing and Storage limits details */}
                  <div className="py-4 border-y border-slate-100 dark:border-slate-850 space-y-3.5">
                    <div className="flex items-baseline gap-1 text-slate-800 dark:text-slate-100">
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-black text-slate-700 dark:text-slate-355">$</span>
                          <input
                            type="number"
                            value={editedPrice}
                            onChange={(e) => setEditedPrice(parseFloat(e.target.value) || 0)}
                            className="w-24 p-1.5 text-sm rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 font-bold text-slate-900 dark:text-white focus:outline-none"
                            placeholder="Price"
                          />
                          <span className="text-xs font-bold text-slate-400">/{language === 'vi' ? 'tháng' : 'month'}</span>
                        </div>
                      ) : (
                        <>
                          <span className="text-3xl font-black">${pkg.priceMonthly === 0 ? '0' : pkg.priceMonthly.toLocaleString()}</span>
                          <span className="text-xs font-bold text-slate-400 dark:text-slate-505 font-medium ml-1">
                            /{language === 'vi' ? 'tháng' : 'month'}
                          </span>
                        </>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                        {language === 'vi' ? 'Hạn mức lưu trữ' : 'Storage Limit'}
                      </span>
                      {isEditing ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            value={editedStorage}
                            onChange={(e) => setEditedStorage(parseInt(e.target.value) || 0)}
                            className="w-16 p-1 text-center rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 font-bold text-slate-900 dark:text-white focus:outline-none"
                          />
                          <span className="font-bold text-slate-500">GB</span>
                        </div>
                      ) : (
                        <span className="font-extrabold text-slate-705 dark:text-slate-300 text-sm">
                          {pkg.storageLimit} GB
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Perks list */}
                  <div className="space-y-2 pt-2">
                    {pkg.perks.map((perk, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400 leading-normal">
                        <span className={`size-1.5 rounded-full mt-1.5 shrink-0 ${isPro ? 'bg-amber-500' : 'bg-slate-400'}`} />
                        <span>{perk}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Edit & Save Action footer */}
                <div className="mt-6 flex justify-end">
                  {isEditing ? (
                    <Button
                      onClick={() => handleSaveClick(pkg.id)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm border-none"
                    >
                      <Save className="size-3.5" />
                      <span>{language === 'vi' ? 'Lưu' : 'Save'}</span>
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleEditClick(pkg)}
                      className="bg-slate-50 hover:bg-slate-100 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-750 dark:text-slate-300 font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer border-none"
                    >
                      <Edit3 className="size-3.5" />
                      <span>{language === 'vi' ? 'Chỉnh sửa' : 'Edit Config'}</span>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* User Plan Upgrade Section */}
      <Card className="rounded-[28px] overflow-hidden border border-slate-205 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-md mt-8">
        <div className="space-y-5">
          <div>
            <h3 className="text-lg font-black text-slate-850 dark:text-white leading-tight flex items-center gap-2">
              <Zap className="size-5 text-amber-500" />
              {language === 'vi' ? 'Quản lý nâng cấp gói thành viên' : 'Upgrade Member Subscription'}
            </h3>
            <p className="text-xs font-semibold text-slate-450 dark:text-slate-500 mt-1">
              {language === 'vi' ? 'Tìm kiếm người dùng và nâng cấp/hạ gói của họ trực tiếp từ bảng quản trị.' : 'Search for users and upgrade or downgrade their plans directly.'}
            </p>
          </div>

          {/* User Search Input */}
          <div className="relative max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-505" />
            <input
              type="text"
              value={userSearchTerm}
              onChange={(e) => setUserSearchTerm(e.target.value)}
              placeholder={language === 'vi' ? 'Tìm người dùng theo tên hoặc email...' : 'Search user by name or email...'}
              className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-205 bg-white text-slate-900 placeholder:text-slate-450 focus:outline-none focus:ring-2 focus:ring-blue-500/25 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 font-semibold"
            />
          </div>

          {/* Search suggestions table */}
          {userSearchTerm.trim() !== '' && (
            <div className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden mt-4">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-955/60 border-b border-slate-100 dark:border-slate-800 text-[10px] font-extrabold text-slate-455 dark:text-slate-500 uppercase tracking-widest">
                    <th className="p-3.5 pl-5">{language === 'vi' ? 'Thành viên' : 'User'}</th>
                    <th className="p-3.5">{language === 'vi' ? 'Vai trò' : 'Role'}</th>
                    <th className="p-3.5">{language === 'vi' ? 'Gói hiện tại' : 'Current Plan'}</th>
                    <th className="p-3.5 pr-5 text-right">{language === 'vi' ? 'Hành động' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {searchedUsers.length > 0 ? (
                    searchedUsers.map((u) => {
                      const isPro = u.plan === 'pro'
                      return (
                        <tr key={u.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-850/30 transition-colors">
                          <td className="p-3 pl-5 font-bold">
                            <div className="flex flex-col">
                              <span className="text-slate-850 dark:text-slate-200 font-extrabold">{u.name}</span>
                              <span className="text-[10px] text-slate-400 dark:text-slate-505 mt-0.5">{u.email}</span>
                            </div>
                          </td>
                          <td className="p-3 font-semibold uppercase text-[10px] text-slate-500 dark:text-slate-400">
                            {u.role}
                          </td>
                          <td className="p-3">
                            <Badge className={cn(
                              "font-extrabold text-[9px] rounded-full px-2 py-0.5 uppercase tracking-wide shrink-0 select-none",
                              isPro 
                                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/15"
                                : "bg-slate-100 text-slate-505 dark:bg-slate-800 dark:text-slate-450"
                            )}>
                              {isPro ? 'Pro' : 'Free'}
                            </Badge>
                          </td>
                          <td className="p-3 pr-5 text-right">
                            <Button
                              onClick={() => handleToggleUserPlan(u)}
                              className={cn(
                                "font-bold text-[10px] px-3 py-1.5 rounded-lg flex items-center gap-1 ml-auto border-none",
                                isPro 
                                  ? "bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200"
                                  : "bg-amber-500 hover:bg-amber-650 text-white font-extrabold shadow-sm shadow-amber-500/10"
                              )}
                            >
                              {isPro ? (
                                <>
                                  <ArrowDownCircle className="size-3" />
                                  <span>{language === 'vi' ? 'Hạ cấp xuống Free' : 'Downgrade to Free'}</span>
                                </>
                              ) : (
                                <>
                                  <Zap className="size-3 text-white" />
                                  <span>{language === 'vi' ? 'Nâng cấp lên Pro' : 'Upgrade to Pro'}</span>
                                </>
                              )}
                            </Button>
                          </td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-slate-400 dark:text-slate-550 font-semibold">
                        {language === 'vi' ? 'Không tìm thấy người dùng nào khớp' : 'No users found matching query'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
