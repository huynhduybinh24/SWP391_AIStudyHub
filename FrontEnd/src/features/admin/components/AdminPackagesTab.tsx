import { useState, useMemo, useEffect } from 'react'
import { Zap, HardDrive, Edit3, Save, Users, Search, Trash2, Plus } from 'lucide-react'
import { useTranslation } from '@/context/LanguageContext'
import { useToast } from '@/components/ui/Toast'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { AdminUser, AdminStats, adminService, SubscriptionPlan } from '../services/adminService'
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
  stats,
  onUpdateUser
}: {
  users?: AdminUser[]
  stats?: AdminStats | null
  onUpdateUser: (id: string, updates: Partial<AdminUser>, reason?: string) => void
}) {
  const { language } = useTranslation()
  const toast = useToast()
  const [dbPlans, setDbPlans] = useState<SubscriptionPlan[]>([])

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const plans = await adminService.getSubscriptionPlans()
        setDbPlans(plans)
        
        // Update packages state with the loaded prices and limits
        setPackages(prevPackages => {
          return prevPackages.map(pkg => {
            let type: 'FREE' | 'PRO' | 'ENTERPRISE' | null = null
            if (pkg.id === 'pkg-free') type = 'FREE'
            else if (pkg.id === 'pkg-pro') type = 'PRO'
            else if (pkg.id === 'pkg-enterprise') type = 'ENTERPRISE'

            if (type) {
              const matchedPlan = plans.find(p => p.planType === type)
              if (matchedPlan) {
                const storageGb = Math.round(matchedPlan.storageLimitMb / 1024)
                return {
                  ...pkg,
                  priceMonthly: matchedPlan.price,
                  storageLimit: storageGb,
                  perks: pkg.perks.map((perk, i) => {
                    if (i === 0) {
                      return language === 'vi'
                        ? `Dung lượng lưu trữ ${storageGb} GB`
                        : `${storageGb} GB storage limit`
                    }
                    return perk
                  })
                }
              }
            }
            return pkg
          })
        })
      } catch (err) {
        console.error('Failed to load subscription plans', err)
      }
    }
    fetchPlans()
  }, [language])

  const [packages, setPackages] = useState<PackageItem[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('aiStudyHubPackages')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          const hasOldData = parsed.some((p: any) => 
            (p.id === 'pkg-free' && p.storageLimit === 10) || 
            (p.id === 'pkg-pro' && (p.priceMonthly === 12 || p.storageLimit === 50)) ||
            (p.id === 'pkg-enterprise' && p.priceMonthly === 2000000)
          )
          if (hasOldData) {
            localStorage.removeItem('aiStudyHubPackages')
          } else {
            return parsed
          }
        } catch (e) {
          console.error('Error loading packages from localStorage:', e)
        }
      }
    }
    return [
      {
        id: 'pkg-free',
        name: 'Free Plan',
        storageLimit: 1,
        priceMonthly: 0,
        usersCount: 11406,
        perks: [
          language === 'vi' ? 'Dung lượng lưu trữ 1 GB' : '1 GB storage limit',
          language === 'vi' ? 'AI Chatbot trợ giúp cơ bản' : 'Basic AI Chatbot assistance',
          language === 'vi' ? 'Chia sẻ tài liệu tối đa 3 người' : 'Share files with up to 3 members',
          language === 'vi' ? 'Tốc độ tải xuống tiêu chuẩn' : 'Standard download speed'
        ],
        color: 'border-slate-200 dark:border-slate-800'
      },
      {
        id: 'pkg-pro',
        name: 'Pro Plan',
        storageLimit: 5,
        priceMonthly: 200000,
        usersCount: 3842,
        perks: [
          language === 'vi' ? 'Dung lượng lưu trữ 5 GB' : '5 GB storage limit',
          language === 'vi' ? 'AI Chatbot nâng cao & phân tích sâu' : 'Advanced AI chatbot & deep analysis',
          language === 'vi' ? 'Chia sẻ tệp tin không giới hạn' : 'Unlimited file sharing',
          language === 'vi' ? 'Tốc độ tải xuống băng thông cao' : 'High speed download bandwidth',
          language === 'vi' ? 'Bảo mật dữ liệu nâng cao bằng AI Guard' : 'Advanced security via AI Guard'
        ],
        color: 'border-amber-500/30 dark:border-amber-500/20 shadow-md shadow-amber-500/5'
      },
      {
        id: 'pkg-enterprise',
        name: 'Premium Plan',
        storageLimit: 50,
        priceMonthly: 300000,
        usersCount: 1250,
        perks: [
          language === 'vi' ? 'Dung lượng lưu trữ 50 GB' : '50 GB storage limit',
          language === 'vi' ? 'AI thông minh cao cấp nhất (GPT-4o)' : 'Top-tier Smart AI Models (GPT-4o)',
          language === 'vi' ? 'Báo cáo phân tích chuyên sâu hàng tuần' : 'Weekly AI In-depth Analytics Reports',
          language === 'vi' ? 'Tạo câu hỏi & Tải tệp không giới hạn' : 'Unlimited Quiz Creation & Document uploads',
          language === 'vi' ? 'Ưu tiên hỗ trợ 24/7' : 'Priority 24/7 Dedicated Support'
        ],
        color: 'border-blue-500/30 dark:border-blue-500/20 shadow-md shadow-blue-500/5'
      }
    ]
  })

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editedStorage, setEditedStorage] = useState<number>(5)
  const [editedPrice, setEditedPrice] = useState<number>(200000)

  // Create Package States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [newPkgName, setNewPkgName] = useState('')
  const [newPkgStorage, setNewPkgStorage] = useState<number>(50)
  const [newPkgPrice, setNewPkgPrice] = useState<number>(300000)
  const [newPkgPerks, setNewPkgPerks] = useState<string[]>([])
  const [newPerkText, setNewPerkText] = useState('')

  const handleAddPerk = () => {
    if (!newPerkText.trim()) return
    setNewPkgPerks((prev) => [...prev, newPerkText.trim()])
    setNewPerkText('')
  }

  const handleRemovePerk = (index: number) => {
    setNewPkgPerks((prev) => prev.filter((_, i) => i !== index))
  }

  const resetCreateForm = () => {
    setNewPkgName('')
    setNewPkgStorage(20)
    setNewPkgPrice(19)
    setNewPkgPerks([])
    setNewPerkText('')
  }

  const handleCreatePackage = () => {
    if (!newPkgName.trim()) return
    
    // Automatically prepend the first perk with the storage limit
    const storagePerk = language === 'vi'
      ? `Dung lượng lưu trữ ${newPkgStorage} GB`
      : `${newPkgStorage} GB storage limit`

    const finalPerks = [storagePerk, ...newPkgPerks]
    
    const newPackage: PackageItem = {
      id: `pkg-${Date.now()}`,
      name: newPkgName,
      storageLimit: newPkgStorage,
      priceMonthly: newPkgPrice,
      usersCount: 0,
      perks: finalPerks,
      color: 'border-slate-200 dark:border-slate-800 hover:border-blue-500/30'
    }

    const nextPackages = [...packages, newPackage]
    setPackages(nextPackages)
    
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('aiStudyHubPackages', JSON.stringify(nextPackages))
      } catch (e) {
        console.error('Error saving packages to localStorage:', e)
      }
    }

    setIsCreateModalOpen(false)
    resetCreateForm()
    
    const msg = language === 'vi' ? 'Đã thêm gói cước mới thành công!' : 'New package created successfully!'
    toast.success(msg)
  }

  const handleDeletePackage = (id: string) => {
    const nextPackages = packages.filter((pkg) => pkg.id !== id)
    setPackages(nextPackages)
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('aiStudyHubPackages', JSON.stringify(nextPackages))
      } catch (e) {
        console.error('Error saving packages to localStorage:', e)
      }
    }
    const msg = language === 'vi' ? 'Đã xóa gói cước thành công' : 'Package deleted successfully'
    toast.success(msg)
  }

  // Subscription upgrade search state
  const [userSearchTerm, setUserSearchTerm] = useState('')

  const handleEditClick = (pkg: PackageItem) => {
    setEditingId(pkg.id)
    setEditedStorage(pkg.storageLimit)
    setEditedPrice(pkg.priceMonthly)
  }

  const handleSaveClick = async (id: string) => {
    // Map to backend ID
    let type: 'FREE' | 'PRO' | 'ENTERPRISE' | null = null
    if (id === 'pkg-free') type = 'FREE'
    else if (id === 'pkg-pro') type = 'PRO'
    else if (id === 'pkg-enterprise') type = 'ENTERPRISE'

    if (type) {
      const matchedPlan = dbPlans.find(p => p.planType === type)
      if (matchedPlan) {
        try {
          const limitMb = editedStorage * 1024
          await adminService.updateSubscriptionPlan(matchedPlan.id, editedPrice, limitMb)
          
          // Also update matched dbPlans in state
          setDbPlans(prev => prev.map(p => p.id === matchedPlan.id ? { ...p, price: editedPrice, storageLimitMb: limitMb } : p))
        } catch (err) {
          console.error('Failed to update plan on backend', err)
          toast.error(language === 'vi' ? 'Lưu cấu hình thất bại!' : 'Failed to save configuration!')
          return
        }
      }
    }

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

  // Count users per package id dynamically using stats from database as baseline,
  // falling back to local list counts if stats is not yet loaded
  const packageUsersCounts = useMemo(() => {
    if (stats) {
      return {
        'pkg-free': stats.freePlanUsersCount || 0,
        'pkg-pro': stats.proPlanUsersCount || 0,
        'pkg-enterprise': stats.premiumPlanUsersCount || 0,
      }
    }

    const counts: Record<string, number> = {}
    users.forEach((u) => {
      const planCode = u.plan?.toLowerCase() || 'free'
      let pkgId = 'pkg-free'
      if (planCode === 'pro') {
        pkgId = 'pkg-pro'
      } else if (planCode === 'enterprise' || planCode === 'premium') {
        pkgId = 'pkg-enterprise'
      } else if (planCode === 'free') {
        pkgId = 'pkg-free'
      } else {
        if (planCode.startsWith('pkg-')) {
          pkgId = planCode
        } else {
          pkgId = 'pkg-' + planCode
        }
      }
      counts[pkgId] = (counts[pkgId] || 0) + 1
    })
    return counts
  }, [users, stats])

  // Filter users for upgrades search
  const searchedUsers = useMemo(() => {
    if (!userSearchTerm.trim()) return []
    return users.filter(
      u =>
        u.role !== 'admin' &&
        (u.name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
         u.email.toLowerCase().includes(userSearchTerm.toLowerCase()))
    )
  }, [users, userSearchTerm])

  return (
    <div className="space-y-6 select-none text-left">
      {/* Overview Cards row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
                        <span>{(packageUsersCounts[pkg.id] || 0).toLocaleString()} {language === 'vi' ? 'người dùng' : 'active users'}</span>
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
                          <input
                            type="number"
                            value={editedPrice}
                            onChange={(e) => setEditedPrice(parseFloat(e.target.value) || 0)}
                            className="w-28 p-1.5 text-sm rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 font-bold text-slate-900 dark:text-white focus:outline-none"
                            placeholder="Price"
                          />
                          <span className="text-sm font-black text-slate-700 dark:text-slate-355">đ</span>
                          <span className="text-xs font-bold text-slate-400">
                            /{pkg.id === 'pkg-enterprise' 
                              ? (language === 'vi' ? 'năm' : 'year') 
                              : (language === 'vi' ? 'tháng' : 'month')}
                          </span>
                        </div>
                      ) : (
                        <>
                          <span className="text-3xl font-black">{pkg.priceMonthly === 0 ? '0đ' : `${pkg.priceMonthly.toLocaleString('vi-VN')}đ`}</span>
                          <span className="text-xs font-bold text-slate-400 dark:text-slate-505 font-medium ml-1">
                            /{pkg.id === 'pkg-enterprise' 
                              ? (language === 'vi' ? 'năm' : 'year') 
                              : (language === 'vi' ? 'tháng' : 'month')}
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
                <div className="mt-6 flex justify-end gap-2">
                  {!isEditing && pkg.id !== 'pkg-free' && pkg.id !== 'pkg-pro' && (
                    <Button
                      onClick={() => handleDeletePackage(pkg.id)}
                      className="bg-rose-50/50 hover:bg-rose-100 text-rose-600 dark:bg-rose-955/20 dark:hover:bg-rose-950/40 dark:text-rose-450 font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer border-none"
                    >
                      <Trash2 className="size-3.5" />
                      <span>{language === 'vi' ? 'Xóa' : 'Delete'}</span>
                    </Button>
                  )}
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

        {/* Dashed Create Card */}
        <Card
          onClick={() => setIsCreateModalOpen(true)}
          className="border-2 border-dashed border-slate-300 hover:border-blue-500 dark:border-slate-850 dark:hover:border-blue-500/80 bg-white/40 hover:bg-slate-50/50 dark:bg-slate-900/20 dark:hover:bg-slate-900/60 transition-all duration-305 rounded-[28px] flex flex-col items-center justify-center min-h-[300px] cursor-pointer group select-none animate-fade-in"
        >
          <div className="flex flex-col items-center text-center p-6 space-y-3">
            <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-955/40 text-[#3155F6] group-hover:scale-110 transition-transform duration-300">
              <Plus className="size-6" />
            </div>
            <h4 className="text-sm font-black text-slate-800 dark:text-white">
              {language === 'vi' ? 'Thêm gói cước mới' : 'Add New Package'}
            </h4>
            <p className="text-[11px] font-semibold text-slate-450 dark:text-slate-500 max-w-[180px] leading-normal">
              {language === 'vi' 
                ? 'Thiết lập dung lượng, mức giá và các quyền lợi đi kèm.' 
                : 'Configure storage space, subscription rate and custom perks.'}
            </p>
          </div>
        </Card>
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
                      const currentPlanObj = packages.find(p => {
                        const planCode = p.id === 'pkg-free' ? 'free' : p.id === 'pkg-pro' ? 'pro' : p.id === 'pkg-enterprise' ? 'enterprise' : p.id
                        return planCode === u.plan
                      })
                      const currentPlanName = currentPlanObj ? currentPlanObj.name : (u.plan || 'Free')

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
                            {u.role !== 'admin' ? (
                              <Badge className={cn(
                                "font-extrabold text-[9px] rounded-full px-2 py-0.5 uppercase tracking-wide shrink-0 select-none",
                                u.plan === 'pro' 
                                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/15"
                                  : u.plan === 'free'
                                  ? "bg-slate-100 text-slate-505 dark:bg-slate-800 dark:text-slate-450"
                                  : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/15"
                              )}>
                                {currentPlanName}
                              </Badge>
                            ) : (
                              <span className="text-slate-400 dark:text-slate-600 font-bold">-</span>
                            )}
                          </td>
                          <td className="p-3 pr-5 text-right">
                            {u.role !== 'admin' ? (
                              <select
                                value={u.plan || 'free'}
                                onChange={(e) => {
                                  const nextPlan = e.target.value
                                  onUpdateUser(u.id, { plan: nextPlan as any })
                                  const chosenPlanName = packages.find(p => {
                                    const planCode = p.id === 'pkg-free' ? 'free' : p.id === 'pkg-pro' ? 'pro' : p.id === 'pkg-enterprise' ? 'enterprise' : p.id
                                    return planCode === nextPlan
                                  })?.name || nextPlan.toUpperCase()
                                  toast.success(
                                    language === 'vi'
                                      ? `Đã chuyển ${u.name} sang gói ${chosenPlanName} thành công`
                                      : `Successfully updated ${u.name} to ${chosenPlanName} Plan`
                                  )
                                }}
                                className="px-2.5 py-1.5 text-xs font-bold rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer hover:border-blue-500 transition-colors ml-auto block"
                              >
                                {packages.map((p) => {
                                  const planCode = p.id === 'pkg-free' ? 'free' : p.id === 'pkg-pro' ? 'pro' : p.id === 'pkg-enterprise' ? 'enterprise' : p.id
                                  const priceStr = p.priceMonthly === 0 ? '0đ' : `${p.priceMonthly.toLocaleString('vi-VN')}đ`
                                  const periodStr = p.id === 'pkg-enterprise'
                                    ? (language === 'vi' ? 'năm' : 'year')
                                    : (language === 'vi' ? 'tháng' : 'month')
                                  return (
                                    <option key={p.id} value={planCode}>
                                      {p.name} ({priceStr}/{periodStr})
                                    </option>
                                  )
                                })}
                              </select>
                            ) : (
                              <span className="text-slate-400 dark:text-slate-600 font-bold pr-4">-</span>
                            )}
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

      {/* ADD NEW PACKAGE MODAL */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false)
          resetCreateForm()
        }}
        title={language === 'vi' ? 'Thêm gói cước mới' : 'Create New Package'}
        className="max-w-md"
      >
        <div className="space-y-4 text-left py-1.5 text-xs font-semibold text-slate-705 dark:text-slate-300">
          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wide">
              {language === 'vi' ? 'Tên gói cước:' : 'Package Name:'}
            </label>
            <input
              type="text"
              value={newPkgName}
              onChange={(e) => setNewPkgName(e.target.value)}
              placeholder={language === 'vi' ? 'Ví dụ: Ultimate Plan...' : 'Example: Ultimate Plan...'}
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/25 dark:border-slate-800 dark:bg-slate-950 dark:text-white font-semibold"
            />
          </div>

          {/* Storage & Price Row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Storage Limit */}
            <div className="space-y-1.5">
              <label className="text-slate-550 dark:text-slate-400 font-extrabold uppercase tracking-wide">
                {language === 'vi' ? 'Dung lượng (GB):' : 'Storage Limit (GB):'}
              </label>
              <input
                type="number"
                value={newPkgStorage}
                onChange={(e) => setNewPkgStorage(Math.max(1, parseInt(e.target.value) || 0))}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/25 dark:border-slate-800 dark:bg-slate-950 dark:text-white font-bold"
              />
            </div>

            {/* Monthly Price */}
            <div className="space-y-1.5">
              <label className="text-slate-550 dark:text-slate-400 font-extrabold uppercase tracking-wide">
                {language === 'vi' ? 'Giá gói cước (đ):' : 'Package Price (VND):'}
              </label>
              <input
                type="number"
                value={newPkgPrice}
                onChange={(e) => setNewPkgPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/25 dark:border-slate-800 dark:bg-slate-950 dark:text-white font-bold"
              />
            </div>
          </div>

          {/* Perks list builder */}
          <div className="space-y-2">
            <label className="text-slate-550 dark:text-slate-400 font-extrabold uppercase tracking-wide">
              {language === 'vi' ? 'Các tính năng / quyền lợi:' : 'Features / Perks:'}
            </label>
            
            <div className="flex gap-2">
              <input
                type="text"
                value={newPerkText}
                onChange={(e) => setNewPerkText(e.target.value)}
                placeholder={language === 'vi' ? 'Thêm quyền lợi mới...' : 'Add a new perk...'}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddPerk()
                  }
                }}
                className="flex-1 p-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white font-semibold"
              />
              <Button
                onClick={handleAddPerk}
                className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-4 rounded-xl font-extrabold text-xs hover:bg-slate-200 cursor-pointer border-none"
              >
                {language === 'vi' ? 'Thêm' : 'Add'}
              </Button>
            </div>

            {/* List of current perks */}
            <div className="space-y-1.5 max-h-32 overflow-y-auto scrollbar-thin pt-1">
              {newPkgPerks.map((perk, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-850/50">
                  <span className="truncate pr-2 font-medium">{perk}</span>
                  <button
                    type="button"
                    onClick={() => handleRemovePerk(i)}
                    className="text-rose-505 hover:text-rose-650 font-bold p-0.5 cursor-pointer"
                  >
                    {language === 'vi' ? 'Xóa' : 'Remove'}
                  </button>
                </div>
              ))}
              {newPkgPerks.length === 0 && (
                <p className="text-[10px] text-slate-400 italic">
                  {language === 'vi' ? '* Chưa có tính năng nào được thêm.' : '* No features added yet.'}
                </p>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              onClick={() => {
                setIsCreateModalOpen(false)
                resetCreateForm()
              }}
              className="bg-slate-100 text-slate-655 dark:bg-slate-800 dark:text-slate-350 font-bold px-4 py-2.5 rounded-xl text-xs cursor-pointer border-none"
            >
              {language === 'vi' ? 'Hủy' : 'Cancel'}
            </Button>
            <Button
              onClick={handleCreatePackage}
              disabled={!newPkgName.trim() || newPkgPerks.length === 0}
              className="bg-[#3155F6] hover:bg-blue-600 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-none shadow-md shadow-blue-500/10"
            >
              {language === 'vi' ? 'Tạo gói mới' : 'Create Package'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
