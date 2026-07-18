import { useState, useEffect, useCallback, useRef } from 'react'
import { Bot, Folder, ArrowRight, AtSign, Reply as ReplyIcon, Shield, Send, FileText, Calendar, Layers, RefreshCw, BellOff, AlertTriangle, Sparkles, XCircle, Trash2 } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { notificationApi, Notification, NotificationType } from '../api/notification.api'
import { getCurrentUser } from '../services/userNotificationService'
import { useTranslation } from '@/context/LanguageContext'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'


// Reusable Sub-component: Notification Card
interface NotificationCardProps {
  id: string
  type: NotificationType
  title: string
  time: string
  isRead: boolean
  description: React.ReactNode
  quote?: string
  actionText?: string
  actionUrl?: string
  avatar?: string
  buttons?: Array<{
    text: string
    variant: 'primary' | 'secondary' | 'light' | 'shared-btn'
    icon?: React.ReactNode
    onClick?: () => void
    url?: string
  }>
  isActiveReply?: boolean
  replyText?: string
  onReplyClick?: () => void
  onCancelClick?: () => void
  onSendReplyClick?: (text: string) => void
  onReplyTextChange?: (text: string) => void
  onMarkRead?: () => void
  onClick?: () => void
  onDelete?: () => void
  isConfirmingDelete?: boolean
  reason?: string
  documentName?: string
}

function NotificationCard({
  id,
  type,
  title,
  time,
  isRead,
  description,
  quote,
  actionText,
  actionUrl,
  avatar,
  buttons,
  isActiveReply,
  replyText,
  onReplyClick,
  onCancelClick,
  onSendReplyClick,
  onReplyTextChange,
  onMarkRead,
  onClick,
  onDelete,
  isConfirmingDelete,
  reason,
  documentName,
}: NotificationCardProps) {
  const navigate = useNavigate()
  const { t, language } = useTranslation()
  const [commentText, setCommentText] = useState('')
  const [isReplied, setIsReplied] = useState(false)
  const [replyContent, setReplyContent] = useState('')
  const [showReplyInput, setShowReplyInput] = useState(false)

  const [dragX, setDragX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const hasDraggedRef = useRef(false)

  const handlePointerDown = (e: React.PointerEvent) => {
    const target = e.target as HTMLElement
    if (target.closest('button') || target.closest('a') || target.closest('textarea')) {
      return
    }
    if (e.button !== 0 && e.pointerType === 'mouse') return
    setIsDragging(true)
    setStartX(e.clientX)
    hasDraggedRef.current = false
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return
    const deltaX = e.clientX - startX
    if (deltaX > 0) {
      setDragX(0)
    } else {
      setDragX(deltaX)
    }
    if (Math.abs(deltaX) > 10) {
      hasDraggedRef.current = true
    }
  }

  useEffect(() => {
    if (!isConfirmingDelete && dragX !== 0) {
      setDragX(0)
    }
  }, [isConfirmingDelete, dragX])

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return
    setIsDragging(false)
    e.currentTarget.releasePointerCapture(e.pointerId)
    if (dragX < -100) {
      setDragX(-100)
      onDelete?.()
    } else {
      setDragX(0)
    }
  }

  const handlePointerCancel = () => {
    setIsDragging(false)
    setDragX(0)
  }

  // Localize Notification contents dynamically
  const localized = (() => {
    if (id === 'ai-summary') {
      return {
        title: language === 'vi' ? 'Bản tóm tắt AI đã sẵn sàng' : language === 'ja' ? 'AIè¦ç´„ã®æº–å‚™å®Œäº†' : language === 'ko' ? 'AI ìš”ì•½ ì™„ë£Œ' : 'AI Summary Ready',
        description: (
          <>
            {language === 'vi' ? 'Bản tóm tắt toàn diện cho tài liệu ' : language === 'ja' ? 'ãƒ‰ã‚­ãƒ¥ãƒ¡ãƒ³ãƒˆ ' : language === 'ko' ? 'ë‹¤ìŒ ë¬¸ì„œì— ëŒ€í•œ í¬ê´„ì ì¸ ìš”ì•½ ' : 'The comprehensive summary for your document '}
            <strong className="font-semibold text-[#0b1c30] dark:text-slate-100">
              "Advanced Neuroscience Syllabus 2024.pdf"
            </strong>{' '}
            {language === 'vi' ? 'của bạn đã hoàn thành và sẵn sàng để xem lại.' : language === 'ja' ? 'ã®åŒ…æ‹¬çš„ãªè¦ç´„ãŒå®Œäº†ã—ã€ç¢ºèªã®æº–å‚™ãŒæ•´ã„ã¾ã—ãŸã€‚' : language === 'ko' ? 'ì´(ê°€) ì™„ë£Œë˜ì–´ ê²€í† í•  ì¤€ë¹„ê°€ ë˜ì—ˆìŠµë‹ˆë‹¤.' : 'is now complete and ready for review.'}
          </>
        ),
        actionText: language === 'vi' ? 'Xem bản tóm tắt' : language === 'ja' ? 'è¦ç´„ã‚’è¡¨ç¤º' : language === 'ko' ? 'ìš”ì•½ ë³´ê¸°' : 'View Summary',
      }
    }
    if (id === 'shared-folder') {
      return {
        title: language === 'vi' ? 'Sarah Jenkins đã chia sẻ một thư mục với bạn' : language === 'ja' ? 'Sarah Jenkins ãŒãƒ•ã‚©ãƒ«ãƒ€ãƒ¼ã‚’å…±æœ‰ã—ã¾ã—ãŸ' : language === 'ko' ? 'Sarah Jenkinsê°€ í´ë”ë¥¼ ê³µìœ í–ˆìŠµë‹ˆë‹¤' : 'Sarah Jenkins shared a folder with you',
        description: (
          <>
            {language === 'vi' ? 'Thư mục: ' : language === 'ja' ? 'ãƒ•ã‚©ãƒ«ãƒ€ãƒ¼: ' : language === 'ko' ? 'í´ë”: ' : 'Folder: ' }
            <span className="font-semibold text-[#0b1c30] dark:text-slate-100">Group Project Research Materials</span>
          </>
        ),
      }
    }
    if (id === 'emily') {
      return {
        title: language === 'vi' ? 'Emily R. đã nhắc đến bạn' : language === 'ja' ? 'Emily R. ãŒã‚ãªãŸã‚’ãƒ¡ãƒ³ã‚·ãƒ§ãƒ³ã—ã¾ã—ãŸ' : language === 'ko' ? 'Emily R.ë‹˜ì´ ë‹¹ì‹ ì„ ì–¸ê¸‰í–ˆìŠµë‹ˆë‹¤' : 'Emily R. mentioned you',
        description: (
          <>
            <span className="text-[#3155F6] dark:text-blue-400 font-semibold">@User</span>
            {language === 'vi'
              ? ', bạn nghĩ thế nào về phần phương pháp luận ở trang 4 của bài báo "Cognitive Science"?'
              : language === 'ja'
              ? 'ã€"Cognitive Science"ã®è«–æ–‡ì˜ 4ãƒšãƒ¼ã‚¸ç›®ã«ã‚ã‚‹æ–¹æ³•è«–ã‚»ã‚¯ã‚·ãƒ§ãƒ³ã«ã¤ã„ã¦ã©ã†æ€ã„ã¾ã™ã‹ï¼Ÿ'
              : language === 'ko'
              ? 'ë‹˜, "Cognitive Science" ë…¼ë¬¸ì˜ 4íŽ˜ì´ì§€ ë°©ë²•ë¡  ì„¹ì…˜ì— ëŒ€í•´ ì–´ë–»ê²Œ ìƒê°í•˜ì‹œë‚˜ìš”?'
              : ", what do you think about the methodology section on page 4 of the 'Cognitive Science' paper?"}
          </>
        ),
        actionText: language === 'vi' ? 'Phản hồi' : language === 'ja' ? 'è¿”ä¿¡' : language === 'ko' ? 'ë‹µìž¥' : 'Reply',
      }
    }
    if (id === 'all-3') {
      return {
        title: language === 'vi' ? 'Đã nhắc đến bạn' : language === 'ja' ? 'ã ‚ã ªã Ÿã‚’ãƒ¡ãƒ³ã‚·ãƒ§ãƒ³ã —ã ¾ã —ã Ÿ' : language === 'ko' ? 'ì–¸ê¸‰ë ¨' : 'Mentioned You',
        description: (
          <>
            {language === 'vi'
              ? 'Emily R. đã nhắc đến bạn trong má»™t bÃ¬nh luáº­n á»Ÿ '
              : language === 'ja'
              ? 'Emily R. ãŒã‚³ãƒ¡ãƒ³ãƒˆã§ã‚ãªãŸã‚’ãƒ¡ãƒ³ã‚·ãƒ§ãƒ³ã—ã¾ã—ãŸï¼š'
              : language === 'ko'
              ? 'Emily R.ë‹˜ì´ ë‹¤ìŒ ë¬¸ì„œì˜ ëŒ“ê¸€ì—ì„œ ë‹¹ì‹ ì„ ì–¸ê¸‰í–ˆìŠµë‹ˆë‹¤: '
              : 'Emily R. mentioned you in a comment on '}
            <span className="text-[#3155F6] dark:text-blue-400 hover:underline cursor-pointer font-semibold">
              {language === 'vi' ? 'Ghi chú bài giảng Tuần 4.' : language === 'ja' ? 'è¬›ç¾©ãƒŽãƒ¼ãƒˆç¬¬4é€±ã€‚' : language === 'ko' ? 'ê°•ì˜ ë…¸íŠ¸ 4ì£¼ì°¨.' : 'Lecture Notes Week 4.'}
            </span>
          </>
        ),
        quote: language === 'vi'
          ? '@You bạn có thể xác minh các công thức được sử dụng trong phần 3 không? Chúng có vẻ hơi khác so với sách giáo khoa.'
          : language === 'ja'
          ? '@You ã‚»ã‚¯ã‚·ãƒ§ãƒ³3ã§ä½¿ç”¨ã•ã‚Œã¦ã„ã‚‹æ•°å¼ã‚’ç¢ºèªã—ã¦ã„ãŸã ã‘ã¾ã™ã‹ï¼Ÿæ•™ç§‘æ›¸ã¨å°‘ã—ç•°ãªã‚‹ã‚ˆã†ã§ã™ã€‚'
          : language === 'ko'
          ? '@You ì„¹ì…˜ 3ì— ì‚¬ìš©ëœ ê³µì‹ì„ í™•ì¸í•´ ì£¼ì‹œê² ìŠµë‹ˆê¹Œ? êµê³¼ì„œì™€ ì•½ê°„ ë‹¤ë¥¸ ê²ƒ ê°™ìŠµë‹ˆë‹¤.'
          : '@You could you verify the formulas used in section 3? They seem slightly different from the textbook.',
        actionText: language === 'vi' ? 'Phản hồi' : language === 'ja' ? 'è¿”ä¿¡' : language === 'ko' ? 'ë‹µìž¥' : 'Reply',
      }
    }
    if (id === 'security-alert') {
      return {
        title: language === 'vi' ? 'Cảnh báo bảo mật: Đăng nhập mới' : language === 'ja' ? 'ã‚»ã‚­ãƒ¥ãƒªãƒ†ã‚£è­¦å‘Š: æ–°è¦ ãƒ­ã‚°ã‚¤ãƒ³' : language === 'ko' ? 'ë³´ì•ˆ ê²½ê³ : ìƒˆë¡œìš´ ë¡œê·¸ì ¸' : 'Security Alert: New Login',
        description: (
          <>
            {language === 'vi'
              ? 'Một đăng nhập mới đã được phát hiện trên tài khoản của bạn từ trình duyệt Chrome trên thiết bị MacOS. Nếu đây không phải là bạn, vui lòng bảo mật tài khoản ngay lập tức.'
              : language === 'ja'
              ? 'MacOSãƒ‡ãƒã‚¤ã‚¹ã®Chromeãƒ–ãƒ©ã‚¦ã‚¶ã‹ã‚‰ã‚¢ã‚«ã‚¦ãƒ³ãƒˆã¸ã®æ–°ã—ã„ãƒ­ã‚°ã‚¤ãƒ³ãŒæ¤œå‡ºã•ã‚Œã¾ã—ãŸã€‚ã“ã‚ŒãŒã”è‡ªèº«ã§ãªã„å ´åˆã¯ã€ã™ãã«ã‚¢ã‚«ã‚¦ãƒ³ãƒˆã‚’ä¿è­·ã—ã¦ãã ã•ã„ã€‚'
              : language === 'ko'
              ? 'MacOS ê¸°ê¸°ì˜ Chrome ë¸Œë¼ìš°ì €ì—ì„œ ê³„ì •ì— ëŒ€í•œ ìƒˆë¡œìš´ ë¡œê·¸ì¸ì´ ê°ì§€ë˜ì—ˆìŠµë‹ˆë‹¤. ë³¸ì¸ì´ ì•„ë‹Œ ê²½ìš° ì¦‰ì‹œ ê³„ì •ì„ ë³´í˜¸í•˜ì‹­ì‹œì˜¤.'
              : 'A new login was detected on your account from a Chrome browser on a MacOS device. If this wasn\'t you, please secure your account immediately.'}
          </>
        ),
      }
    }
    if (id === 'study-plan') {
      return {
        title: language === 'vi' ? 'Đã tạo kế hoạch học tập' : language === 'ja' ? 'å­¦ç¿’è¨ˆç”»ã Œä½œæˆ ã •ã‚Œã ¾ã —ã Ÿ' : language === 'ko' ? 'í•™ìŠµ ê³„íš  ìƒ ì„±ë ¨' : 'Study Plan Generated',
        description: (
          <>
            {language === 'vi'
              ? 'AI đã tạo một kế hoạch học tập 4 tuần được cá nhân hóa cho '
              : language === 'ja'
              ? 'AIãŒãƒ‘ãƒ¼ã‚½ãƒŠãƒ©ã‚¤ã‚ºã•ã‚ŒãŸ4é€±é–“ã®å­¦ç¿’è¨ˆç”»ã‚’ä½œæˆã—ã¾ã—ãŸï¼š'
              : language === 'ko'
              ? 'AIê°€ ë‹¤ìŒ ê³¼ëª©ì— ëŒ€í•œ ë§žì¶¤í˜• 4ì£¼ í•™ìŠµ ê³„íšì„ ìƒì„±í–ˆìŠµë‹ˆë‹¤: '
              : 'AI has created a personalized 4-week study plan for '}
            <strong className="font-semibold text-[#0b1c30] dark:text-slate-100">
              {language === 'vi' ? '"Hóa hữu cơ"' : language === 'ja' ? 'ã€Œæœ‰æ©ŸåŒ–å­¦ã€' : language === 'ko' ? '"ìœ ê¸° í™”í•™"' : '"Organic Chemistry"'}
            </strong>{' '}
            {language === 'vi'
              ? 'dựa trên các tệp bạn đã tải lên gần đây.'
              : language === 'ja'
              ? 'ï¼ˆæœ€è¿‘ã®ã‚¢ãƒƒãƒ—ãƒ­ãƒ¼ãƒ‰ã«åŸºã¥ãï¼‰ã€‚'
              : language === 'ko'
              ? ' (ìµœê·¼ ì—…ë¡œë“œ ê¸°ì¤€).'
              : 'based on your recent uploads.'}
          </>
        ),
      }
    }
    if (id === 'mention-2') {
      return {
        title: language === 'vi' ? 'Sarah Mitchell đã nhắc đến bạn' : language === 'ja' ? 'Sarah Mitchell ãŒã‚ãªãŸã‚’ãƒ¡ãƒ³ã‚·ãƒ§ãƒ³ã—ã¾ã—ãŸ' : language === 'ko' ? 'Sarah Mitchellë‹˜ì´ ë‹¹ì‹ ì„ ì–¸ê¸‰í–ˆìŠµë‹ˆë‹¤' : 'Sarah Mitchell mentioned you',
        description: (
          <>
            {language === 'vi'
              ? 'Sarah Mitchell đã nhắc đến bạn trong má»™t bÃ¬nh luáº­n á»Ÿ '
              : language === 'ja'
              ? 'Sarah Mitchell ãŒã‚³ãƒ¡ãƒ³ãƒˆã§ã‚ãªãŸã‚’ãƒ¡ãƒ³ã‚·ãƒ§ãƒ³ã—ã¾ã—ãŸï¼š'
              : language === 'ko'
              ? 'Sarah Mitchellë‹˜ì´ ë‹¤ìŒ ë¬¸ì„œì˜ ëŒ“ê¸€ì—ì„œ ë‹¹ì‹ ì„ ì–¸ê¸‰í–ˆìŠµë‹ˆë‹¤: '
              : "Sarah Mitchell mentioned you in a comment on "}
            <strong className="font-semibold text-[#0b1c30] dark:text-slate-100">
              'Neuroscience_Ch4_Syn...'
            </strong>
            {language === 'vi'
              ? ': "@Sarah Mitchell, hãy kiểm tra sơ đồ tính dẻo của khớp thần kinh ở trang 12."'
              : language === 'ja'
              ? ': ã€Œ@Sarah Mitchellã€12ãƒšãƒ¼ã‚¸ã®ã‚·ãƒŠãƒ—ã‚¹å¯å¡‘æ€§å›³ã‚’ç¢ºèªã—ã¦ãã ã•ã„ã€‚ã€'
              : language === 'ko'
              ? ': "@Sarah Mitchell, 12íŽ˜ì´ì§€ì˜ ì‹œëƒ…ìŠ¤ ê°€ì†Œì„± ë‹¤ì´ì–´ê·¸ëž¨ì„ í™•ì¸í•˜ì„¸ìš”."'
              : ': "@Sarah Mitchell, check the synaptic plasticity diagram on page 12."'}
          </>
        ),
        actionText: language === 'vi' ? 'Xem bình luận' : language === 'ja' ? 'ã‚³ãƒ¡ãƒ³ãƒˆã‚’è¡¨ç¤º' : language === 'ko' ? 'ëŒ“ê¸€ ë³´ê¸°' : 'View Comment',
      }
    }
    if (id === 'shared-doc-1') {
      return {
        title: language === 'vi' ? 'Alex Chen đã chia sẻ một tài liệu' : language === 'ja' ? 'Alex Chen ãŒãƒ‰ã‚­ãƒ¥ãƒ¡ãƒ³ãƒˆã‚’å…±æœ‰ã—ã¾ã—ãŸ' : language === 'ko' ? 'Alex Chenë‹˜ì´ ë¬¸ì„œë¥¼ ê³µìœ í–ˆìŠµë‹ˆë‹¤' : 'Alex Chen shared a document',
        description: (
          <>
            {language === 'vi' ? 'Tài liệu: ' : language === 'ja' ? 'ãƒ‰ã‚­ãƒ¥ãƒ¡ãƒ³ãƒˆ: ' : language === 'ko' ? 'ë¬¸ì„œ: ' : 'Document: '}
            <span className="font-semibold text-[#0b1c30] dark:text-slate-100">Advanced Neuroscience Syllabus 2024.pdf</span>
          </>
        ),
      }
    }
    if (id === 'flashcards') {
      return {
        title: language === 'vi' ? 'Có thẻ ghi nhớ mới' : language === 'ja' ? 'æ–°ã—ã„ãƒ•ãƒ©ãƒƒã‚·ãƒ¥ã‚«ãƒ¼ãƒ‰ãŒã‚ã‚Šã¾ã™' : language === 'ko' ? 'ìƒˆë¡œìš´ í”Œëž˜ì‹œì¹´ë“œ ì‚¬ìš© ê°€ëŠ¥' : 'New Flashcards Available',
        description: (
          <>
            {language === 'vi'
              ? '25 thẻ ghi nhớ mới đã được tạo tự động cho '
              : language === 'ja'
              ? 'ã«å¯¾ã—ã¦25æžšã®æ–°ã—ã„ãƒ•ãƒ©ãƒƒã‚·ãƒ¥ã‚«ãƒ¼ãƒ‰ãŒè‡ªå‹•çš„ã«ç”Ÿæˆã•ã‚Œã¾ã—ãŸï¼š'
              : language === 'ko'
              ? 'ì— ëŒ€í•´ 25ê°œì˜ ìƒˆë¡œìš´ í”Œëž˜ì‹œì¹´ë“œê°€ ìžë™ìœ¼ë¡œ ìƒì„±ë˜ì—ˆìŠµë‹ˆë‹¤: '
              : '25 new flashcards have been automatically generated for '}
            <strong className="font-semibold text-[#0b1c30] dark:text-slate-100">
              {language === 'vi' ? '"Sinh học tế bào - Tuần 4"' : language === 'ja' ? 'ã€Œç´°èƒžç”Ÿç‰©å­¦ - ç¬¬4é€±ã€ ' : language === 'ko' ? '"ì„¸í ¬ ìƒ ë¬¼í•™ - 4ì£¼ì°¨"' : '"Cell Biology - Week 4"'}
            </strong>
            {language === 'vi' ? '.' : ''}
          </>
        ),
      }
    }
    if (id === 'new-report-submitted') {
      return {
        title: language === 'vi' ? 'Có báo cáo mới' : language === 'ja' ? 'æ–°ã—ã„å ±å‘ŠãŒé€ä¿¡ã•ã‚Œã¾ã—ãŸ' : language === 'ko' ? 'ìƒˆ ë³´ê³ ì„œ ì œì¶œë¨' : 'New report submitted',
        description: language === 'vi' ? 'Một người dùng đã báo cáo tài liệu vì đạo văn.' : language === 'ja' ? 'ãƒ¦ãƒ¼ã‚¶ãƒ¼ã Œãƒ‰ã‚­ãƒ¥ãƒ¡ãƒ³ãƒˆì ˜ ç›—ç”¨ã‚’å ±å‘Šã —ã ¾ã —ã Ÿã€‚' : language === 'ko' ? 'ì‚¬ìš©ìž ê°€ í‘œì ˆë¡œ ë¬¸ì„œë¥¼ ì‹ ê³ í–ˆìŠµë‹ˆë‹¤.' : 'A user reported a document for plagiarism.',
      }
    }
    if (id === 'ai-audit-flagged') {
      return {
        title: language === 'vi' ? 'AI phát hiện tài liệu đáng ngờ' : language === 'ja' ? 'AIç›£æŸ»ãƒ•ãƒ©ã‚°æ¤œå‡º' : language === 'ko' ? 'AI ì‹¬ì‚¬ í”Œëž˜ê·¸ ê° ì§€ë ¨' : 'AI audit flagged a document',
        description: language === 'vi' ? 'AI Guard đã phát hiện vi phạm chính sách tiềm ẩn.' : language === 'ja' ? 'AI Guardã Œæ½œåœ¨çš„ã ªãƒ ãƒªã‚·ãƒ¼é •å  ã‚’æ¤œå‡ºã —ã ¾ã —ã Ÿã€‚' : language === 'ko' ? 'AI Guardê°€ ìž ìž¬ì  ì ¸ ì •ì±… ìœ„ë°˜ì „ ê° ì§€í–ˆìŠµë‹ˆë‹¤.' : 'AI Guard detected a potential policy violation.',
      }
    }
    if (id === 'system-status-updated') {
      return {
        title: language === 'vi' ? 'Trạng thái hệ thống đã cập nhật' : language === 'ja' ? 'ã‚·ã‚¹ãƒ†ãƒ ã‚¹ãƒ†ãƒ¼ã‚¿ã‚¹æ›´æ–°' : language === 'ko' ? 'ì‹œìŠ¤í…œ ìƒíƒœ ì—…ë°ì´íŠ¸ë¨' : 'System status updated',
        description: language === 'vi' ? 'Chế độ bảo trì hoặc trạng thái sự cố đã được thay đổi.' : language === 'ja' ? 'ãƒ¡ãƒ³ãƒ†ãƒŠãƒ³ã‚¹ãƒ¢ãƒ¼ãƒ‰ã¾ãŸã¯ã‚¤ãƒ³ã‚·ãƒ‡ãƒ³ãƒˆã‚¹ãƒ†ãƒ¼ã‚¿ã‚¹ãŒå¤‰æ›´ã•ã‚Œã¾ã—ãŸã€‚' : language === 'ko' ? 'ìœ ì§€ ê´€ë¦¬ ëª¨ë“œ ë˜ëŠ” ìž¥ì•  ìƒíƒœê°€ ë³€ê²½ë˜ì—ˆìŠµë‹ˆë‹¤.' : 'Maintenance mode or incident status was changed.',
      }
    }
    if (type === 'document_deleted' || type === 'document_rejected') {
      const docName = documentName || (() => {
        if (typeof description === 'string') {
          const dMatch = description.match(/"([^"]+)"/);
          return dMatch ? dMatch[1] : '';
        }
        return '';
      })() || 'Unknown Document';

      const reasonText = reason?.trim() || (() => {
        if (typeof description === 'string') {
          const rMatch = description.match(/Reason:\s*(.*)$/);
          return rMatch ? rMatch[1].trim() : '';
        }
        return '';
      })() || (language === 'vi' ? 'Chưa có lý do chi tiết.' : 'No reason details were provided.');

      return {
        title: type === 'document_deleted'
          ? (language === 'vi' ? 'Tài liệu đã bị quản trị viên xóa' : 'Document removed by admin')
          : (language === 'vi' ? 'Tài liệu đã bị quản trị viên từ chối' : 'Document rejected by admin'),
        description: (
          <>
            {language === 'vi'
              ? `Tài liệu "${docName}" của bạn đã bị quản trị viên ${type === 'document_deleted' ? 'xóa' : 'từ chối'}. Lý do: ${reasonText}`
              : `Your document "${docName}" was ${type === 'document_deleted' ? 'removed' : 'rejected'} by admin. Reason: ${reasonText}`}
          </>
        ),
      }
    }
    return {
      title,
      description,
      quote,
      actionText
    }
  })()

  const finalTitle = localized.title
  const finalDescription = localized.description
  const finalQuote = localized.quote ?? quote
  const finalActionText = localized.actionText ?? actionText

  const formatTime = (tString: string) => {
    if (tString.endsWith('m ago')) {
      const mins = tString.split('m')[0]
      return language === 'vi' ? `${mins} phút trước` : language === 'ja' ? `${mins}åˆ†å‰` : language === 'ko' ? `${mins}ë¶„ ì „` : `${mins}m ago`
    }
    if (tString.endsWith('h ago')) {
      const hours = tString.split('h')[0]
      return language === 'vi' ? `${hours} giá» trÆ°á»›c` : language === 'ja' ? `${hours}æ™‚é–“å‰` : language === 'ko' ? `${hours}ì‹œê°„ ì „` : `${hours}h ago`
    }
    if (tString === 'Yesterday') {
      return t.common.yesterday
    }
    return tString
  }

  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onMarkRead?.()
    if (finalActionText === 'Reply' || finalActionText === 'Phản hồi' || finalActionText === 'è¿”ä¿¡' || finalActionText === 'ë‹µìž¥') {
      if (onReplyClick) {
        onReplyClick()
      } else {
        setShowReplyInput(true)
      }
    } else if (actionUrl) {
      navigate(actionUrl)
    }
  }

  const handleReplySubmit = () => {
    if (commentText.trim()) {
      setReplyContent(commentText)
      setIsReplied(true)
      setCommentText('')
    }
  }

  return (
    <div className="relative overflow-hidden w-full select-none rounded-2xl">
      {/* Red Action Underlayer for Swipe-to-delete */}
      <div
        className="absolute inset-y-0 inset-x-0 bg-gradient-to-l from-rose-600 to-rose-500 flex items-center justify-end px-8 rounded-2xl gap-2 text-white font-bold text-sm pointer-events-none"
        style={{ display: dragX < 0 ? 'flex' : 'none' }}
      >
        <Trash2 className="w-5 h-5 animate-pulse" />
        <span>{language === 'vi' ? 'Xóa' : 'Delete'}</span>
      </div>

      {/* Card Inner Panel */}
      <div
        className={cn(
          "group border rounded-2xl p-6 shadow-sm flex gap-5 transition-all duration-200 hover:shadow-md cursor-grab active:cursor-grabbing",
          !isRead
            ? "bg-blue-50/20 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/50"
            : "bg-white dark:bg-slate-900 border-[rgba(195,198,215,0.4)] dark:border-slate-800"
        )}
        style={{
          transform: `translateX(${dragX}px)`,
          transition: isDragging ? 'none' : 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          touchAction: 'pan-y'
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onClick={(e) => {
          if (hasDraggedRef.current) {
            e.preventDefault()
            e.stopPropagation()
            return
          }
          if (dragX !== 0) {
            setDragX(0)
            return
          }
          onMarkRead?.()
          onClick?.()
        }}
      >
      {/* Icon/Avatar Container */}
      <div className="flex-shrink-0">
        {avatar ? (
          <img
            src={avatar}
            alt={finalTitle}
            className="w-12 h-12 rounded-full object-cover border border-slate-100 dark:border-slate-800"
            onError={(e) => {
              e.currentTarget.src = '/logo.png'
            }}
          />
        ) : (
          <div className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center",
            type === 'security' ? "bg-[#FFF0F0] dark:bg-red-950/40"
            : (type === 'document_deleted' || type === 'document_rejected') ? "bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20"
            : "bg-[#E8EEFF] dark:bg-blue-950/40"
          )}>
            {type === 'ai' && <Bot className="w-6 h-6 text-[#3155F6] dark:text-blue-400" />}
            {type === 'folder' && <Folder className="w-6 h-6 text-[#3155F6] dark:text-blue-400" />}
            {type === 'mention' && <AtSign className="w-6 h-6 text-[#3155F6] dark:text-blue-400" />}
            {type === 'security' && <Shield className="w-6 h-6 text-[#EF4444] dark:text-red-400" />}
            {type === 'document' && <FileText className="w-6 h-6 text-[#3155F6] dark:text-blue-400" />}
            {type === 'calendar' && <Calendar className="w-6 h-6 text-[#3155F6] dark:text-blue-400" />}
            {type === 'flashcard' && <Layers className="w-6 h-6 text-[#3155F6] dark:text-blue-400" />}
            {type === 'document_deleted' && <AlertTriangle className="w-6 h-6 text-rose-500 dark:text-rose-400" />}
            {type === 'document_rejected' && <XCircle className="w-6 h-6 text-rose-500 dark:text-rose-400" />}
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-grow min-w-0">
        <div className="flex items-center justify-between mb-1.5">
          <h2 className="text-lg font-bold text-[#0b1c30] dark:text-slate-100">{finalTitle}</h2>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#737686] dark:text-slate-400">
            <span>{formatTime(time)}</span>
            {!isRead && (
              <>
                <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                <span className="text-[#3155F6] dark:text-blue-400">
                  {language === 'vi' ? 'Mới' : language === 'ja' ? 'æ–°è¦' : language === 'ko' ? 'ìƒˆë¡œìš´' : 'New'}
                </span>
                <span className="w-2 h-2 rounded-full bg-[#3155F6] dark:bg-blue-500" />
              </>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  e.preventDefault()
                  console.log("[Notifications] delete clicked", id)
                  onDelete()
                }}
                className="notification-delete-button text-slate-400 hover:text-rose-500 md:opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-850 cursor-pointer ml-1 animate-fadeIn flex items-center justify-center shrink-0 w-8 h-8 select-none z-30"
                title={t.notificationsPage.deleteAriaLabel}
                aria-label={t.notificationsPage.deleteAriaLabel}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="text-sm text-[#434655] dark:text-slate-300 leading-relaxed">
          {finalDescription}
        </div>

        {/* Optional Quote Block */}
        {finalQuote && (
          <div className="bg-[#F4F7FE] dark:bg-slate-950 border border-[#E8EEFF] dark:border-slate-800 p-3.5 rounded-xl mt-3.5 text-sm italic text-[#434655] dark:text-slate-400 leading-relaxed">
            {finalQuote}
          </div>
        )}

        {buttons && buttons.length > 0 ? (
          <div className="flex items-center gap-3 mt-4">
            {buttons.map((btn, index) => {
              // Localize button text
              let localizedBtnText = btn.text
              if (id === 'shared-folder' && btn.text === 'Open Folder') {
                localizedBtnText = language === 'vi' ? 'Mở thư mục' : language === 'ja' ? 'ãƒ•ã‚©ãƒ«ãƒ€ãƒ¼ã‚’é–‹ã' : language === 'ko' ? 'í´ë” ì—´ê¸°' : 'Open Folder'
              } else if (id === 'security-alert') {
                if (btn.text === 'Review Activity') {
                  localizedBtnText = language === 'vi' ? 'Xem lại hoạt động' : language === 'ja' ? 'ã‚¢ã‚¯ãƒ†ã‚£ãƒ“ãƒ†ã‚£ã‚’ç¢ºèª' : language === 'ko' ? 'í™œë™ ê²€í† ' : 'Review Activity'
                } else if (btn.text === 'It was me') {
                  localizedBtnText = language === 'vi' ? 'Chính là tôi' : language === 'ja' ? 'ç§ã§ã™' : language === 'ko' ? 'ë³¸ì¸ìž…ë‹ˆë‹¤' : 'It was me'
                }
              } else if (id === 'study-plan' && btn.text === 'Open Plan') {
                localizedBtnText = language === 'vi' ? 'Mở kế hoạch' : language === 'ja' ? 'è¨ˆç”»ã‚’é–‹ã' : language === 'ko' ? 'ê³„íš ì—´ê¸°' : 'Open Plan'
              } else if (id === 'shared-doc-1' && btn.text === 'View Document') {
                localizedBtnText = language === 'vi' ? 'Xem tài liệu' : language === 'ja' ? 'ãƒ‰ã‚­ãƒ¥ãƒ¡ãƒ³ãƒˆã‚’è¡¨ç¤º' : language === 'ko' ? 'ë¬¸ì„œ ë³´ê¸°' : 'View Document'
              } else if (btn.text === 'Xem tài liệu' || btn.text === 'View Document') {
                localizedBtnText = language === 'vi' ? 'Xem tài liệu' : language === 'ja' ? 'ãƒ‰ã‚­ãƒ¥ãƒ¡ãƒ³ãƒˆã‚’è¡¨ç¤º' : language === 'ko' ? 'ë¬¸ì„œ ë³´ê¸°' : 'View Document'
              } else if (id === 'flashcards' && btn.text === 'Practice Now') {
                localizedBtnText = language === 'vi' ? 'Luyện tập ngay' : language === 'ja' ? 'ä»Šã™ãç·´ç¿’' : language === 'ko' ? 'ì§€ê¸ˆ ì—°ìŠµí•˜ê¸°' : 'Practice Now'
              }

              return (
                <button
                  key={index}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onMarkRead?.()
                    if (btn.onClick) {
                      btn.onClick()
                    } else if (btn.url) {
                      navigate(btn.url)
                    }
                  }}
                  className={cn(
                    "px-5 py-2.5 text-sm font-semibold rounded-xl transition-colors cursor-pointer border flex items-center gap-1.5",
                    btn.variant === 'primary' && "bg-[#3155F6] hover:bg-[#2563eb] text-white border-[#3155F6] shadow-sm shadow-[#3155F6]/10 dark:bg-blue-600 dark:hover:bg-blue-500 dark:border-blue-600",
                    btn.variant === 'secondary' && "bg-[#E8EEFF] hover:bg-[#D4E5FF] text-[#3155F6] border-[#E8EEFF] dark:bg-blue-950/40 dark:hover:bg-blue-900/40 dark:text-blue-400 dark:border-blue-950/40",
                    btn.variant === 'light' && "bg-[#F4F7FE] hover:bg-slate-100 text-[#0b1c30] border-[rgba(195,198,215,0.4)] dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100 dark:border-slate-700",
                    btn.variant === 'shared-btn' && "bg-[#F0F4FF] hover:bg-[#E5EEFF] text-[#3155F6] border-none px-4 py-2 text-xs font-semibold rounded-lg shadow-none dark:bg-blue-950/40 dark:hover:bg-blue-900/40 dark:text-blue-400"
                  )}
                >
                  <span>{localizedBtnText}</span>
                  {btn.icon && btn.icon}
                </button>
              )
            })}
          </div>
        ) : finalActionText && !showReplyInput && !isReplied && !isActiveReply ? (
          <div>
            <button
              type="button"
              onClick={handleActionClick}
              className="inline-flex items-center gap-1.5 bg-[#E8EEFF] hover:bg-[#D4E5FF] text-[#3155F6] px-5 py-2.5 rounded-xl text-sm font-semibold mt-4 transition-colors cursor-pointer border border-[#E8EEFF] dark:bg-blue-950/40 dark:hover:bg-blue-900/40 dark:text-blue-400 dark:border-blue-950/40"
            >
              <span>{finalActionText}</span>
              {finalActionText === 'Reply' || finalActionText === 'Phản hồi' || finalActionText === 'è¿”ä¿¡' || finalActionText === 'ë‹µìž¥' ? (
                <ReplyIcon className="w-3.5 h-3.5" />
              ) : (
                <ArrowRight className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        ) : null}

        {/* Parent-controlled Active Reply Box */}
        {isActiveReply && (
          <div className="mt-3.5 flex flex-col gap-3.5 w-full" onClick={(e) => e.stopPropagation()}>
            <textarea
              placeholder={language === 'vi' ? 'Nhập phản hồi của bạn ở đây...' : language === 'ja' ? 'è¿”ä¿¡ã‚’å…¥åŠ›ã —ã ¦ã  ã  ã •ã „...' : language === 'ko' ? 'ì—¬ê¸°ì—  ë‹µìž¥ì „ ìž…ë ¥í•˜ì„¸ìš”...' : 'Type your reply here...'}
              value={replyText || ''}
              onChange={(e) => onReplyTextChange?.(e.target.value)}
              className="w-full bg-[#F4F7FE]/70 dark:bg-slate-950/70 border border-[#E8EEFF] dark:border-slate-800 rounded-2xl p-4 text-sm text-[#0b1c30] dark:text-slate-100 placeholder-[#737686] dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#3155F6]/15 resize-none h-[100px]"
            />
            <div className="flex items-center justify-end gap-3 w-full">
              <button
                type="button"
                onClick={onCancelClick}
                className="bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800 text-[#434655] dark:text-slate-400 hover:text-[#0b1c30] dark:hover:text-slate-200 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
              >
                {t.common.cancel}
              </button>
              <button
                type="button"
                onClick={() => onSendReplyClick?.(replyText || '')}
                className="bg-[#3155F6] hover:bg-[#2563eb] text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-[#3155F6] shadow-sm shadow-[#3155F6]/10 dark:bg-blue-600 dark:hover:bg-blue-500 dark:border-blue-600"
              >
                <span>{language === 'vi' ? 'Gửi phản hồi' : language === 'ja' ? 'è¿”ä¿¡ã‚’é€ ä¿¡' : language === 'ko' ? 'ë‹µìž¥ ì „ì†¡' : 'Send Reply'}</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Reply Input Form */}
        {showReplyInput && !isReplied && (
          <div className="mt-4.5 relative" onClick={(e) => e.stopPropagation()}>
            <textarea
              placeholder={language === 'vi' ? 'Nhập phản hồi...' : language === 'ja' ? 'è¿”ä¿¡ã‚’å…¥åŠ›...' : language === 'ko' ? 'ë‹µìž¥ ìž…ë ¥...' : 'Type a reply...'}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleReplySubmit()
                }
              }}
              className="w-full border border-[rgba(195,198,215,0.6)] dark:border-slate-800 rounded-xl p-3.5 pr-20 text-sm text-foreground placeholder-[#737686] dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#3155F6]/30 resize-none h-18 bg-white dark:bg-slate-950"
            />
            <button
              type="button"
              onClick={handleReplySubmit}
              disabled={!commentText.trim()}
              className="absolute bottom-3 right-3 bg-[#3155F6] hover:bg-[#2563eb] dark:bg-blue-600 dark:hover:bg-blue-500 text-white px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
            >
              {language === 'vi' ? 'Phản hồi' : language === 'ja' ? 'è¿”ä¿¡' : language === 'ko' ? 'ë‹µìž¥' : 'Reply'}
            </button>
          </div>
        )}

        {/* Replied Message Display */}
        {isReplied && (
          <div className="mt-4 flex gap-3" onClick={(e) => e.stopPropagation()}>
            <div className="w-8 h-8 rounded-full bg-[#3155F6] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {language === 'vi' ? 'Tôi' : language === 'ja' ? 'è‡ªåˆ†' : language === 'ko' ? 'ë‚˜' : 'Me'}
            </div>
            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl rounded-tl-none p-3.5 text-sm text-[#434655] dark:text-slate-300">
              {replyContent}
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
  )
}

export function NotificationsPage() {

  const { t, language } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()

  const tabs = ['All', 'Unread', 'Mentions', 'Shared Files', 'AI Updates']

  const filterParam = searchParams.get('filter') || 'all'
  const [activeFilter, setActiveFilter] = useState(filterParam)

  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [activeReplyId, setActiveReplyId] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [selectedDetailNotification, setSelectedDetailNotification] = useState<Notification | null>(null)
  const [showUndoToast, setShowUndoToast] = useState(false)
  const [lastDeletedNotification, setLastDeletedNotification] = useState<Notification | null>(null)
  const [undoTimeoutId, setUndoTimeoutId] = useState<any>(null)
  const [notificationToDelete, setNotificationToDelete] = useState<Notification | null>(null)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)

  const getTabLabel = (tab: string) => {
    switch (tab) {
      case 'All':
        return t.common.all
      case 'Unread':
        return language === 'vi' ? 'Chưa đọc' : language === 'ja' ? 'æœªèª­' : language === 'ko' ? 'ì ½ì§€ ì•Šì Œ' : 'Unread'
      case 'Mentions':
        return language === 'vi' ? 'Lượt nhắc' : language === 'ja' ? 'ãƒ¡ãƒ³ã‚·ãƒ§ãƒ³' : language === 'ko' ? 'ì–¸ê¸‰' : 'Mentions'
      case 'Shared Files':
        return t.sidebar.sharedFiles
      case 'AI Updates':
        return language === 'vi' ? 'AI cập nhật' : language === 'ja' ? 'AIæ›´æ–°' : language === 'ko' ? 'AI ì—…ë °ì ´íŠ¸' : 'AI Updates'
      default:
        return tab
    }
  }

  const fetchNotifications = useCallback(async (filter: string, showSilent: boolean = false) => {
    if (!showSilent) setLoading(true)
    setError(null)
    try {
      const data = await notificationApi.getNotifications(filter)
      setNotifications(data)
    } catch (err) {
      setError(language === 'vi' ? 'Không thể tải thông báo' : language === 'ja' ? 'é€šçŸ¥ã ®å –å¾—ã «å¤±æ•—ã —ã ¾ã —ã Ÿ' : language === 'ko' ? 'ì•Œë¦¼ì „ ê°€ì ¸ì˜¤ëŠ” ë ° ì‹¤íŒ¨í–ˆìŠµë‹ˆë‹¤' : 'Failed to fetch notifications')
    } finally {
      if (!showSilent) setLoading(false)
    }
  }, [language])

  const normalize = (str: string) => str.toLowerCase().replace(/[\s-_]+/g, '')

  const activeTab = tabs.find(
    (t) => normalize(t) === normalize(activeFilter)
  ) || 'All'

  const handleTabClick = (tab: string) => {
    const filterKey = tab.toLowerCase().replace(/\s+/g, '-')
    setActiveFilter(filterKey)
    setSearchParams({ filter: filterKey })
  }

  // Sync state if URL changes and fetch data
  useEffect(() => {
    setActiveFilter(filterParam)
    fetchNotifications(filterParam)
  }, [filterParam, fetchNotifications])

  useEffect(() => {
    const handleUserChanged = () => {
      fetchNotifications(filterParam, true)
    }
    window.addEventListener('aiStudyHubUserChanged', handleUserChanged)
    window.addEventListener('aiStudyHubNotificationsUpdated', handleUserChanged)
    return () => {
      window.removeEventListener('aiStudyHubUserChanged', handleUserChanged)
      window.removeEventListener('aiStudyHubNotificationsUpdated', handleUserChanged)
    }
  }, [filterParam, fetchNotifications])

  useEffect(() => {
    return () => {
      if (undoTimeoutId) clearTimeout(undoTimeoutId)
    }
  }, [undoTimeoutId])

  const handleDeleteNotification = (id: string) => {
    const targetNotif = notifications.find(n => n.id === id)
    if (targetNotif) {
      setNotificationToDelete(targetNotif)
      setIsDeleteConfirmOpen(true)
    }
  }

  const confirmDeleteNotification = async () => {
    if (!notificationToDelete) return

    const targetId = notificationToDelete.id
    setLastDeletedNotification(notificationToDelete)

    // Filter out from the state
    setNotifications(prev => prev.filter(n => n.id !== targetId))

    try {
      const { userNotificationService } = await import('../services/userNotificationService')
      await userNotificationService.deleteNotification(targetId)
    } catch (e) {
      console.error('Failed to delete notification', e)
    }

    // Display Premium Undo Toast
    setShowUndoToast(true)

    // Clear last delete timeout
    if (undoTimeoutId) {
      clearTimeout(undoTimeoutId)
    }

    const timeout = setTimeout(() => {
      setShowUndoToast(false)
      setLastDeletedNotification(null)
    }, 5000)
    setUndoTimeoutId(timeout)

    // Reset delete confirmation states
    setNotificationToDelete(null)
    setIsDeleteConfirmOpen(false)
  }

  const cancelDeleteNotification = () => {
    setNotificationToDelete(null)
    setIsDeleteConfirmOpen(false)
  }

  const handleUndoDelete = () => {
    if (!lastDeletedNotification) return

    if (undoTimeoutId) {
      clearTimeout(undoTimeoutId)
      setUndoTimeoutId(null)
    }

    const restoredId = lastDeletedNotification.id

    setNotifications(prev => {
      if (prev.some(n => n.id === restoredId)) return prev
      return [lastDeletedNotification, ...prev]
    })

    try {
      const userEmail = getCurrentUser().email;
      const storedDeleted = localStorage.getItem(`aiStudyHubDeletedNotificationIds:${userEmail}`)
      if (storedDeleted) {
        let deletedIds: string[] = JSON.parse(storedDeleted)
        deletedIds = deletedIds.filter(id => id !== restoredId)
        localStorage.setItem(`aiStudyHubDeletedNotificationIds:${userEmail}`, JSON.stringify(deletedIds))
      }
      window.dispatchEvent(new Event('aiStudyHubNotificationsUpdated'))
    } catch (e) {
      console.error('Failed to restore deleted notification ID', e)
    }

    setShowUndoToast(false)
    setLastDeletedNotification(null)
  }

  const handleMarkAsRead = async (id: string) => {
    // Optimistic UI update
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
    await notificationApi.markAsRead(id)
  }

  return (
    <div className="mx-auto max-w-[800px] py-8 px-4 md:px-6">
      {/* Title Section */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#0b1c30] dark:text-slate-100">{t.notificationsPage.title}</h1>
          <p className="text-base text-[#737686] dark:text-slate-400 mt-2">
            {t.notificationsPage.subtitle}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {false && <button
            onClick={() => {}}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-indigo-500/10 dark:shadow-none hover:shadow-lg transition-all cursor-pointer border-none"
          >
            <Sparkles className="w-4 h-4 text-white" />
            <span className="hidden sm:inline">
              {language === 'vi' ? 'Giả lập thông báo' : language === 'ja' ? 'é€šçŸ¥ã‚’ã‚·ãƒŸãƒ¥ãƒ¬ãƒ¼ãƒˆ' : language === 'ko' ? 'ì•Œë¦¼ ì‹œë®¬ë ˆì ´ì…˜' : 'Simulate alert'}
            </span>
          </button>}

          <button
            onClick={() => fetchNotifications(activeFilter)}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-[rgba(195,198,215,0.4)] dark:border-slate-800 rounded-xl text-sm font-semibold text-[#434655] dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            <span className="hidden sm:inline">
              {language === 'vi' ? 'Làm mới' : language === 'ja' ? 'æ›´æ–°' : language === 'ko' ? 'ìƒˆë¡œê³ ì¹¨' : 'Refresh'}
            </span>
          </button>
        </div>

      </div>

      {/* Filter Tabs */}
      <div className="flex gap-3 mb-8 flex-wrap">
        {tabs.map((tab) => {
          const isActive = activeTab === tab
          return (
            <button
              key={tab}
              type="button"
              onClick={() => handleTabClick(tab)}
              className={cn(
                "px-6 py-2.5 rounded-full text-sm font-medium transition-colors cursor-pointer border",
                isActive
                  ? "bg-[#3155F6] text-white border-[#3155F6] shadow-sm dark:bg-blue-600 dark:border-blue-600"
                  : "bg-white dark:bg-slate-900 text-[#434655] dark:text-slate-300 border-[rgba(195,198,215,0.4)] dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
              )}
            >
              {getTabLabel(tab)}
            </button>
          )
        })}
      </div>

      {/* Cards List */}
      <div className="space-y-5">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white/50 dark:bg-slate-900/50 rounded-3xl border border-dashed border-[rgba(195,198,215,0.4)] dark:border-slate-800">
            <div className="w-12 h-12 rounded-full bg-[#F4F7FE] dark:bg-slate-800 flex items-center justify-center mb-4">
              <RefreshCw className="w-6 h-6 text-[#3155F6] animate-spin" />
            </div>
            <h3 className="text-lg font-bold text-[#0b1c30] dark:text-slate-100 mb-1">
              {language === 'vi' ? 'Đang tải thông báo...' : language === 'ja' ? 'é€šçŸ¥ã‚’èª­ã ¿è¾¼ã ¿ä¸­...' : language === 'ko' ? 'ì•Œë¦¼ ë¡œë”© ì¤‘...' : 'Loading notifications...'}
            </h3>
            <p className="text-[#737686] font-medium text-sm">
              {language === 'vi' ? 'Vui lòng đợi trong giây lát...' : language === 'ja' ? 'ãƒ‡ãƒ¼ã‚¿ã‚’å –å¾—ã ™ã‚‹ã ¾ã §ã —ã °ã‚‰ã  ã Šå¾…ã ¡ã  ã  ã •ã „' : language === 'ko' ? 'ë °ì ´í„°ë¥¼ ê°€ì ¸ì˜¤ëŠ” ë ™ì•ˆ ìž ì‹œë§Œ ê¸°ë‹¤ë ¤ì£¼ì„¸ìš”' : 'Please wait a moment while we fetch your data'}
            </p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 bg-[#FFF0F0]/50 dark:bg-red-950/20 rounded-3xl border border-dashed border-red-200 dark:border-red-900/50">
            <h3 className="text-lg font-bold text-red-600 dark:text-red-400 mb-1">
              {language === 'vi' ? 'Có lỗi xảy ra!' : language === 'ja' ? 'ã‚¨ãƒ©ãƒ¼ã Œç™ºç”Ÿã —ã ¾ã —ã Ÿ' : language === 'ko' ? 'ì˜¤ë¥˜ê°€ ë°œìƒ í–ˆìŠµë‹ˆë‹¤' : 'Oops, something went wrong!'}
            </h3>
            <p className="text-red-500 font-medium text-sm mb-4">{error}</p>
            <button
              onClick={() => fetchNotifications(activeFilter)}
              className="px-4 py-2 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 rounded-xl text-sm font-semibold hover:bg-red-200 dark:hover:bg-red-900/60 transition-colors"
            >
              {language === 'vi' ? 'Thử lại' : language === 'ja' ? 'å† è©¦è¡Œ' : language === 'ko' ? 'ë‹¤ì‹œ ì‹œë „' : 'Try Again'}
            </button>
          </div>
        ) : notifications.length > 0 ? (
          notifications.map((notification) => {
            let cardButtons = notification.buttons;
            if (!cardButtons || cardButtons.length === 0) {
              cardButtons = [{
                text: language === 'vi' ? 'Xem chi tiết' : 'View Details',
                variant: 'secondary' as const,
                onClick: () => setSelectedDetailNotification(notification)
              }];
            }

            return (
              <NotificationCard
                key={`${activeFilter}-${notification.id}`}
                {...notification}
                buttons={cardButtons}
                isActiveReply={notification.id === activeReplyId}
                replyText={replyText}
                onMarkRead={() => handleMarkAsRead(notification.id)}
                onClick={() => {
                  setSelectedDetailNotification(notification)
                }}
                onReplyClick={() => {
                  if (notification.id === 'emily' || notification.id === 'all-3') {
                    setActiveReplyId(notification.id)
                  }
                }}
                onCancelClick={() => {
                  setActiveReplyId(null)
                }}
                onSendReplyClick={() => {
                  setReplyText('')
                  setActiveReplyId(null)
                }}
                onReplyTextChange={(val) => setReplyText(val)}
                onDelete={() => handleDeleteNotification(notification.id)}
                isConfirmingDelete={notificationToDelete?.id === notification.id}
              />
            )
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-24 bg-white/50 dark:bg-slate-900/50 rounded-3xl border border-dashed border-[rgba(195,198,215,0.4)] dark:border-slate-800">
            <div className="w-16 h-16 rounded-full bg-[#F4F7FE] dark:bg-slate-800 flex items-center justify-center mb-5">
              <BellOff className="w-8 h-8 text-[#A0AABF] dark:text-slate-500" />
            </div>
            <h3 className="text-xl font-bold text-[#0b1c30] dark:text-slate-100 mb-2">{t.notificationsPage.noNotifications}</h3>
            <p className="text-[#737686] font-medium text-sm text-center max-w-[250px]">
              {activeTab === 'Unread'
                ? (language === 'vi' ? 'Bạn đã đọc hết tất cả thông báo!' : language === 'ja' ? 'ã ™ã ¹ã ¦ç¢ºèª æ¸ˆã ¿ã §ã ™ï¼ æœªèª­ãƒ¡ãƒƒã‚»ãƒ¼ã‚¸ã ¯ã ‚ã‚Šã ¾ã ›ã‚“ã€‚' : language === 'ko' ? 'ëª¨ë‘  ì ½ìœ¼ì…¨ìŠµë‹ˆë‹¤! ì ½ì§€ ì•Šì € ë©”ì‹œì§€ê°€ ì—†ìŠµë‹ˆë‹¤.' : "You're all caught up! There are no unread messages.")
                : (language === 'vi' ? 'Khi có thông báo mới, chúng sẽ hiển thị ở đây.' : language === 'ja' ? 'æ–°ã —ã „é€šçŸ¥ã Œå±Šã  ã ¨ã€ ã “ã “ã «è¡¨ç¤ºã •ã‚Œã ¾ã ™ã€‚' : language === 'ko' ? 'ìƒˆë¡œìš´ ì•Œë¦¼ì ´ ë „ì°©í•˜ë©´ ì—¬ê¸°ì—  í‘œì‹œë ©ë‹ˆë‹¤.' : "When you get new notifications, they'll show up here.")}
            </p>
          </div>
        )}
      </div>

      <Modal
        isOpen={!!selectedDetailNotification}
        onClose={() => setSelectedDetailNotification(null)}
        title={selectedDetailNotification?.title || t.notificationsPage.detailModalTitle}
        className="max-w-md"
      >
        {selectedDetailNotification && (
          <div className="space-y-4 pt-2">
            {selectedDetailNotification.type === 'system' || !selectedDetailNotification.actionType ? (
              // System / General Notification Details
              <div className="space-y-4">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    {language === 'vi' ? 'Chi tiết thông báo' : 'Message Details'}
                  </span>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-355 leading-relaxed bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                    {selectedDetailNotification.description}
                  </p>
                </div>
                {selectedDetailNotification.adminNote && (
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-rose-500 uppercase tracking-wider">
                      {language === 'vi' ? 'Ý kiến phản hồi / Lý do' : 'Feedback / Reason'}
                    </span>
                    <p className="text-sm font-semibold text-rose-700 dark:text-rose-455 bg-rose-50 dark:bg-rose-955/20 p-4 rounded-2xl border border-rose-100 dark:border-rose-900/10">
                      {selectedDetailNotification.adminNote}
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-[120px_1fr] gap-2 items-start text-xs text-slate-450 dark:text-slate-500 mt-2">
                  <span>{t.notificationsPage.detailTime}:</span>
                  <span>{selectedDetailNotification.time}</span>
                </div>
              </div>
            ) : (
              // Document Rejection / Deletion Details
              <div className="space-y-3">
                <div className="grid grid-cols-[120px_1fr] gap-2 items-center">
                  <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">{t.notificationsPage.detailDocName}:</span>
                  <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {selectedDetailNotification.documentName || (() => {
                      const desc = typeof selectedDetailNotification.description === 'string'
                        ? selectedDetailNotification.description
                        : '';
                      const match = desc.match(/"([^"]+)"/);
                      return match ? match[1] : 'Unknown Document';
                    })()}
                  </span>
                </div>
                <div className="grid grid-cols-[120px_1fr] gap-2 items-center">
                  <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">{t.notificationsPage.detailActionType}:</span>
                  <span className={cn(
                    "text-sm font-semibold w-fit px-2.5 py-0.5 rounded-full",
                    selectedDetailNotification.actionType === 'removed'
                      ? "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400"
                      : "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400"
                  )}>
                    {selectedDetailNotification.actionType === 'removed' ? t.notificationsPage.actionRemoved : t.notificationsPage.actionRejected}
                  </span>
                </div>
                <div className="grid grid-cols-[120px_1fr] gap-2 items-start mt-2 border-t border-slate-100 dark:border-slate-800 pt-4">
                  <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">{t.notificationsPage.detailReason}:</span>
                  <div className="text-sm text-slate-700 dark:text-slate-350 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                    {selectedDetailNotification.reason?.trim() || selectedDetailNotification.adminNote?.trim() || (
                      (() => {
                        const desc = typeof selectedDetailNotification.description === 'string'
                          ? selectedDetailNotification.description
                          : '';
                        const match = desc.match(/Reason:\s*(.*)$/);
                        return match ? match[1]?.trim() || t.notificationsPage.noReasonProvided : t.notificationsPage.noReasonProvided;
                      })()
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-[120px_1fr] gap-2 items-start text-xs text-slate-400 mt-2">
                  <span>{t.notificationsPage.detailTime}:</span>
                  <span>{selectedDetailNotification.time}</span>
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <Button onClick={() => setSelectedDetailNotification(null)} className="cursor-pointer">
                {t.common.close}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Confirm Delete Modal */}
      <Modal
        isOpen={isDeleteConfirmOpen}
        onClose={cancelDeleteNotification}
        title={t.notificationsPage.deleteTitle}
        className="max-w-md"
      >
        <div className="space-y-6 pt-2">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/20 text-rose-500 flex-shrink-0 border border-rose-100 dark:border-rose-900/30">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-[#0b1c30] dark:text-slate-100">
                {t.notificationsPage.deleteTitle}
              </p>
              <p className="text-sm text-slate-550 dark:text-slate-400 leading-relaxed font-medium">
                {t.notificationsPage.deleteMessage}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 mt-8 border-t border-slate-100 dark:border-slate-800 pt-4">
            <button
              onClick={cancelDeleteNotification}
              className="px-5 py-2.5 rounded-xl text-sm font-bold bg-slate-50 hover:bg-slate-100 text-slate-600 dark:bg-slate-850 dark:hover:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
            >
              {t.notificationsPage.deleteCancel}
            </button>
            <button
              onClick={confirmDeleteNotification}
              className="px-5 py-2.5 rounded-xl text-sm font-bold bg-rose-500 hover:bg-rose-600 text-white shadow-md shadow-rose-500/10 transition-all cursor-pointer"
            >
              {t.notificationsPage.deleteConfirm}
            </button>
          </div>
        </div>
      </Modal>

      {/* Premium Undo Toast */}
      {showUndoToast && lastDeletedNotification && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-6 py-4 rounded-2xl shadow-2xl flex items-center justify-between gap-6 border border-slate-800 dark:border-slate-200 animate-slideUp max-w-[90vw] w-[450px]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-slate-800 dark:bg-slate-100 flex-shrink-0">
              <Trash2 className="w-5 h-5 text-rose-400 dark:text-rose-500" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white dark:text-slate-900 truncate">
                {t.notificationsPage.deleteToast}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 truncate mt-0.5 font-medium">
                {lastDeletedNotification.title}
              </p>
            </div>
          </div>
          <button
            onClick={handleUndoDelete}
            className="flex-shrink-0 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/10 cursor-pointer active:scale-95"
          >
            {language === 'vi' ? 'Hoàn tác' : 'Undo'}
          </button>
        </div>
      )}
    </div>
  )
}
