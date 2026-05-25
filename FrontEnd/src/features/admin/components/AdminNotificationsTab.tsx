import { useState } from 'react'
import { Bell, Send, Trash2, ShieldAlert, Sparkles, Volume2, Info } from 'lucide-react'
import { useTranslation } from '@/context/LanguageContext'
import { useToast } from '@/components/ui/Toast'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

interface SentNotification {
  id: string
  title: string
  message: string
  type: 'system' | 'maintenance' | 'warning' | 'promotion'
  target: 'all' | 'free' | 'pro'
  sentAt: string
  recipientsCount: number
}

export function AdminNotificationsTab() {
  const { language } = useTranslation()
  const toast = useToast()

  const [notifications, setNotifications] = useState<SentNotification[]>([
    {
      id: 'ntf-1',
      title: 'Bảo trì hệ thống định kỳ tháng 6/2026',
      message: 'Hệ thống LumiEdu sẽ tạm thời gián đoạn vào lúc 02:00 sáng ngày 01/06/2026 để nâng cấp cụm máy chủ AI. Thời gian dự kiến kéo dài 2 giờ.',
      type: 'maintenance',
      target: 'all',
      sentAt: '2026-05-24 10:15',
      recipientsCount: 15248
    },
    {
      id: 'ntf-2',
      title: 'Nâng cấp dung lượng Pro lên 50GB hoàn toàn miễn phí',
      message: 'Tin vui! Tất cả tài khoản Pro hiện tại đã được nâng cấp dung lượng lưu trữ tối đa từ 40GB lên 50GB mà không tăng giá gói cước.',
      type: 'promotion',
      target: 'pro',
      sentAt: '2026-05-20 14:30',
      recipientsCount: 3842
    }
  ])

  // Form state
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [type, setType] = useState<'system' | 'maintenance' | 'warning' | 'promotion'>('system')
  const [target, setTarget] = useState<'all' | 'free' | 'pro'>('all')

  const handleSendNotification = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !message.trim()) {
      toast.error(language === 'vi' ? 'Vui lòng điền đầy đủ tiêu đề và nội dung' : 'Please fill out all fields')
      return
    }

    // Estimate recipient counts
    let recipientsCount = 15248
    if (target === 'pro') recipientsCount = 3842
    if (target === 'free') recipientsCount = 11406

    const newNtf: SentNotification = {
      id: `ntf-${Date.now()}`,
      title: title.trim(),
      message: message.trim(),
      type,
      target,
      sentAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      recipientsCount
    }

    setNotifications((prev) => [newNtf, ...prev])
    
    const targetLabel = target === 'all' 
      ? (language === 'vi' ? 'tất cả thành viên' : 'all members')
      : (target === 'pro' 
        ? (language === 'vi' ? 'thành viên Pro' : 'Pro members') 
        : (language === 'vi' ? 'thành viên Free' : 'Free members'))
    
    const successMsg = language === 'vi' 
      ? `Đã gửi thông báo thành công đến ${recipientsCount.toLocaleString()} ${targetLabel}!`
      : `Notification sent successfully to ${recipientsCount.toLocaleString()} ${targetLabel}!`
    
    toast.success(successMsg)

    // Reset Form
    setTitle('')
    setMessage('')
    setType('system')
    setTarget('all')
  }

  const handleDeleteHistory = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    const msg = language === 'vi' ? 'Đã xóa lịch sử thông báo' : 'Notification history removed'
    toast.success(msg)
  }

  const getNotificationIcon = (ntfType: SentNotification['type']) => {
    switch (ntfType) {
      case 'system':
        return <Info className="size-4 text-blue-500" />
      case 'maintenance':
        return <Volume2 className="size-4 text-indigo-500" />
      case 'warning':
        return <ShieldAlert className="size-4 text-rose-500" />
      case 'promotion':
        return <Sparkles className="size-4 text-amber-500" />
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 select-none text-left">
      {/* 1. COMPOSE NOTIFICATION FORM */}
      <div className="lg:col-span-1 space-y-4">
        <div className="flex items-center gap-2 px-1">
          <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-955/50 text-blue-600 dark:text-blue-400">
            <Bell className="size-4 stroke-[2.5]" />
          </div>
          <h2 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 tracking-tight uppercase">
            {language === 'vi' ? 'Soạn thông báo' : 'Compose Notification'}
          </h2>
        </div>

        <Card className="p-6 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 shadow-lg dark:shadow-none rounded-[28px]">
          <form onSubmit={handleSendNotification} className="space-y-4.5">
            {/* Title input */}
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-450 dark:text-slate-500 uppercase tracking-widest block">
                {language === 'vi' ? 'Tiêu đề thông báo' : 'Notification Title'}
              </label>
              <input
                type="text"
                placeholder={language === 'vi' ? 'Nhập tiêu đề tại đây...' : 'Enter notification title...'}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-3.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-655 font-semibold transition-all"
              />
            </div>

            {/* Message Text area */}
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-450 dark:text-slate-500 uppercase tracking-widest block">
                {language === 'vi' ? 'Nội dung thông báo' : 'Message Content'}
              </label>
              <textarea
                placeholder={language === 'vi' ? 'Nhập nội dung thông báo...' : 'Type notification message here...'}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full h-32 p-3.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-655 font-medium leading-relaxed resize-none transition-all"
              />
            </div>

            {/* Type selector */}
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-450 dark:text-slate-500 uppercase tracking-widest block">
                {language === 'vi' ? 'Loại thông báo' : 'Notification Type'}
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full p-3 text-xs rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 text-slate-700 dark:text-slate-300 font-bold focus:outline-none"
              >
                <option value="system">{language === 'vi' ? 'Thông báo hệ thống (System)' : 'System notification'}</option>
                <option value="maintenance">{language === 'vi' ? 'Bảo trì định kỳ (Maintenance)' : 'System maintenance'}</option>
                <option value="warning">{language === 'vi' ? 'Cảnh báo quan trọng (Warning)' : 'Urgent alert warning'}</option>
                <option value="promotion">{language === 'vi' ? 'Khuyến mãi & Tin tức (Promotion)' : 'Promotion & News'}</option>
              </select>
            </div>

            {/* Target selector */}
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-450 dark:text-slate-500 uppercase tracking-widest block">
                {language === 'vi' ? 'Đối tượng nhận' : 'Target Audience'}
              </label>
              <select
                value={target}
                onChange={(e) => setTarget(e.target.value as any)}
                className="w-full p-3 text-xs rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 text-slate-700 dark:text-slate-300 font-bold focus:outline-none"
              >
                <option value="all">{language === 'vi' ? 'Tất cả thành viên (All)' : 'All Members'}</option>
                <option value="free">{language === 'vi' ? 'Thành viên dùng Free' : 'Free tier members only'}</option>
                <option value="pro">{language === 'vi' ? 'Thành viên dùng Pro' : 'Pro tier members only'}</option>
              </select>
            </div>

            {/* Send Button */}
            <Button
              type="submit"
              className="w-full bg-[#3155F6] hover:bg-[#2563eb] text-white font-extrabold text-xs py-3 rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/10 cursor-pointer transition-all active:scale-[0.98]"
            >
              <Send className="size-3.5" />
              <span>{language === 'vi' ? 'Gửi thông báo ngay' : 'Broadcast Message'}</span>
            </Button>
          </form>
        </Card>
      </div>

      {/* 2. HISTORY LIST SENT NOTIFICATIONS */}
      <div className="lg:col-span-2 space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-955/50 text-indigo-600 dark:text-indigo-400">
              <Volume2 className="size-4 stroke-[2.5]" />
            </div>
            <h2 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 tracking-tight uppercase">
              {language === 'vi' ? 'Lịch sử thông báo đã gửi' : 'Sent broadcast history'}
            </h2>
          </div>
        </div>

        <div className="space-y-4 max-h-[580px] overflow-y-auto pr-1 scrollbar-thin">
          {notifications.length > 0 ? (
            notifications.map((ntf) => (
              <Card
                key={ntf.id}
                className="p-5 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 hover:shadow-md transition-all duration-200 rounded-[24px]"
              >
                <div className="flex items-start gap-4">
                  {/* Icon Indicator */}
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950 shrink-0 mt-0.5 border border-slate-100 dark:border-slate-850">
                    {getNotificationIcon(ntf.type)}
                  </div>

                  {/* Content details */}
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="font-extrabold text-[14px] text-slate-800 dark:text-white leading-tight pr-4">
                        {ntf.title}
                      </h3>
                      <button
                        onClick={() => handleDeleteHistory(ntf.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:text-slate-500 dark:hover:text-rose-450 dark:hover:bg-rose-955/20 transition-all cursor-pointer"
                        title={language === 'vi' ? 'Xóa lịch sử' : 'Remove history log'}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>

                    <p className="text-xs font-semibold text-slate-550 dark:text-slate-400 leading-relaxed text-justify">
                      {ntf.message}
                    </p>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 pt-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                      <span>{ntf.sentAt}</span>
                      <span>•</span>
                      <Badge className="bg-slate-105 text-slate-550 dark:bg-slate-800 dark:text-slate-400 font-extrabold text-[9px] px-2 py-0 rounded-md">
                        Target: {ntf.target.toUpperCase()}
                      </Badge>
                      <span>•</span>
                      <span className="font-extrabold text-blue-500">
                        {ntf.recipientsCount.toLocaleString()} recipients
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Card className="py-16 text-center rounded-[28px] border border-dashed border-slate-200 dark:border-slate-800">
              <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-700">
                <Bell className="size-10 stroke-[1.25] mb-2" />
                <p className="font-extrabold text-sm text-slate-700 dark:text-slate-350">
                  {language === 'vi' ? 'Chưa có thông báo nào được gửi' : 'No notifications broadcasted yet'}
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
