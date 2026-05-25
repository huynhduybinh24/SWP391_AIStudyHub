import { useState, useEffect } from 'react'
import { useParams, useNavigate, useOutletContext } from 'react-router-dom'
import {
  ArrowLeft,
  FileText,
  Lock,
  Share2,
  Globe,
  Folder,
  ChevronDown,
  Trash2,
  Download,
  Bot,
  Sparkles,
  Maximize2,
  Check,
  X,
  UserPlus,
  Settings,
  Mail,
  User,
  Link,
  Copy,
  Send,
  RefreshCw,
  BookOpen,
  HelpCircle,
  Brain,
  Award,
  RotateCcw
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

interface DocumentItem {
  id: string
  title: string
  fileName: string
  uploadedAt: string
  uploadedDateObj: Date
  size: string
  sizeKb: number
  subject: 'MATHEMATICS' | 'BIOLOGY' | 'PHYSICS' | 'COMPSCI' | 'PHILOSOPHY' | 'ECONOMICS' | 'GENERAL' | 'NEUROSCIENCE' | 'PSYCHOLOGY'
  status: 'ANALYZED' | 'PENDING' | 'SCANNING' | 'QUEUED'
  type: 'pdf' | 'word' | 'image' | 'text' | 'slides'
}

interface DocumentsContextType {
  documents: DocumentItem[]
  setDocuments: React.Dispatch<React.SetStateAction<DocumentItem[]>>
  openUploadModal: () => void
  openChatDrawer: (doc: DocumentItem) => void
  openPreviewModal: (doc: DocumentItem) => void
  openQuizModal: () => void
  showToast: (message: string) => void
  handleDownloadFile: (doc: DocumentItem) => void
  handleDeleteDocument: (id: string) => void
  renderFileIcon: (type: string) => React.ReactNode
  renderStatusBadge: (status: string) => React.ReactNode
}

const SUBJECT_LIST = [
  { value: 'COMPSCI', label: 'Computer Science' },
  { value: 'MATHEMATICS', label: 'Mathematics' },
  { value: 'BIOLOGY', label: 'Biology' },
  { value: 'PHYSICS', label: 'Physics' },
  { value: 'PHILOSOPHY', label: 'Philosophy' },
  { value: 'ECONOMICS', label: 'Economics' },
  { value: 'NEUROSCIENCE', label: 'Neuroscience' },
  { value: 'PSYCHOLOGY', label: 'Psychology' },
  { value: 'GENERAL', label: 'General Studies' }
]

const FOLDERS_LIST = [
  'Fall 2024 / CS401',
  'Fall 2024 / MAT202',
  'Fall 2024 / BIO305',
  'Spring 2024 / PHY301',
  'Archive / General'
]

export default function EditDocumentPage() {
  const { documentId } = useParams<{ documentId: string }>()
  const navigate = useNavigate()
  
  const {
    documents,
    setDocuments,
    showToast,
    handleDownloadFile,
    handleDeleteDocument,
    openPreviewModal
  } = useOutletContext<DocumentsContextType>()

  // 1. Resolve document or fallback
  const activeDoc = documents.find(d => d.id === documentId)

  // Collaborator interface for Google-style sharing
  interface Collaborator {
    id: string
    name: string
    email: string
    role: 'owner' | 'editor' | 'commenter' | 'viewer'
    avatarBg: string
  }

  // 2. States
  const [title, setTitle] = useState(activeDoc?.title || 'Machine Learning Notes v2')
  const [subject, setSubject] = useState<string>(activeDoc?.subject || 'COMPSCI')
  const [description, setDescription] = useState(
    'Comprehensive notes covering supervised and unsupervised learning algorithms, including SVMs, Random Forests, and neural network basics from week 4-7 lectures.'
  )
  const [tags, setTags] = useState<string[]>(['AI', 'Machine Learning', 'Midterm', 'Notes'])
  const [newTagInput, setNewTagInput] = useState('')
  const [visibility, setVisibility] = useState<'private' | 'shared' | 'public'>('private')
  const [folder, setFolder] = useState(FOLDERS_LIST[0])
  
  // Google Drive sharing states
  const [collaborators, setCollaborators] = useState<Collaborator[]>([
    {
      id: 'owner-1',
      name: 'Alex Rivera',
      email: 'alex@example.com',
      role: 'owner',
      avatarBg: 'bg-[#0fbf7c] text-white font-bold'
    },
    {
      id: 'collab-1',
      name: 'Huynh Duy Binh',
      email: 'binh@example.com',
      role: 'editor',
      avatarBg: 'bg-[#5f6ffc] text-white font-bold'
    },
    {
      id: 'collab-2',
      name: 'Ngoc Tan',
      email: 'tan@example.com',
      role: 'commenter',
      avatarBg: 'bg-[#fc9d1c] text-white font-bold'
    }
  ])
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [isSettingsViewOpen, setIsSettingsViewOpen] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [newRole, setNewRole] = useState<'editor' | 'commenter' | 'viewer'>('viewer')
  const [isNewRoleDropdownOpen, setIsNewRoleDropdownOpen] = useState(false)
  const [activeCollaboratorDropdownId, setActiveCollaboratorDropdownId] = useState<string | null>(null)
  
  const [generalAccess, setGeneralAccess] = useState<'restricted' | 'public'>('restricted')
  const [isGeneralDropdownOpen, setIsGeneralDropdownOpen] = useState(false)
  const [publicRole, setPublicRole] = useState<'editor' | 'commenter' | 'viewer'>('viewer')
  const [isPublicRoleDropdownOpen, setIsPublicRoleDropdownOpen] = useState(false)

  const [editorsCanShare, setEditorsCanShare] = useState(true)
  const [viewersCanDownload, setViewersCanDownload] = useState(true)

  // AI Assistant Drawer states
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false)
  const [aiDrawerTab, setAiDrawerTab] = useState<'chat' | 'concepts' | 'quiz'>('chat')
  const [aiDrawerProgress, setAiDrawerProgress] = useState(0)
  const [isAiDrawerAnalyzing, setIsAiDrawerAnalyzing] = useState(false)
  const [aiDrawerAnalysisStep, setAiDrawerAnalysisStep] = useState('')
  const [aiConcepts, setAiConcepts] = useState<string[] | null>(null)
  const [aiQuiz, setAiQuiz] = useState<any[] | null>(null)
  const [aiQuizAnswers, setAiQuizAnswers] = useState<Record<number, number>>({})
  const [aiQuizSubmitted, setAiQuizSubmitted] = useState(false)
  
  const [aiDrawerChatLog, setAiDrawerChatLog] = useState<Array<{
    payload?: any;
    sender: 'user' | 'ai';
    text: string;
    timestamp: string;
  }>>([])
  const [aiDrawerChatInput, setAiDrawerChatInput] = useState('')
  const [isAiDrawerTyping, setIsAiDrawerTyping] = useState(false)
  const [aiDrawerTypingText, setAiDrawerTypingText] = useState('')

  // Initialize AI Welcome Message
  useEffect(() => {
    if (aiDrawerChatLog.length === 0) {
      setAiDrawerChatLog([
        {
          sender: 'ai',
          text: `Chào bạn! Tôi là Trợ lý học tập AI. Tôi đã sẵn sàng phân tích tài liệu ${title} này. 

Bạn muốn tôi làm gì?
- Tự động điền mô tả & tag chuẩn hóa
- Trích xuất các ý chính học thuật
- Tạo câu hỏi trắc nghiệm ôn tập`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ])
    }
  }, [title])

  
  // Dropdown states
  const [isSubjectDropdownOpen, setIsSubjectDropdownOpen] = useState(false)
  const [isFolderDropdownOpen, setIsFolderDropdownOpen] = useState(false)

  // Load actual details if document is found
  useEffect(() => {
    if (activeDoc) {
      setTitle(activeDoc.title || activeDoc.fileName.replace(/\.[^/.]+$/, ""))
      setSubject(activeDoc.subject)
    }
  }, [activeDoc])

  // Collaborator sharing handlers
  const handleAddCollaborator = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEmail.trim()) return

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newEmail.trim())) {
      showToast('❌ Vui lòng nhập địa chỉ email hợp lệ!')
      return
    }

    if (collaborators.some(c => c.email.toLowerCase() === newEmail.trim().toLowerCase())) {
      showToast('⚠️ Email này đã có quyền truy cập!')
      return
    }

    const namePart = newEmail.split('@')[0]
    const capitalizedName = namePart.charAt(0).toUpperCase() + namePart.slice(1)
    
    // Choose a random color for avatar
    const colors = [
      'bg-[#5f6ffc] text-white font-bold',
      'bg-[#fc9d1c] text-white font-bold',
      'bg-[#ec4899] text-white font-bold',
      'bg-[#8b5cf6] text-white font-bold',
      'bg-[#0fbf7c] text-white font-bold',
      'bg-rose-500 text-white font-bold'
    ]
    const randomColor = colors[Math.floor(Math.random() * colors.length)]

    const newCollaborator: Collaborator = {
      id: Math.random().toString(),
      name: capitalizedName,
      email: newEmail.trim().toLowerCase(),
      role: newRole,
      avatarBg: randomColor
    }

    setCollaborators([...collaborators, newCollaborator])
    setNewEmail('')
    showToast(`👥 Đã thêm ${capitalizedName} làm ${newRole === 'editor' ? 'Người chỉnh sửa' : newRole === 'commenter' ? 'Người nhận xét' : 'Người xem'}`)
  }

  const handleRemoveCollaborator = (id: string, name: string) => {
    setCollaborators(collaborators.filter(c => c.id !== id))
    showToast(`🗑️ Đã xóa quyền truy cập của ${name}`)
  }

  const handleRoleChange = (id: string, role: 'editor' | 'commenter' | 'viewer') => {
    setCollaborators(collaborators.map(c => c.id === id ? { ...c, role } : c))
    showToast(`✏️ Đã cập nhật vai trò thành ${role === 'editor' ? 'Người chỉnh sửa' : role === 'commenter' ? 'Người nhận xét' : 'Người xem'}`)
  }

  const handleCopyLink = () => {
    const documentUrl = window.location.href.replace('/edit', '')
    navigator.clipboard.writeText(documentUrl)
    showToast('🔗 Đã sao chép đường liên kết tài liệu vào bộ nhớ tạm!')
  }


  // Handle Add Tag
  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newTagInput.trim()) {
      e.preventDefault()
      if (tags.includes(newTagInput.trim())) {
        showToast('⚠️ Tag này đã tồn tại!')
        return
      }
      setTags([...tags, newTagInput.trim()])
      setNewTagInput('')
      showToast(`🏷️ Đã thêm tag: "${newTagInput.trim()}"`)
    }
  }

  // Handle Remove Tag
  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove))
    showToast(`🗑️ Đã xóa tag: "${tagToRemove}"`)
  }

  // Handle Suggest More Tags
  const handleSuggestTags = () => {
    showToast('✨ AI đang phân tích tài liệu để gợi ý thêm tag...')
    setTimeout(() => {
      const suggestions = ['Neural Networks', 'Supervised', 'Classification', 'SVM', 'Deep Learning']
      const unadded = suggestions.filter(s => !tags.includes(s))
      if (unadded.length === 0) {
        showToast('✨ AI nhận thấy danh sách tag hiện tại đã rất đầy đủ!')
      } else {
        const added = unadded.slice(0, 2)
        setTags([...tags, ...added])
        showToast(`✨ AI đã tự động thêm gợi ý tag: ${added.join(', ')}`)
      }
    }, 1200)
  }

  // Handle Save
  const handleSaveChanges = () => {
    if (!title.trim()) {
      showToast('❌ Tên tài liệu không được để trống!')
      return
    }

    if (activeDoc) {
      setDocuments(prev =>
        prev.map(doc =>
          doc.id === activeDoc.id
            ? { ...doc, title: title.trim(), subject: subject as any }
            : doc
        )
      )
    }
    showToast('⚡ Lưu các thay đổi tài liệu thành công!')
    navigate(-1)
  }

  // Handle Discard
  const handleDiscardChanges = () => {
    showToast('⚠️ Đã hủy các thay đổi chưa lưu.')
    navigate(-1)
  }

  // Handle Delete
  const handleDelete = () => {
    if (activeDoc) {
      handleDeleteDocument(activeDoc.id)
      showToast(`🗑️ Đã xóa tài liệu "${title}"`)
      navigate('/dashboard/documents')
    } else {
      showToast('🗑️ Mô phỏng xóa tài liệu thành công!')
      navigate('/dashboard/documents')
    }
  }

  const selectedSubjectLabel = SUBJECT_LIST.find(s => s.value === subject)?.label || 'Computer Science'

  // 3. AI Assistant Helper Functions
  const handleAiAutoFillForm = () => {
    setIsAiDrawerTyping(true)
    setAiDrawerTypingText('AI đang phân tích tài liệu và cấu trúc học thuật...')
    
    setTimeout(() => {
      let aiDesc = ''
      let aiTags: string[] = []
      
      if (subject === 'COMPSCI') {
        aiDesc = 'Tài liệu tổng hợp chuyên sâu về môn Computer Science (Mã lớp CS-402). Nội dung bao gồm phân tích các nguyên lý thiết kế hướng đối tượng (OOP), các mẫu thiết kế (Design Patterns) như Singleton, Observer, Factory, cùng các ví dụ thực tiễn bằng ngôn ngữ lập trình phổ biến giúp tối ưu hóa hệ thống phần mềm và cấu trúc dữ liệu giải thuật.'
        aiTags = ['Computer Science', 'Design Patterns', 'CS-402', 'Software Engineering']
      } else if (subject === 'MATHEMATICS') {
        aiDesc = 'Tài liệu nghiên cứu và bảng công thức ôn tập môn Toán học cao cấp (Multivariable Calculus & Linear Algebra). Tổng hợp toàn bộ lý thuyết về không gian đa chiều, vector gradient descent, phép chuyển đổi ma trận và các lý thuyết đại số tuyến tính cơ bản phục vụ cho việc nghiên cứu thuật toán học máy.'
        aiTags = ['Mathematics', 'Calculus', 'Linear Algebra', 'Algorithms']
      } else {
        aiDesc = `Tài liệu học tập chuẩn hóa của môn ${selectedSubjectLabel}. Tổng hợp toàn bộ hệ thống kiến thức trọng tâm bài học, các khái niệm định nghĩa cốt lõi, sơ đồ tư duy liên kết và các câu hỏi thực hành chuyên đề ôn thi kết thúc học phần đạt hiệu quả cao nhất.`
        aiTags = [selectedSubjectLabel, 'StudyGuide', 'Syllabus', '2024']
      }
      
      const generatedMsg = {
        sender: 'ai' as const,
        text: `✨ Tôi đã phân tích thành công và đề xuất thông tin chuẩn hóa cho tài liệu này!

📝 Mô tả đề xuất:
*"${aiDesc}"*

🏷️ Các thẻ tag đề xuất:
${aiTags.map(t => `• \`#${t}\``).join('\n')}

Bạn có muốn áp dụng trực tiếp các thông tin này vào form chỉnh sửa tài liệu hiện tại không?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        payload: { desc: aiDesc, tags: aiTags }
      }

      setAiDrawerChatLog(prev => [...prev, generatedMsg])
      setIsAiDrawerTyping(false)
      setAiDrawerTypingText('')
    }, 1500)
  }

  const applyAiMetadata = (aiDesc: string, aiTags: string[]) => {
    setDescription(aiDesc)
    setTags(aiTags)
    showToast('✨ Đã cập nhật mô tả và danh sách tag từ trợ lý AI!')
  }

  const handleAiDrawerTriggerAnalysis = (tabType: 'concepts' | 'quiz') => {
    if (isAiDrawerAnalyzing) return
    setIsAiDrawerAnalyzing(true)
    setAiDrawerProgress(5)
    setAiDrawerAnalysisStep('Bắt đầu phân tích cấu trúc tài liệu...')

    const steps = [
      { p: 30, msg: 'Đang trích xuất các đỉnh ngữ nghĩa văn bản...' },
      { p: 65, msg: 'Đối chiếu hệ thống học thuật môn ' + selectedSubjectLabel + '...' },
      { p: 85, msg: 'Tạo lập bộ câu hỏi học thuật và flashcard tương tác...' },
      { p: 100, msg: 'Hoàn tất phân tích hệ thống dữ liệu!' }
    ]

    let stepIndex = 0
    const scanTimer = setInterval(() => {
      if (stepIndex < steps.length) {
        setAiDrawerProgress(steps[stepIndex].p)
        setAiDrawerAnalysisStep(steps[stepIndex].msg)
        stepIndex++
      } else {
        clearInterval(scanTimer)
        setTimeout(() => {
          setIsAiDrawerAnalyzing(false)
          
          if (tabType === 'concepts') {
            if (subject === 'COMPSCI') {
              setAiConcepts([
                'Mẫu thiết kế (Design Patterns): Định nghĩa và cách áp dụng Creational, Structural, và Behavioral patterns.',
                'Độ phức tạp thuật toán (Big O Notation): Đánh giá hiệu năng thời gian thực và bộ nhớ tối ưu hóa.',
                'Kiến trúc hệ thống Microservices: Phân rã cấu trúc monolithic sang dạng phân tán và caching dữ liệu.'
              ])
            } else if (subject === 'MATHEMATICS') {
              setAiConcepts([
                'Multivariable Space (Không gian đa biến): Hàm số nhiều biến, đạo hàm riêng và cực trị.',
                'Matrix Decomposition (Phân rã ma trận): Phép biến đổi SVD và ứng dụng trong tối ưu chiều dữ liệu.',
                'Gradient Descent: Các nguyên lý đạo hàm vector hướng trong quá trình tối ưu hóa trọng số học máy.'
              ])
            } else {
              setAiConcepts([
                `Lý thuyết nền tảng: Hệ thống định nghĩa chính xác về các hiện tượng học thuật của môn ${selectedSubjectLabel}.`,
                `Phương pháp phân tích: Các mô hình thực nghiệm và sơ đồ liên kết chuyên đề quan trọng.`,
                `Ứng dụng thực tiễn: Liên hệ thực hành và chuẩn hóa kỹ năng nghiên cứu chuyên sâu.`
              ])
            }
            showToast('✨ Trích xuất ý chính học thuật thành công!')
          } else {
            if (subject === 'COMPSCI') {
              setAiQuiz([
                {
                  question: 'Mẫu thiết kế (Design Pattern) nào đảm bảo một lớp chỉ có duy nhất một thực thể trong suốt vòng đời ứng dụng?',
                  options: ['A. Factory Method', 'B. Singleton Pattern', 'C. Observer Pattern', 'D. Strategy Pattern'],
                  correct: 1
                },
                {
                  question: 'Độ phức tạp thời gian tốt nhất của thuật toán sắp xếp nhanh (Quick Sort) là gì?',
                  options: ['A. O(N)', 'B. O(N log N)', 'C. O(N^2)', 'D. O(log N)'],
                  correct: 1
                },
                {
                  question: 'Trong kiến trúc Web, RESTful API sử dụng phương thức HTTP nào để cập nhật hoàn toàn dữ liệu?',
                  options: ['A. GET', 'B. POST', 'C. PUT', 'D. DELETE'],
                  correct: 2
                }
              ])
            } else if (subject === 'MATHEMATICS') {
              setAiQuiz([
                {
                  question: 'Đạo hàm riêng của hàm số f(x, y) = x^2 * y theo biến x là gì?',
                  options: ['A. 2x', 'B. x^2', 'C. 2xy', 'D. x^2 * y'],
                  correct: 2
                },
                {
                  question: 'Một ma trận vuông A khả nghịch khi và chỉ khi định thức (Determinant) của nó thỏa mãn điều kiện nào?',
                  options: ['A. det(A) = 0', 'B. det(A) != 0', 'C. det(A) > 0', 'D. det(A) = 1'],
                  correct: 1
                },
                {
                  question: 'Phép phân rã trị riêng ma trận (SVD) chia ma trận A thành tích của mấy ma trận con?',
                  options: ['A. 2 ma trận', 'B. 3 ma trận', 'C. 4 ma trận', 'D. 5 ma trận'],
                  correct: 1
                }
              ])
            } else {
              setAiQuiz([
                {
                  question: `Khái niệm cốt lõi nào cấu thành nên nền tảng lý thuyết cơ sở của môn học ${selectedSubjectLabel}?`,
                  options: ['A. Định nghĩa mô hình cơ sở', 'B. Thực nghiệm liên ngành', 'C. Tổng quan cấu trúc hệ thống', 'D. Tất cả các phương án trên'],
                  correct: 3
                },
                {
                  question: `Phương pháp thực nghiệm phổ biến nhất được sử dụng trong các nghiên cứu gần đây là gì?`,
                  options: ['A. Phân tích định lượng', 'B. Khảo sát định tính', 'C. Kết hợp định tính & định lượng', 'D. Mô phỏng ảo hóa'],
                  correct: 2
                }
              ])
            }
            setAiQuizAnswers({})
            setAiQuizSubmitted(false)
            showToast('✨ Tạo bộ câu hỏi trắc nghiệm ôn tập thành công!')
          }
        }, 600)
      }
    }, 850)
  }

  const handleAiDrawerSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!aiDrawerChatInput.trim() || isAiDrawerTyping) return
    const prompt = aiDrawerChatInput.trim()
    setAiDrawerChatInput('')

    const userMsg = {
      sender: 'user' as const,
      text: prompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    setAiDrawerChatLog(prev => [...prev, userMsg])
    setIsAiDrawerTyping(true)
    setAiDrawerTypingText('AI đang tìm câu trả lời phù hợp nhất...')

    setTimeout(() => {
      let responseText = ''
      const lower = prompt.toLowerCase()

      if (lower.includes('summary') || lower.includes('tóm tắt') || lower.includes('overview') || lower.includes('khái quát')) {
        responseText = `Tài liệu ${title} là nguồn tài liệu hữu ích cho môn ${selectedSubjectLabel}. 

Dưới đây là tóm tắt nhanh từ trợ lý AI:
- Trọng tâm chính: Tổng hợp các kiến thức cốt lõi, bài tập thực tế và bộ câu hỏi trắc nghiệm nâng cao.
- Ý chính trích xuất: Bạn có thể xem danh sách ý chính đầy đủ trong tab Ý chính để có cái nhìn toàn diện hơn.
- Lời khuyên: Hãy thực hành bộ câu hỏi ôn thi trong tab Practice Quiz để tự đánh giá năng lực của mình.`
      } else if (lower.includes('quiz') || lower.includes('câu hỏi') || lower.includes('thi') || lower.includes('ôn tập')) {
        responseText = `Tôi đã thiết lập sẵn một bộ câu hỏi ôn tập trắc nghiệm tiêu chuẩn hóa dựa trên tài liệu ${title} môn ${selectedSubjectLabel} của bạn. \n\nBạn hãy chuyển sang tab Practice Quiz phía trên để làm bài thi ôn tập thử nhé!`
      } else {
        responseText = `Tôi đã nhận được câu hỏi: "${prompt}". Đối với tài liệu thuộc môn ${selectedSubjectLabel}, tôi có thể giúp tóm tắt, trích xuất ý chính hoặc thiết kế câu hỏi ôn thi.\n\nBạn có thể tham khảo thêm các nút tác vụ nhanh bên dưới nhé!`
      }

      const aiMsg = {
        sender: 'ai' as const,
        text: responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }

      setAiDrawerChatLog(prev => [...prev, aiMsg])
      setIsAiDrawerTyping(false)
    }, 1200)
  }

  return (
    <div className="space-y-6 pb-12 text-slate-800 dark:text-slate-200 font-sans">
      
      {/* 1. Header controls */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between pt-2">
        {/* Back Link */}
        <div className="space-y-1">
          <button
            onClick={() => navigate(-1)}
            className="group flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            Back to Documents
          </button>
          
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight mt-1">
            Edit Document
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-normal">
            Update document details, organization, and sharing settings
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3 self-end md:self-auto shrink-0 select-none">
          <button
            onClick={handleDiscardChanges}
            className="px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-extrabold text-sm hover:bg-slate-50 dark:hover:bg-slate-805 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xs"
          >
            Discard Changes
          </button>
          <button
            onClick={handleSaveChanges}
            className="px-5 py-3 rounded-2xl bg-blue-600 text-white font-extrabold text-sm hover:bg-blue-700 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md shadow-blue-500/10"
          >
            Save Changes
          </button>
        </div>
      </div>

      {/* 2. Main Edit Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: Metadata Form card */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-805 rounded-3xl shadow-sm flex flex-col">
          
          {/* Card Header */}
          <div className="flex items-center gap-2.5 px-6 py-5 border-b border-slate-100 dark:border-slate-805 bg-slate-50/50 dark:bg-slate-950/20 rounded-t-3xl shrink-0 select-none">
            <div className="bg-blue-100 dark:bg-blue-955/30 p-2 rounded-xl text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <FileText className="h-4.5 w-4.5" />
            </div>
            <h2 className="font-extrabold text-slate-800 dark:text-slate-200 text-sm tracking-wide">
              Document Metadata
            </h2>
          </div>

          {/* Form Content */}
          <div className="p-6 space-y-6">
            
            {/* Title & Subject row */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              
              {/* Document Title input */}
              <div className="md:col-span-8 space-y-2 text-left">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                  DOCUMENT TITLE <span className="text-red-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter document title"
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 rounded-2xl text-xs font-semibold placeholder-slate-450 dark:placeholder-slate-550 bg-slate-50/30 dark:bg-slate-955/30 focus:bg-white dark:focus:bg-slate-900 text-slate-700 dark:text-white transition-all outline-none shadow-xs"
                />
              </div>

              {/* Subject dropdown selection */}
              <div className="md:col-span-4 space-y-2 text-left relative">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                  SUBJECT
                </label>
                
                <button
                  type="button"
                  onClick={() => setIsSubjectDropdownOpen(!isSubjectDropdownOpen)}
                  className="w-full flex items-center justify-between px-4 py-3 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/30 dark:bg-slate-955/30 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-300 transition-all select-none shadow-xs"
                >
                  <span className="truncate">{selectedSubjectLabel}</span>
                  <ChevronDown className="h-4 w-4 text-slate-400 shrink-0 ml-1" />
                </button>

                {isSubjectDropdownOpen && (
                  <>
                    {/* Invisible click backdrop */}
                    <div className="fixed inset-0 z-10" onClick={() => setIsSubjectDropdownOpen(false)} />
                    
                    <div className="absolute right-0 left-0 mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-2xl max-h-56 overflow-y-auto z-20 py-1.5 animate-fade-in">
                      {SUBJECT_LIST.map((item) => (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => {
                            setSubject(item.value)
                            setIsSubjectDropdownOpen(false)
                            showToast(`✏️ Đã đổi môn học thành ${item.label}`)
                          }}
                          className={cn(
                            "w-full text-left px-4 py-2.5 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-805 flex items-center justify-between transition-colors",
                            subject === item.value ? "text-blue-600 bg-blue-50/40 dark:text-blue-400 dark:bg-blue-955/20" : "text-slate-700 dark:text-slate-300"
                          )}
                        >
                          <span>{item.label}</span>
                          {subject === item.value && <Check className="h-4 w-4 text-blue-600" />}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

            </div>

            {/* Description textarea */}
            <div className="space-y-2 text-left">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                DESCRIPTION
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Write description about the document..."
                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 rounded-2xl text-xs font-semibold placeholder-slate-450 dark:placeholder-slate-550 bg-slate-50/30 dark:bg-slate-955/30 focus:bg-white dark:focus:bg-slate-900 text-slate-700 dark:text-white transition-all outline-none resize-none shadow-xs leading-relaxed"
              />
            </div>

            {/* Tags dynamic container */}
            <div className="space-y-2 text-left">
              <div className="flex justify-between items-center select-none">
                <label className="text-[10px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1">
                  TAGS <span className="text-blue-500">✦</span>
                </label>
                <button
                  type="button"
                  onClick={handleSuggestTags}
                  className="text-xs font-extrabold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  Suggest more
                </button>
              </div>

              {/* Tags Panel */}
              <div className="bg-blue-50/20 dark:bg-blue-955/10 border border-blue-100/50 dark:border-blue-955/20 rounded-2xl p-4 space-y-3 shadow-inner">
                {/* Active tags line */}
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 dark:bg-blue-955/35 border border-blue-100 dark:border-blue-900/40 px-3.5 py-1.5 text-xs font-extrabold text-[#2563eb] dark:text-blue-400 select-none hover:bg-blue-100/60 dark:hover:bg-blue-955/50 transition-colors shadow-xs"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="text-[#2563eb] hover:text-red-500 dark:text-blue-400 dark:hover:text-red-400 p-0.5 rounded-full hover:bg-white dark:hover:bg-slate-805 transition-all"
                        title={`Xóa tag ${tag}`}
                      >
                        <X className="h-3 w-3 shrink-0" />
                      </button>
                    </span>
                  ))}
                  
                  {tags.length === 0 && (
                    <span className="text-xs text-slate-400 font-medium italic select-none py-1">
                      No tags added yet. Enter a tag below.
                    </span>
                  )}
                </div>

                {/* Input line */}
                <input
                  type="text"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  placeholder="Add tag..."
                  className="w-full md:w-56 px-3.5 py-2 border border-slate-200/80 dark:border-slate-800 focus:border-blue-500 rounded-xl text-xs font-semibold placeholder-slate-450 dark:placeholder-slate-550 bg-white dark:bg-slate-900 text-slate-850 dark:text-white outline-none shadow-inner transition-colors"
                />
              </div>
            </div>

            {/* Visibility & Folder row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1">
              
              {/* Visibility buttons */}
              <div className="space-y-2 text-left select-none">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                  VISIBILITY
                </label>
                
                <div className="flex items-center rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/30 p-1.5 w-full">
                  <button
                    type="button"
                    onClick={() => {
                      setVisibility('private')
                      showToast('🔒 Tài liệu đã được chuyển sang chế độ Riêng tư.')
                    }}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-extrabold transition-all outline-none",
                      visibility === 'private'
                        ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200/60 dark:border-slate-800"
                        : "text-slate-500 dark:text-slate-455 hover:text-slate-700 dark:hover:text-slate-300"
                    )}
                  >
                    <Lock className="h-3.5 w-3.5" />
                    <span>Private</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setVisibility('shared')
                      showToast('👥 Tài liệu đã được chuyển sang chế độ Chia sẻ.')
                    }}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-extrabold transition-all outline-none",
                      visibility === 'shared'
                        ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200/60 dark:border-slate-800"
                        : "text-slate-500 dark:text-slate-455 hover:text-slate-700 dark:hover:text-slate-300"
                    )}
                  >
                    <Share2 className="h-3.5 w-3.5" />
                    <span>Shared</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setVisibility('public')
                      showToast('🌐 Tài liệu đã được chuyển sang chế độ Công khai.')
                    }}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-extrabold transition-all outline-none",
                      visibility === 'public'
                        ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200/60 dark:border-slate-800"
                        : "text-slate-500 dark:text-slate-455 hover:text-slate-700 dark:hover:text-slate-300"
                    )}
                  >
                    <Globe className="h-3.5 w-3.5" />
                    <span>Public</span>
                  </button>
                </div>
              </div>

              {/* Location/Folder Selection dropdown */}
              <div className="space-y-2 text-left relative">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                  LOCATION / FOLDER
                </label>

                <button
                  type="button"
                  onClick={() => setIsFolderDropdownOpen(!isFolderDropdownOpen)}
                  className="w-full flex items-center justify-between px-4 py-2.5 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/30 dark:bg-slate-950/30 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-300 transition-all select-none shadow-xs"
                >
                  <span className="flex items-center gap-2 truncate">
                    <Folder className="h-4 w-4 text-slate-400 shrink-0" />
                    {folder}
                  </span>
                  <ChevronDown className="h-4 w-4 text-slate-400 shrink-0 ml-1" />
                </button>

                {isFolderDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsFolderDropdownOpen(false)} />
                    <div className="absolute right-0 left-0 mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-2xl max-h-48 overflow-y-auto z-20 py-1.5 animate-fade-in">
                      {FOLDERS_LIST.map((f) => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => {
                            setFolder(f)
                            setIsFolderDropdownOpen(false)
                            showToast(`📁 Di chuyển tài liệu vào thư mục: ${f}`)
                          }}
                          className={cn(
                            "w-full text-left px-4 py-2.5 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-805 flex items-center justify-between transition-colors",
                            folder === f ? "text-blue-600 bg-blue-50/40 dark:text-blue-400 dark:bg-blue-955/20" : "text-slate-700 dark:text-slate-300"
                          )}
                        >
                          <span className="flex items-center gap-2 truncate">
                            <Folder className="h-4 w-4 text-slate-400 shrink-0" />
                            {f}
                          </span>
                          {folder === f && <Check className="h-4 w-4 text-blue-600" />}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

            </div>

          </div>

          {/* Delete Document action row */}
          <div className="px-6 py-5 bg-slate-50/50 dark:bg-slate-950/20 border-t border-slate-100 dark:border-slate-805 rounded-b-3xl flex items-center select-none shrink-0 mt-2">
            <button
              type="button"
              onClick={handleDelete}
              className="flex items-center gap-2 text-rose-600 hover:text-rose-700 dark:text-rose-500 dark:hover:text-rose-405 font-extrabold text-xs transition-colors p-1"
            >
              <Trash2 className="h-4 w-4 text-rose-600" />
              <span>Delete Document</span>
            </button>
          </div>

        </div>

        {/* RIGHT COLUMN: Sidebar (Document Telemetry & Assistant) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Sidebar Card 1: Document Telemetry details */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/85 dark:border-slate-805 rounded-3xl shadow-sm overflow-hidden flex flex-col">
            
            {/* Header blue graphic view */}
            <div className="bg-[#F1F5F9]/50 dark:bg-slate-950/20 border-b border-slate-100 dark:border-slate-805 p-8 flex flex-col items-center justify-center relative select-none">
              
              {/* Expand option icon top-right */}
              <button
                type="button"
                onClick={() => {
                  if (activeDoc) {
                    openPreviewModal(activeDoc)
                  } else {
                    showToast('🔎 Mô phỏng chế độ xem trước tài liệu...')
                  }
                }}
                className="absolute top-4 right-4 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-350 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
                title="Expand Preview"
              >
                <Maximize2 className="h-4 w-4" />
              </button>

              {/* PDF Icon container with glowing circle */}
              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 bg-blue-500/10 dark:bg-blue-500/5 blur-xl rounded-full scale-125" />
                <div className="w-20 h-20 bg-blue-50 dark:bg-blue-955/20 border border-blue-100/60 dark:border-blue-900/30 rounded-2xl flex items-center justify-center shadow-inner relative">
                  <span className="text-xs font-black tracking-widest text-blue-600 dark:text-blue-400 uppercase">PDF</span>
                </div>
              </div>

              {/* Status Synced pill */}
              <div className="mt-5 flex">
                <span className="inline-flex items-center gap-1 rounded-full bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 px-3 py-1 text-[10px] font-black text-slate-650 dark:text-slate-400 tracking-wider shadow-sm select-none">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  Synced
                </span>
              </div>
            </div>

            {/* Content info area */}
            <div className="p-6 space-y-5">
              
              {/* Main title */}
              <div className="space-y-1 text-center">
                <h3 className="text-md font-black text-slate-900 dark:text-slate-200 tracking-tight leading-snug select-all truncate">
                  {title.endsWith('.pdf') ? title : `${title}.pdf`}
                </h3>
                <p className="text-xs text-slate-450 dark:text-slate-500 font-bold tracking-wide">
                  PDF Document &bull; {activeDoc?.size || '1.2 MB'}
                </p>
              </div>

              {/* Meta lines */}
              <div className="space-y-3.5 border-t border-slate-100 dark:border-slate-805 pt-4 text-left">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-slate-450 dark:text-slate-500 font-bold select-none">Uploaded</span>
                  <span className="text-slate-700 dark:text-slate-350 font-extrabold">Oct 12, 2024</span>
                </div>

                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-slate-450 dark:text-slate-500 font-bold select-none">Last Modified</span>
                  <span className="text-slate-700 dark:text-slate-350 font-extrabold">2 hours ago</span>
                </div>

                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-slate-450 dark:text-slate-500 font-bold select-none">Owner</span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-955/20 border border-blue-100 dark:border-blue-900/30 text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest scale-95 shadow-sm">
                    You
                  </span>
                </div>
              </div>

              {/* Bottom Actions grid */}
              <div className="grid grid-cols-2 gap-3.5 border-t border-slate-100 dark:border-slate-805 pt-4.5 shrink-0 select-none">
                <button
                  type="button"
                  onClick={() => {
                    if (activeDoc) {
                      handleDownloadFile(activeDoc)
                    } else {
                      showToast('💾 Đang tải tài liệu về máy tính của bạn...')
                    }
                  }}
                  className="flex items-center justify-center gap-1.5 bg-blue-50 dark:bg-blue-955/20 border border-blue-100 dark:border-blue-900/30 hover:bg-blue-100/60 dark:hover:bg-blue-950/30 text-blue-600 dark:text-blue-400 font-extrabold text-xs py-3 rounded-xl transition-all shadow-xs"
                >
                  <Download className="h-4 w-4 shrink-0" />
                  <span>Download</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsShareModalOpen(true)}
                  className="flex items-center justify-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold text-xs py-3 rounded-xl transition-all shadow-xs"
                >
                  <Share2 className="h-4 w-4 shrink-0" />
                  <span>Share</span>
                </button>
              </div>

            </div>

          </div>

          {/* Sidebar Card 2: AI Document Assistant promo */}
          <div className="bg-gradient-to-br from-blue-50/50 to-indigo-50/30 dark:from-slate-900/50 dark:to-indigo-950/20 border border-blue-100/70 dark:border-slate-805 rounded-3xl p-6 shadow-sm space-y-4 text-left flex flex-col relative overflow-hidden">
            
            {/* Soft decorative background circles */}
            <div className="absolute -top-12 -right-12 w-28 h-28 bg-indigo-500/5 rounded-full blur-xl pointer-events-none" />

            {/* Icon and title block */}
            <div className="flex items-center gap-2 select-none">
              <div className="bg-blue-600 p-2 rounded-xl text-white flex items-center justify-center shadow-md shadow-blue-500/10">
                <Bot className="h-4 w-4" />
              </div>
              <h3 className="font-extrabold text-slate-800 dark:text-slate-200 text-xs tracking-wide">
                AI Document Assistant
              </h3>
            </div>

            {/* Prompt details */}
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal font-semibold">
              Need to extract key concepts or generate a quiz from these notes?
            </p>

            {/* Button trigger */}
            <button
              type="button"
              onClick={() => {
                showToast('🤖 Đang khởi chạy phòng trợ lý AI cho tài liệu này...')
                setIsAiDrawerOpen(true)
              }}
              className="w-full flex items-center justify-center gap-1.5 bg-white dark:bg-slate-900 border border-blue-200/80 dark:border-slate-800 hover:border-blue-300 dark:hover:border-slate-700 text-blue-600 dark:text-blue-400 font-extrabold text-xs py-3.5 rounded-xl shadow-xs transition-all hover:scale-[1.01] active:scale-[0.99] select-none"
            >
              <Sparkles className="h-3.5 w-3.5 shrink-0" />
              <span>Ask AI about this file</span>
            </button>

          </div>

        </div>

      </div>

      {/* Google Drive-like Sharing Modal Overlay */}
      <AnimatePresence>
        {isShareModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden">
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsShareModalOpen(false)
                setIsSettingsViewOpen(false)
                setActiveCollaboratorDropdownId(null)
                setIsGeneralDropdownOpen(false)
                setIsPublicRoleDropdownOpen(false)
                setIsNewRoleDropdownOpen(false)
              }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ type: 'spring', duration: 0.35, bounce: 0.15 }}
              className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-205 rounded-[28px] shadow-2xl border border-slate-200/80 dark:border-slate-800 w-full max-w-lg mx-4 overflow-visible z-10 font-sans flex flex-col relative max-h-[90vh]"
            >
              {isSettingsViewOpen ? (
                /* Advanced Settings View */
                <div className="flex flex-col h-full animate-fade-in">
                  {/* Settings Header */}
                  <div className="flex items-center gap-3 px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-805 select-none shrink-0">
                    <button
                      onClick={() => setIsSettingsViewOpen(false)}
                      className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800 p-2 rounded-full transition-colors flex items-center justify-center"
                      title="Quay lại"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </button>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-200 tracking-tight">
                      Cài đặt chia sẻ
                    </h2>
                  </div>

                  {/* Settings Options */}
                  <div className="px-6 py-6 flex-1 space-y-6">
                    <label className="flex items-start gap-4 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={editorsCanShare}
                        onChange={(e) => {
                          setEditorsCanShare(e.target.checked)
                          showToast(e.target.checked ? '✅ Người chỉnh sửa hiện có thể thay đổi quyền và chia sẻ.' : '🔒 Người chỉnh sửa không thể thay đổi quyền chia sẻ nữa.')
                        }}
                        className="w-4.5 h-4.5 rounded border-slate-300 dark:border-slate-750 bg-white dark:bg-slate-950 text-blue-600 focus:ring-blue-500 dark:focus:ring-offset-slate-900 mt-1 cursor-pointer"
                      />
                      <div className="flex flex-col text-left">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-normal">
                          Người chỉnh sửa có thể thay đổi quyền và chia sẻ
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold leading-relaxed mt-0.5">
                          Nếu tắt, chỉ chủ sở hữu tài liệu mới có quyền thay đổi cài đặt chia sẻ
                        </span>
                      </div>
                    </label>

                    <label className="flex items-start gap-4 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={viewersCanDownload}
                        onChange={(e) => {
                          setViewersCanDownload(e.target.checked)
                          showToast(e.target.checked ? '✅ Người xem/nhận xét có thể tải xuống, in và sao chép.' : '🔒 Đã khóa tính năng tải xuống, in và sao chép đối với người xem/nhận xét.')
                        }}
                        className="w-4.5 h-4.5 rounded border-slate-300 dark:border-slate-750 bg-white dark:bg-slate-950 text-blue-600 focus:ring-blue-500 dark:focus:ring-offset-slate-900 mt-1 cursor-pointer"
                      />
                      <div className="flex flex-col text-left">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-normal">
                          Người xem và người nhận xét có thể thấy tùy chọn tải xuống, in và sao chép
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold leading-relaxed mt-0.5">
                          Nếu tắt, các nút tải xuống PDF và in tài liệu sẽ bị vô hiệu hóa đối với các tài khoản không phải Người chỉnh sửa
                        </span>
                      </div>
                    </label>
                  </div>

                  {/* Settings Footer */}
                  <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-950/20 border-t border-slate-100 dark:border-slate-805 flex justify-end shrink-0 select-none rounded-b-[28px]">
                    <Button
                      onClick={() => setIsSettingsViewOpen(false)}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-6 py-3.5 rounded-full shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      Quay lại
                    </Button>
                  </div>
                </div>
              ) : (
                /* Main Share Modal View */
                <>
                  {/* Modal Header */}
                  <div className="flex justify-between items-center px-6 pt-6 pb-2 shrink-0 select-none">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-slate-200 tracking-tight leading-normal">
                      Chia sẻ "{title}"
                    </h2>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setIsSettingsViewOpen(true)}
                        className="p-2 rounded-full text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center animate-fade-in"
                        title="Cài đặt chia sẻ"
                      >
                        <Settings className="h-5 w-5 text-slate-400" />
                      </button>
                      <button
                        onClick={() => {
                          setIsShareModalOpen(false)
                          setIsNewRoleDropdownOpen(false)
                          setIsGeneralDropdownOpen(false)
                          setIsPublicRoleDropdownOpen(false)
                          setActiveCollaboratorDropdownId(null)
                        }}
                        className="p-2 rounded-full text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center"
                        title="Đóng"
                      >
                        <X className="h-5 w-5 text-slate-450" />
                      </button>
                    </div>
                  </div>

                  {/* Invite Row */}
                  <div className="px-6 py-4 shrink-0">
                    <form onSubmit={handleAddCollaborator} className="flex gap-2.5 items-center">
                      {/* Input with Mail icon */}
                      <div className="relative flex-1">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Thêm người, nhóm hoặc địa chỉ email"
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          className="w-full pl-11 pr-4 py-3 bg-[#f8fafc] dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 focus:border-blue-500 dark:focus:border-blue-400 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-blue-500/10 rounded-2xl text-xs font-semibold placeholder-slate-450 dark:placeholder-slate-500 text-slate-800 dark:text-slate-200 transition-all focus:outline-none"
                        />
                      </div>

                      {/* Role selection dropdown inside invite row */}
                      <div className="relative shrink-0">
                        <button
                          type="button"
                          onClick={() => setIsNewRoleDropdownOpen(!isNewRoleDropdownOpen)}
                          className="h-[46px] flex items-center gap-1.5 px-4 border border-slate-200/60 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-700 bg-white dark:bg-slate-900 rounded-2xl text-xs font-extrabold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all select-none shadow-xs"
                        >
                          <span>
                            {newRole === 'editor' ? 'Người chỉnh sửa' : newRole === 'commenter' ? 'Người nhận xét' : 'Người xem'}
                          </span>
                          <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0 ml-0.5" />
                        </button>

                        {isNewRoleDropdownOpen && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setIsNewRoleDropdownOpen(false)} />
                            <div className="absolute right-0 mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-2xl z-50 py-1.5 w-44 animate-fade-in text-left">
                              {(['viewer', 'commenter', 'editor'] as const).map((r) => (
                                <button
                                  key={r}
                                  type="button"
                                  onClick={() => {
                                    setNewRole(r)
                                    setIsNewRoleDropdownOpen(false)
                                  }}
                                  className={cn(
                                    "w-full text-left px-4 py-2.5 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between transition-colors",
                                    newRole === r ? "text-blue-600 bg-blue-50/40 dark:text-blue-400 dark:bg-blue-955/20" : "text-slate-700 dark:text-slate-300"
                                  )}
                                >
                                  <span>{r === 'editor' ? 'Người chỉnh sửa' : r === 'commenter' ? 'Người nhận xét' : 'Người xem'}</span>
                                  {newRole === r && <Check className="h-3.5 w-3.5 text-blue-600" />}
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>

                      {/* Circular UserPlus Add button */}
                      <button
                        type="submit"
                        disabled={!newEmail.trim()}
                        className="w-[46px] h-[46px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-100 dark:disabled:hover:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full flex items-center justify-center shadow-xs transition-all active:scale-95 shrink-0"
                        title="Mời cộng tác viên"
                      >
                        <UserPlus className="h-4.5 w-4.5" />
                      </button>
                    </form>
                  </div>

                  <div className="border-t border-slate-100/70 dark:border-slate-805 my-1 mx-6 shrink-0" />

                  {/* Collaborators Section */}
                  <div className="px-6 py-3 flex-1 overflow-visible space-y-4 text-left">
                    <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 tracking-widest uppercase select-none mb-1">
                      Người có quyền truy cập
                    </h3>
                    
                    <div className="space-y-4">
                      {collaborators.map((c) => {
                        const initials = c.name ? c.name.charAt(0).toUpperCase() : 'A'
                        return (
                          <div key={c.id} className="flex items-center justify-between gap-3 py-1">
                            <div className="flex items-center gap-3.5 min-w-0">
                              {/* Colored initials avatar */}
                              <div className={cn("w-[38px] h-[38px] rounded-full flex items-center justify-center font-bold text-sm shadow-inner shrink-0 select-none", c.avatarBg)}>
                                {initials}
                              </div>
                              
                              <div className="min-w-0 text-left">
                                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 leading-normal">
                                  {c.name} 
                                  {c.role === 'owner' && (
                                    <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider scale-90 border border-slate-200/50 dark:border-slate-800">
                                      Chủ sở hữu
                                    </span>
                                  )}
                                </h4>
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold truncate mt-0.5">
                                  {c.email}
                                </p>
                              </div>
                            </div>

                            {/* Dropdown for role */}
                            {c.role !== 'owner' ? (
                              <div className="relative">
                                <button
                                  type="button"
                                  onClick={() => setActiveCollaboratorDropdownId(activeCollaboratorDropdownId === c.id ? null : c.id)}
                                  className="flex items-center gap-1 px-3 py-1.5 border border-slate-200/60 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-bold text-slate-655 dark:text-slate-300 transition-colors select-none shadow-xs"
                                >
                                  <span>
                                    {c.role === 'editor' ? 'Người chỉnh sửa' : c.role === 'commenter' ? 'Người nhận xét' : 'Người xem'}
                                  </span>
                                  <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0 ml-0.5" />
                                </button>

                                {activeCollaboratorDropdownId === c.id && (
                                  <>
                                    <div className="fixed inset-0 z-40" onClick={() => setActiveCollaboratorDropdownId(null)} />
                                    <div className="absolute right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-2xl z-50 py-1.5 w-44 animate-fade-in text-left">
                                      {(['viewer', 'commenter', 'editor'] as const).map((r) => (
                                        <button
                                          key={r}
                                          type="button"
                                          onClick={() => {
                                            handleRoleChange(c.id, r)
                                            setActiveCollaboratorDropdownId(null)
                                          }}
                                          className={cn(
                                            "w-full text-left px-4 py-2.5 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between transition-colors",
                                            c.role === r ? "text-blue-600 bg-blue-50/40 dark:text-blue-400 dark:bg-blue-955/20" : "text-slate-700 dark:text-slate-300"
                                          )}
                                        >
                                          <span>{r === 'editor' ? 'Người chỉnh sửa' : r === 'commenter' ? 'Người nhận xét' : 'Người xem'}</span>
                                          {c.role === r && <Check className="h-4 w-4 text-blue-600" />}
                                        </button>
                                      ))}
                                      
                                      <div className="my-1 border-t border-slate-100 dark:border-slate-805" />
                                      
                                      <button
                                        type="button"
                                        onClick={() => {
                                          handleRemoveCollaborator(c.id, c.name)
                                          setActiveCollaboratorDropdownId(null)
                                        }}
                                        className="w-full text-left px-4 py-2.5 text-xs font-bold text-rose-600 dark:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-955/20 transition-colors"
                                      >
                                        Xóa quyền truy cập
                                      </button>
                                    </div>
                                  </>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 select-none mr-3">
                                Chủ sở hữu
                              </span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* General Access Configuration */}
                  <div className="px-6 py-4 space-y-3.5 shrink-0 border-t border-slate-100/80 dark:border-slate-805">
                    <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest select-none text-left">
                      Quyền truy cập chung
                    </h3>

                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-start gap-3.5 min-w-0 text-left">
                        {/* Circular Access Badge */}
                        <div className={cn(
                          "w-[38px] h-[38px] rounded-full flex items-center justify-center shrink-0 border select-none transition-all duration-300 shadow-inner",
                          generalAccess === 'public'
                            ? "bg-blue-50 dark:bg-blue-955/20 border-blue-100 dark:border-blue-900/40 text-blue-600 dark:text-blue-400"
                            : "bg-slate-50 dark:bg-slate-800 border-slate-200/60 dark:border-slate-700 text-slate-500 dark:text-slate-400"
                        )}>
                          {generalAccess === 'public' ? <Globe className="h-4.5 w-4.5" /> : <Lock className="h-4.5 w-4.5" />}
                        </div>

                        <div className="min-w-0 flex flex-col">
                          {/* Access scope dropdown selector */}
                          <div className="relative inline-block text-left">
                            <button
                              type="button"
                              onClick={() => setIsGeneralDropdownOpen(!isGeneralDropdownOpen)}
                              className="flex items-center gap-1 px-1.5 py-0.5 text-xs font-extrabold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg select-none text-left"
                            >
                              <span>
                                {generalAccess === 'public' ? 'Bất kỳ ai có đường liên kết' : 'Bị hạn chế'}
                              </span>
                              <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0 ml-0.5" />
                            </button>

                            {isGeneralDropdownOpen && (
                              <>
                                <div className="fixed inset-0 z-40" onClick={() => setIsGeneralDropdownOpen(false)} />
                                <div className="absolute left-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-2xl z-50 py-1.5 w-56 animate-fade-in text-left">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setGeneralAccess('restricted')
                                      setIsGeneralDropdownOpen(false)
                                      showToast('🔒 Quyền truy cập chung chuyển sang chế độ Bị hạn chế.')
                                    }}
                                    className={cn(
                                      "w-full text-left px-4 py-2.5 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between transition-colors",
                                      generalAccess === 'restricted' ? "text-blue-600 bg-blue-50/40 dark:text-blue-400 dark:bg-blue-955/20" : "text-slate-700 dark:text-slate-300"
                                    )}
                                  >
                                    <span className="flex items-center gap-2">
                                      <Lock className="h-4 w-4 text-slate-400 shrink-0" />
                                      <span>Bị hạn chế</span>
                                    </span>
                                    {generalAccess === 'restricted' && <Check className="h-4 w-4 text-blue-600" />}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setGeneralAccess('public')
                                      setIsGeneralDropdownOpen(false)
                                      showToast('🌐 Quyền truy cập chung chuyển sang chế độ Công khai.')
                                    }}
                                    className={cn(
                                      "w-full text-left px-4 py-2.5 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between transition-colors",
                                      generalAccess === 'public' ? "text-blue-600 bg-blue-50/40 dark:text-blue-400 dark:bg-blue-955/20" : "text-slate-700 dark:text-slate-300"
                                    )}
                                  >
                                    <span className="flex items-center gap-2">
                                      <Globe className="h-4 w-4 text-slate-450 shrink-0" />
                                      <span>Bất kỳ ai có đường liên kết</span>
                                    </span>
                                    {generalAccess === 'public' && <Check className="h-4 w-4 text-blue-600" />}
                                  </button>
                                </div>
                              </>
                            )}
                          </div>

                          <p className="text-[10px] text-slate-450 dark:text-slate-500 font-medium pl-1.5 mt-0.5 leading-relaxed select-none text-left">
                            {generalAccess === 'public'
                              ? 'Bất kỳ ai trên Internet có đường liên kết này đều có thể truy cập'
                              : 'Chỉ những người được thêm mới có thể mở bằng đường liên kết này'}
                          </p>
                        </div>
                      </div>

                      {/* Public role selector dropdown */}
                      {generalAccess === 'public' && (
                        <div className="relative shrink-0">
                          <button
                            type="button"
                            onClick={() => setIsPublicRoleDropdownOpen(!isPublicRoleDropdownOpen)}
                            className="flex items-center gap-1 px-3 py-1.5 border border-slate-200/60 dark:border-slate-805 hover:border-slate-350 bg-white hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-650 transition-colors select-none shadow-xs"
                          >
                            <span>
                              {publicRole === 'editor' ? 'Người chỉnh sửa' : publicRole === 'commenter' ? 'Người nhận xét' : 'Người xem'}
                            </span>
                            <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0 ml-0.5" />
                          </button>

                          {isPublicRoleDropdownOpen && (
                            <>
                              <div className="fixed inset-0 z-40" onClick={() => setIsPublicRoleDropdownOpen(false)} />
                              <div className="absolute right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-2xl z-50 py-1.5 w-40 animate-fade-in text-left">
                                {(['viewer', 'commenter', 'editor'] as const).map((r) => (
                                  <button
                                    key={r}
                                    type="button"
                                    onClick={() => {
                                      setPublicRole(r)
                                      setIsPublicRoleDropdownOpen(false)
                                      showToast(`✏️ Đã cập nhật quyền truy cập chung thành ${r === 'editor' ? 'Người chỉnh sửa' : r === 'commenter' ? 'Người nhận xét' : 'Người xem'}`)
                                    }}
                                    className={cn(
                                      "w-full text-left px-4 py-2.5 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between transition-colors",
                                      publicRole === r ? "text-blue-600 bg-blue-50/40 dark:text-blue-400 dark:bg-blue-955/20" : "text-slate-700 dark:text-slate-300"
                                    )}
                                  >
                                    <span>{r === 'editor' ? 'Người chỉnh sửa' : r === 'commenter' ? 'Người nhận xét' : 'Người xem'}</span>
                                    {publicRole === r && <Check className="h-3.5 w-3.5 text-blue-600" />}
                                  </button>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Footer */}
                  <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-950/20 border-t border-slate-100 dark:border-slate-805 flex justify-between items-center shrink-0 gap-3 select-none rounded-b-[28px]">
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="flex items-center gap-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-blue-600 dark:text-blue-400 font-extrabold text-xs px-5 py-3 rounded-full shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] outline-none"
                    >
                      <Link className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                      <span>Sao chép đường liên kết</span>
                    </button>

                    <Button
                      onClick={() => {
                        setIsShareModalOpen(false)
                        setActiveCollaboratorDropdownId(null)
                        setIsGeneralDropdownOpen(false)
                        setIsPublicRoleDropdownOpen(false)
                        setIsNewRoleDropdownOpen(false)
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-7 py-3.5 rounded-full shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      Xong
                    </Button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}

        {isAiDrawerOpen && (
          <div className="fixed inset-0 z-50 flex justify-end overflow-hidden">
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!isAiDrawerAnalyzing) {
                  setIsAiDrawerOpen(false)
                }
              }}
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs"
            />

            {/* Sliding Drawer Container */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 220 }}
              className="relative w-full max-w-[480px] bg-slate-50 dark:bg-slate-905 border-l border-slate-200/70 dark:border-slate-800 shadow-2xl flex flex-col h-full z-10 font-sans"
            >
              {/* Header */}
              <div className="bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-805 px-5 py-4 shrink-0 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="bg-blue-600 p-2 rounded-xl text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
                      <Brain className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-800 dark:text-slate-200 text-sm tracking-tight flex items-center gap-1.5 leading-none">
                        AI Study Companion
                        <span className="inline-flex items-center rounded-full bg-blue-50 dark:bg-blue-955/20 px-2 py-0.5 text-[9px] font-black text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40 uppercase tracking-widest scale-95 shadow-2xs">
                          PRO
                        </span>
                      </h3>
                      <p className="text-[10px] text-slate-450 dark:text-slate-500 font-bold leading-normal mt-1 truncate max-w-[260px]">
                        Tài liệu: {title.endsWith('.pdf') ? title : `${title}.pdf`}
                      </p>
                    </div>
                  </div>
                  
                  {/* Close button */}
                  <button
                    onClick={() => setIsAiDrawerOpen(false)}
                    className="p-1.5 rounded-xl text-slate-450 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center"
                    title="Đóng trợ lý"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Sub tabs navigation */}
                <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl items-center select-none w-full">
                  {(['chat', 'concepts', 'quiz'] as const).map((tab) => {
                    const label = tab === 'chat' ? 'Trò chuyện' : tab === 'concepts' ? 'Ý chính' : 'Practice Quiz'
                    const icon = tab === 'chat' ? <Bot className="h-3.5 w-3.5" /> : tab === 'concepts' ? <BookOpen className="h-3.5 w-3.5" /> : <HelpCircle className="h-3.5 w-3.5" />
                    const active = aiDrawerTab === tab
                    return (
                      <button
                        key={tab}
                        onClick={() => setAiDrawerTab(tab)}
                        className={cn(
                          "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-extrabold transition-all outline-none",
                          active
                            ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200/30 dark:border-slate-800"
                            : "text-slate-500 dark:text-slate-450 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200/30 dark:hover:bg-slate-800/30"
                        )}
                      >
                        {icon}
                        <span>{label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto relative flex flex-col">
                
                {/* 1. Chat Tab */}
                {aiDrawerTab === 'chat' && (
                  <div className="flex-1 flex flex-col justify-between h-full min-h-0 bg-[#f8fafc] dark:bg-slate-950">
                    
                    {/* Chat Logs List */}
                    <div className="flex-1 p-5 space-y-4 overflow-y-auto min-h-0">
                      {/* Welcome message and dynamic dialog messages */}
                      {aiDrawerChatLog.map((msg, idx) => {
                        const isUser = msg.sender === 'user'
                        return (
                          <div
                            key={idx}
                            className={cn(
                              "flex gap-3 max-w-[85%]",
                              isUser ? "ml-auto flex-row-reverse" : "mr-auto"
                            )}
                          >
                            {/* Avatar */}
                            {!isUser && (
                              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/10 shrink-0 font-bold text-xs select-none">
                                AI
                              </div>
                            )}

                            {/* Message content block */}
                            <div className="space-y-1.5 text-left">
                              <div
                                className={cn(
                                  "px-4 py-3 rounded-2xl text-xs font-semibold leading-relaxed shadow-sm",
                                  isUser
                                    ? "bg-blue-600 text-white rounded-tr-none"
                                    : "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200/60 dark:border-slate-800 rounded-tl-none"
                                )}
                                style={{ whiteSpace: 'pre-line' }}
                              >
                                {msg.text}

                                {/* Recommendation card payload, if applicable */}
                                {msg.payload && (
                                  <div className="mt-3.5 p-3.5 bg-blue-50/50 dark:bg-blue-955/20 border border-blue-150 dark:border-blue-900/40 rounded-2xl space-y-3 shadow-inner text-slate-800 dark:text-slate-200 select-text">
                                    <div className="flex items-center gap-1.5 select-none">
                                      <Sparkles className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                                      <span className="font-extrabold text-blue-750 dark:text-blue-400 text-[10px] uppercase tracking-wider">
                                        Đề xuất thông tin từ AI
                                      </span>
                                    </div>
                                    
                                    <div className="space-y-1 text-left">
                                      <span className="text-[9px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-widest block">
                                        MÔ TẢ CHI TIẾT
                                      </span>
                                      <p className="text-[10px] font-medium text-slate-705 dark:text-slate-305 leading-normal bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/50 dark:border-slate-800">
                                        {msg.payload.desc}
                                      </p>
                                    </div>

                                    <div className="space-y-1 text-left">
                                      <span className="text-[9px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-widest block">
                                        THẺ TAG ĐỀ XUẤT
                                      </span>
                                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                                        {msg.payload.tags.map(t => (
                                          <span key={t} className="inline-flex rounded-md bg-blue-50 dark:bg-blue-955/20 border border-blue-100 dark:border-blue-900/40 px-2 py-0.5 text-[9px] font-black text-[#2563eb] dark:text-blue-400">
                                            #{t}
                                          </span>
                                        ))}
                                      </div>
                                    </div>

                                    <button
                                      onClick={() => applyAiMetadata(msg.payload!.desc, msg.payload!.tags)}
                                      className="w-full flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[10px] py-2.5 px-3.5 rounded-xl shadow-xs transition-all active:scale-98 select-none"
                                    >
                                      <Check className="h-3.5 w-3.5" />
                                      <span>Áp dụng vào tài liệu</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                              
                              <p className="text-[9px] text-slate-400 font-bold px-1 select-none text-right">
                                {msg.timestamp}
                              </p>
                            </div>
                          </div>
                        )
                      })}

                      {/* Typing indicator */}
                      {isAiDrawerTyping && (
                        <div className="flex gap-3 max-w-[85%] mr-auto">
                          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shrink-0 font-bold text-xs select-none">
                            AI
                          </div>
                          <div className="space-y-1.5 text-left">
                            <div className="px-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 text-slate-500 dark:text-slate-400 rounded-tl-none font-semibold text-xs leading-relaxed shadow-sm flex items-center gap-2">
                              <RefreshCw className="h-3.5 w-3.5 text-blue-600 animate-spin shrink-0" />
                              <span className="animate-pulse">{aiDrawerTypingText}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Bottom sticky panel: Quick Actions + Chat Input */}
                    <div className="bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-805 p-4 space-y-3 shrink-0">
                      {/* Quick Actions horizontal scroll block */}
                      <div className="flex items-center gap-2 overflow-x-auto pb-1 select-none">
                        <button
                          onClick={handleAiAutoFillForm}
                          disabled={isAiDrawerTyping || isAiDrawerAnalyzing}
                          className="flex items-center gap-1 shrink-0 rounded-full bg-blue-50 dark:bg-blue-955/20 hover:bg-blue-100/80 dark:hover:bg-blue-900/40 disabled:opacity-50 border border-blue-100 dark:border-blue-900/40 px-3 py-1.5 text-[10px] font-black text-blue-600 dark:text-blue-400 transition-colors shadow-2xs cursor-pointer"
                        >
                          <Sparkles className="h-3 w-3 text-blue-600" />
                          <span>Tự động điền Mô tả & Tags</span>
                        </button>
                        
                        <button
                          onClick={() => {
                            setAiDrawerTab('concepts')
                            if (!aiConcepts) {
                              handleAiDrawerTriggerAnalysis('concepts')
                            }
                          }}
                          disabled={isAiDrawerTyping || isAiDrawerAnalyzing}
                          className="flex items-center gap-1 shrink-0 rounded-full bg-indigo-50 dark:bg-indigo-950/20 hover:bg-indigo-100/80 dark:hover:bg-indigo-900/40 disabled:opacity-50 border border-indigo-100 dark:border-indigo-900/40 px-3 py-1.5 text-[10px] font-black text-indigo-600 dark:text-indigo-400 transition-colors shadow-2xs cursor-pointer"
                        >
                          <BookOpen className="h-3 w-3 text-indigo-500" />
                          <span>Xem tóm tắt ý chính</span>
                        </button>
                      </div>

                      {/* Chat input form */}
                      <form
                        onSubmit={(e) => {
                          e.preventDefault()
                          handleAiDrawerSendMessage()
                        }}
                        className="flex gap-2 items-center"
                      >
                        <input
                          type="text"
                          value={aiDrawerChatInput}
                          onChange={(e) => setAiDrawerChatInput(e.target.value)}
                          placeholder="Hỏi AI bất cứ điều gì về tài liệu..."
                          disabled={isAiDrawerTyping}
                          className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 focus:border-blue-500 dark:focus:border-blue-400 focus:bg-white dark:focus:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-4 focus:ring-blue-500/10 rounded-2xl text-xs font-semibold placeholder-slate-450 dark:placeholder-slate-500 transition-all focus:outline-none"
                        />
                        <button
                          type="submit"
                          disabled={!aiDrawerChatInput.trim() || isAiDrawerTyping}
                          className="w-[42px] h-[42px] bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-2xl flex items-center justify-center shadow-md shadow-blue-500/10 transition-all active:scale-95 shrink-0"
                          title="Gửi câu hỏi"
                        >
                          <Send className="h-4.5 w-4.5" />
                        </button>
                      </form>
                    </div>

                  </div>
                )}

                {/* 2. Key Concepts Tab */}
                {aiDrawerTab === 'concepts' && (
                  <div className="flex-1 p-5 space-y-5 bg-[#f8fafc] dark:bg-slate-950">
                    
                    {/* If Analyzing scanning screen */}
                    {isAiDrawerAnalyzing && (
                      <div className="flex flex-col items-center justify-center py-20 px-6 space-y-6 text-center h-full my-auto animate-fade-in select-none">
                        {/* Glowing Scanner logo */}
                        <div className="relative">
                          <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full scale-150 animate-pulse" />
                          <div className="w-16 h-16 rounded-2xl bg-blue-650 text-white flex items-center justify-center shadow-lg relative border border-blue-550/30">
                            <BookOpen className="h-8 w-8 animate-pulse text-white" />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h4 className="text-sm font-black text-slate-800 dark:text-slate-200 tracking-tight uppercase">
                            AI đang đọc hiểu tài liệu...
                          </h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold leading-relaxed max-w-[280px]">
                            {aiDrawerAnalysisStep}
                          </p>
                        </div>

                        {/* Neural scanning loading bar */}
                        <div className="w-64 bg-slate-200/80 dark:bg-slate-800 rounded-full h-2 overflow-hidden shadow-inner border border-slate-300/40 relative">
                          <motion.div
                            className="bg-gradient-to-r from-blue-600 to-indigo-500 h-full rounded-full"
                            style={{ width: `${aiDrawerProgress}%` }}
                            transition={{ ease: 'easeInOut', duration: 0.3 }}
                          />
                        </div>

                        <span className="text-xs font-black text-blue-600 tracking-wider">
                          {aiDrawerProgress}% HOÀN TẤT
                        </span>
                      </div>
                    )}

                    {/* If Not generated onboarding screen */}
                    {!isAiDrawerAnalyzing && !aiConcepts && (
                      <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-6 shadow-sm text-center py-12 space-y-6 select-none my-auto">
                        <div className="mx-auto w-14 h-14 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-150 dark:border-indigo-900/40 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                          <Brain className="h-7 w-7" />
                        </div>
                        
                        <div className="space-y-2 max-w-sm mx-auto">
                          <h4 className="font-extrabold text-slate-800 dark:text-slate-205 text-sm tracking-tight leading-normal">
                            Trích xuất ý chính học thuật
                          </h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                            Hệ thống AI sẽ tự động đọc hiểu toàn bộ nội dung tài liệu của bạn, phân tích định nghĩa cốt lõi, sơ đồ liên kết chuyên ngành và lưu trữ các điểm mấu chốt ôn thi.
                          </p>
                        </div>

                        <button
                          onClick={() => handleAiDrawerTriggerAnalysis('concepts')}
                          className="w-full flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs py-3.5 rounded-2xl shadow-md transition-all active:scale-98"
                        >
                          <Sparkles className="h-4 w-4 shrink-0" />
                          <span>✦ Trích xuất ý chính ngay</span>
                        </button>
                      </div>
                    )}

                    {/* If generated result */}
                    {!isAiDrawerAnalyzing && aiConcepts && (
                      <div className="space-y-4 animate-fade-in text-left w-full">
                        {/* Header bar controls */}
                        <div className="flex justify-between items-center bg-white dark:bg-slate-900 border border-slate-200/65 dark:border-slate-805 rounded-2xl px-4 py-3 select-none shadow-2xs">
                          <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                            {aiConcepts.length} Ý chính cốt lõi
                          </span>
                          
                          <button
                            onClick={() => handleAiDrawerTriggerAnalysis('concepts')}
                            className="text-xs font-black text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
                          >
                            <RefreshCw className="h-3 w-3 text-blue-600" />
                            Phân tích lại
                          </button>
                        </div>

                        {/* Concept card items */}
                        <div className="space-y-3.5">
                          {aiConcepts.map((concept, idx) => {
                            const titlePart = concept.split(':')[0]
                            const descPart = concept.split(':').slice(1).join(':')
                            return (
                              <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4.5 shadow-sm space-y-2 flex gap-3 text-left relative overflow-hidden">
                                <div className="absolute top-0 left-0 bottom-0 w-1 bg-blue-500" />
                                <div className="bg-blue-50 dark:bg-blue-955/20 p-2 rounded-xl text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 w-8.5 h-8.5">
                                  <Sparkles className="h-4 w-4" />
                                </div>
                                <div className="space-y-1">
                                  <h5 className="font-extrabold text-slate-800 dark:text-slate-200 text-xs tracking-tight leading-snug">
                                    {titlePart}
                                  </h5>
                                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                                    {descPart.trim()}
                                  </p>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                  </div>
                )}

                {/* 3. Practice Quiz Tab */}
                {aiDrawerTab === 'quiz' && (
                  <div className="flex-1 p-5 space-y-5 bg-[#f8fafc] dark:bg-slate-950 overflow-y-auto">
                    
                    {/* If Analyzing scanning screen */}
                    {isAiDrawerAnalyzing && (
                      <div className="flex flex-col items-center justify-center py-20 px-6 space-y-6 text-center h-full my-auto animate-fade-in select-none">
                        <div className="relative">
                          <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full scale-150 animate-pulse" />
                          <div className="w-16 h-16 rounded-2xl bg-blue-650 text-white flex items-center justify-center shadow-lg relative border border-blue-550/30">
                            <HelpCircle className="h-8 w-8 animate-pulse text-white" />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h4 className="text-sm font-black text-slate-800 dark:text-slate-200 tracking-tight uppercase">
                            AI Đang thiết kế đề ôn thi...
                          </h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold leading-relaxed max-w-[280px]">
                            {aiDrawerAnalysisStep}
                          </p>
                        </div>

                        {/* Neural scanning loading bar */}
                        <div className="w-64 bg-slate-200/80 dark:bg-slate-800 rounded-full h-2 overflow-hidden shadow-inner border border-slate-300/40 relative">
                          <motion.div
                            className="bg-gradient-to-r from-blue-600 to-indigo-500 h-full rounded-full"
                            style={{ width: `${aiDrawerProgress}%` }}
                            transition={{ ease: 'easeInOut', duration: 0.3 }}
                          />
                        </div>

                        <span className="text-xs font-black text-blue-600 tracking-wider">
                          {aiDrawerProgress}% HOÀN TẤT
                        </span>
                      </div>
                    )}

                    {/* If Not generated onboarding screen */}
                    {!isAiDrawerAnalyzing && !aiQuiz && (
                      <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-6 shadow-sm text-center py-12 space-y-6 select-none my-auto">
                        <div className="mx-auto w-14 h-14 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-150 dark:border-indigo-900/40 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                          <HelpCircle className="h-7 w-7" />
                        </div>
                        
                        <div className="space-y-2 max-w-sm mx-auto">
                          <h4 className="font-extrabold text-slate-800 dark:text-slate-205 text-sm tracking-tight leading-normal">
                            Tạo đề trắc nghiệm thử (Quiz)
                          </h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                            Hệ thống AI sẽ tự động cô đọng cấu trúc học thuật của tài liệu và sinh ngẫu nhiên đề thi 3 câu hỏi trắc nghiệm cùng đáp án/giải thích cụ thể, giúp bạn tăng tốc độ phản xạ ôn tập!
                          </p>
                        </div>

                        <button
                          onClick={() => handleAiDrawerTriggerAnalysis('quiz')}
                          className="w-full flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs py-3.5 rounded-2xl shadow-md transition-all active:scale-98"
                        >
                          <Sparkles className="h-4 w-4 shrink-0" />
                          <span>✦ Tạo đề ôn tập thử</span>
                        </button>
                      </div>
                    )}

                    {/* If generated result */}
                    {!isAiDrawerAnalyzing && aiQuiz && (
                      <div className="space-y-5 animate-fade-in text-left">
                        
                        {/* Score Banner panel (Only shown when submitted) */}
                        {aiQuizSubmitted && (
                          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-md flex items-center gap-4 text-left relative overflow-hidden select-none animate-fade-in animate-fade-in">
                            <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-emerald-500" />
                            
                            {/* Score Ring circular visualization */}
                            {(() => {
                              const correctCount = aiQuiz.filter((q, qIdx) => aiQuizAnswers[qIdx] === q.correct).length
                              const scorePercentage = Math.round((correctCount / aiQuiz.length) * 100)
                              return (
                                <>
                                  <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
                                    {/* Radial progress ring SVG */}
                                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                      <path
                                        className="text-slate-150 dark:text-slate-850"
                                        strokeWidth="3"
                                        stroke="currentColor"
                                        fill="none"
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                      />
                                      <path
                                        className="text-emerald-500"
                                        strokeWidth="3.2"
                                        strokeDasharray={`${scorePercentage}, 100`}
                                        strokeLinecap="round"
                                        stroke="currentColor"
                                        fill="none"
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                      />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-800 dark:text-slate-200">
                                      <span className="text-xs font-black leading-none">{correctCount}/{aiQuiz.length}</span>
                                      <span className="text-[7px] font-black text-slate-400 dark:text-slate-500 tracking-wider mt-0.5">{scorePercentage}%</span>
                                    </div>
                                  </div>

                                  <div className="space-y-1">
                                    <h4 className="font-extrabold text-slate-800 dark:text-slate-200 text-xs tracking-tight flex items-center gap-1.5 leading-none">
                                      <Award className="h-4.5 w-4.5 text-emerald-500" />
                                      {scorePercentage === 100 ? 'Tuyệt đỉnh học thần!' : scorePercentage >= 60 ? 'Hoàn thành xuất sắc!' : 'Hãy cố gắng thêm!'}
                                    </h4>
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal font-semibold max-w-[240px] mt-1">
                                      {scorePercentage === 100
                                        ? 'Bạn đã giải đúng 100% câu hỏi! Toàn bộ kiến thức đã được tiếp thu hoàn hảo.'
                                        : scorePercentage >= 60
                                        ? 'Bạn chỉ sai sót nhỏ. Hãy kiểm tra các câu đỏ bên dưới và đọc lại phần giải đáp.'
                                        : 'Đừng nản chí! Nhấn nút "Làm lại đề mới" để AI tạo bộ câu hỏi luyện tập khác.'}
                                    </p>
                                  </div>
                                </>
                              )
                            })()}
                          </div>
                        )}

                        {/* Questions list */}
                        <div className="space-y-5">
                          {aiQuiz.map((q, qIdx) => {
                            const userAnswer = aiQuizAnswers[qIdx]
                            const isCorrect = userAnswer === q.correct
                            
                            return (
                              <div key={qIdx} className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3.5 text-left">
                                <div className="flex items-start gap-2.5 justify-between">
                                  <span className="inline-flex rounded-lg bg-blue-50 dark:bg-blue-955/20 px-2.5 py-1 text-[9px] font-black text-[#2563eb] dark:text-blue-400 border border-blue-100 dark:border-blue-900/40 uppercase tracking-widest shrink-0 shadow-2xs select-none">
                                    CÂU HỎI {qIdx + 1}
                                  </span>

                                  {/* Result badge post submission */}
                                  {aiQuizSubmitted && (
                                    <span className={cn(
                                      "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black tracking-widest uppercase shadow-2xs select-none border",
                                      isCorrect
                                        ? "bg-emerald-50 dark:bg-emerald-955/20 border-emerald-100 dark:border-emerald-900/40 text-emerald-600 dark:text-emerald-400"
                                        : "bg-rose-50 dark:bg-rose-955/20 border-rose-100 dark:border-rose-900/40 text-rose-600 dark:text-rose-400"
                                    )}>
                                      {isCorrect ? 'ĐÚNG ✓' : 'SAI ✗'}
                                    </span>
                                  )}
                                </div>

                                <h5 className="font-extrabold text-slate-800 dark:text-slate-200 text-xs leading-relaxed">
                                  {q.question}
                                </h5>

                                {/* Options grid */}
                                <div className="space-y-2">
                                  {q.options.map((opt: string, optIdx: number) => {
                                    const isSelected = userAnswer === optIdx
                                    
                                    // Option item background & border calculation
                                    let optionStyle = "border-slate-200 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-700 bg-slate-50/20 dark:bg-slate-950/20 text-slate-700 dark:text-slate-300"
                                    if (isSelected && !aiQuizSubmitted) {
                                      optionStyle = "border-blue-500 bg-blue-50/40 dark:bg-blue-955/20 text-blue-700 dark:text-blue-400 shadow-2xs font-extrabold"
                                    } else if (aiQuizSubmitted) {
                                      if (optIdx === q.correct) {
                                        // The correct answer always lights up green
                                        optionStyle = "border-emerald-400 dark:border-emerald-800/80 bg-emerald-50/50 dark:bg-emerald-955/20 text-emerald-805 dark:text-emerald-400 font-extrabold shadow-sm"
                                      } else if (isSelected && !isCorrect) {
                                        // The selected incorrect answer lights up red
                                        optionStyle = "border-rose-400 dark:border-rose-800/80 bg-rose-50/50 dark:bg-rose-955/20 text-rose-805 dark:text-rose-400 font-extrabold shadow-sm"
                                      } else {
                                        optionStyle = "border-slate-200/60 dark:border-slate-850 bg-slate-55/10 dark:bg-slate-905/10 opacity-60 pointer-events-none"
                                      }
                                    }

                                    return (
                                      <button
                                        key={optIdx}
                                        type="button"
                                        disabled={aiQuizSubmitted}
                                        onClick={() => {
                                          setAiQuizAnswers(prev => ({ ...prev, [qIdx]: optIdx }))
                                        }}
                                        className={cn(
                                          "w-full text-left px-4 py-3 rounded-2xl border text-xs font-semibold flex items-center justify-between transition-all outline-none",
                                          optionStyle
                                        )}
                                      >
                                        <span className="leading-relaxed pr-2">{opt}</span>
                                        
                                        {/* Status bullet icon */}
                                        {aiQuizSubmitted ? (
                                          optIdx === q.correct ? (
                                            <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm text-[10px] font-black select-none">✓</span>
                                          ) : isSelected && !isCorrect ? (
                                            <span className="w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-sm text-[10px] font-black select-none">✗</span>
                                          ) : null
                                        ) : (
                                          <div className={cn(
                                            "w-4 h-4 rounded-full border shrink-0 flex items-center justify-center transition-all",
                                            isSelected ? "border-blue-500 bg-blue-600 text-white" : "border-slate-350 dark:border-slate-700 bg-white dark:bg-slate-950"
                                          )}>
                                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                          </div>
                                        )}
                                      </button>
                                    )
                                  })}
                                </div>
                              </div>
                            )
                          })}
                        </div>

                        {/* Submit or regenerate footer controls */}
                        <div className="pt-2 select-none">
                          {aiQuizSubmitted ? (
                            <button
                              onClick={() => handleAiDrawerTriggerAnalysis('quiz')}
                              className="w-full flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs py-3.5 rounded-2xl shadow-md transition-all active:scale-98"
                            >
                              <RotateCcw className="h-4 w-4 shrink-0" />
                              <span>Làm lại đề mới</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                const allDone = aiQuiz.every((_, idx) => aiQuizAnswers[idx] !== undefined)
                                if (!allDone) {
                                  showToast('⚠️ Vui lòng hoàn tất trả lời toàn bộ câu hỏi trước khi nộp bài!')
                                  return
                                }
                                setAiQuizSubmitted(true)
                                showToast('📝 Đã nộp bài thi thành công! AI đang tính điểm ôn luyện...')
                              }}
                              className="w-full flex items-center justify-center gap-1.5 bg-[#0fbf7c] hover:bg-emerald-700 text-white font-extrabold text-xs py-3.5 rounded-2xl shadow-md transition-all active:scale-98"
                            >
                              <Check className="h-4 w-4 shrink-0" />
                              <span>Nộp bài & Chấm điểm</span>
                            </button>
                          )}
                        </div>
                        
                      </div>
                    )}

                  </div>
                )}

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>


    </div>
  )
}
