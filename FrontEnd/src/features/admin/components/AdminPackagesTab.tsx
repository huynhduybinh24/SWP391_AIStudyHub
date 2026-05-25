import { useState } from 'react'
import { Zap, HardDrive, Edit3, Save, TrendingUp, Users } from 'lucide-react'
import { useTranslation } from '@/context/LanguageContext'
import { useToast } from '@/components/ui/Toast'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface PackageItem {
  id: string
  name: string
  storageLimit: number // in GB
  priceMonthly: number // in VND
  usersCount: number
  perks: string[]
  color: string
}

export function AdminPackagesTab() {
  const { language } = useTranslation()
  const toast = useToast()

  const [packages, setPackages] = useState<PackageItem[]>([
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
      priceMonthly: 99000,
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
  ])

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editedStorage, setEditedStorage] = useState<number>(10)
  const [editedPrice, setEditedPrice] = useState<number>(0)

  const handleEditClick = (pkg: PackageItem) => {
    setEditingId(pkg.id)
    setEditedStorage(pkg.storageLimit)
    setEditedPrice(pkg.priceMonthly)
  }

  const handleSaveClick = (id: string) => {
    setPackages((prev) =>
      prev.map((pkg) =>
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
    )
    setEditingId(null)
    const msg = language === 'vi' ? 'Đã lưu cấu hình gói cước thành công' : 'Package config saved successfully'
    toast.success(msg)
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
                      <h3 className="text-xl font-black text-slate-850 dark:text-white leading-tight">
                        {pkg.name}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-500 dark:text-slate-450 font-bold">
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
                          <input
                            type="number"
                            value={editedPrice}
                            onChange={(e) => setEditedPrice(parseInt(e.target.value) || 0)}
                            className="w-24 p-1.5 text-sm rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 font-bold text-slate-900 dark:text-white focus:outline-none"
                            placeholder="Price"
                          />
                          <span className="text-xs font-bold text-slate-400">đ/tháng</span>
                        </div>
                      ) : (
                        <>
                          <span className="text-3xl font-black">{pkg.priceMonthly === 0 ? '0' : pkg.priceMonthly.toLocaleString()}</span>
                          <span className="text-xs font-bold text-slate-400 dark:text-slate-500 font-medium ml-1">
                            đ/{language === 'vi' ? 'tháng' : 'month'}
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
                        <span className="font-extrabold text-slate-700 dark:text-slate-300 text-sm">
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
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Save className="size-3.5" />
                      <span>{language === 'vi' ? 'Lưu' : 'Save'}</span>
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleEditClick(pkg)}
                      className="bg-slate-50 hover:bg-slate-100 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-750 dark:text-slate-300 font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer"
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
    </div>
  )
}
