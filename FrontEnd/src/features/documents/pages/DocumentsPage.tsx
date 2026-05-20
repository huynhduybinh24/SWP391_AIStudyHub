import { useState, useEffect, useRef } from 'react'
import {
  Search,
  ChevronDown,
  Grid,
  List,
  MoreVertical,
  FileText,
  FileCode,
  Image as ImageIcon,
  FolderDown,
  BookOpen,
  Sparkles,
  Plus,
  CloudUpload,
  Trash2,
  ExternalLink,
  Download,
  MessageSquare,
  Send,
  X,
  Bot,
  SlidersHorizontal,
  FolderPlus,
  Clock,
  HardDrive,
  CheckCircle2,
  TrendingUp,
  BrainCircuit,
  HelpCircle,
  FileSpreadsheet,
  FileCheck
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { cn } from '@/lib/utils'

// 1. Define typescript interface for Documents
interface DocumentItem {
  id: string
  title: string
  fileName: string
  uploadedAt: string
  uploadedDateObj: Date
  size: string
  sizeKb: number
  subject: 'MATHEMATICS' | 'BIOLOGY' | 'PHYSICS' | 'COMPSCI' | 'PHILOSOPHY' | 'ECONOMICS' | 'GENERAL'
  status: 'ANALYZED' | 'PENDING' | 'SCANNING' | 'QUEUED'
  type: 'pdf' | 'word' | 'image' | 'text' | 'slides'
}

// 2. Initial Mock Data matching the Figma screen exactly
const INITIAL_DOCUMENTS: DocumentItem[] = [
  {
    id: 'doc-1',
    title: '', // Unnamed in Figma
    fileName: 'Mathematics_Cheat_Sheet.pdf',
    uploadedAt: 'Uploaded Oct 12, 2024',
    uploadedDateObj: new Date('2024-10-12'),
    size: '2.4 MB',
    sizeKb: 2457,
    subject: 'MATHEMATICS',
    status: 'ANALYZED',
    type: 'pdf',
  },
  {
    id: 'doc-2',
    title: 'Molecular Biology Lect',
    fileName: 'Molecular_Biology_Lecture_Notes.docx',
    uploadedAt: 'Uploaded Oct 14, 2024',
    uploadedDateObj: new Date('2024-10-14'),
    size: '1.1 MB',
    sizeKb: 1126,
    subject: 'BIOLOGY',
    status: 'PENDING',
    type: 'word',
  },
  {
    id: 'doc-3',
    title: 'Introduction to Quantum',
    fileName: 'Intro_to_Quantum_Mechanics.txt',
    uploadedAt: 'Uploaded Oct 08, 2024',
    uploadedDateObj: new Date('2024-10-08'),
    size: '5.7 MB',
    sizeKb: 5836,
    subject: 'PHYSICS',
    status: 'ANALYZED',
    type: 'text',
  },
  {
    id: 'doc-4',
    title: 'Whiteboard - Neural Ne',
    fileName: 'Neural_Networks_Whiteboard.png',
    uploadedAt: 'Uploaded Yesterday',
    uploadedDateObj: new Date(Date.now() - 24 * 60 * 60 * 1000),
    size: '12.4 MB',
    sizeKb: 12697,
    subject: 'COMPSCI',
    status: 'SCANNING',
    type: 'image',
  },
  {
    id: 'doc-5',
    title: '', // Unnamed in Figma
    fileName: 'Philosophy_101_Notes.pdf',
    uploadedAt: 'Uploaded 2 days ago',
    uploadedDateObj: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    size: '890 KB',
    sizeKb: 890,
    subject: 'PHILOSOPHY',
    status: 'ANALYZED',
    type: 'pdf',
  },
  {
    id: 'doc-6',
    title: 'Genetics Lab Report Dr',
    fileName: 'Genetics_Lab_Report_Draft.docx',
    uploadedAt: 'Uploaded 3 days ago',
    uploadedDateObj: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    size: '1.8 MB',
    sizeKb: 1843,
    subject: 'BIOLOGY',
    status: 'ANALYZED',
    type: 'word',
  },
  {
    id: 'doc-7',
    title: 'Macroeconomics Data',
    fileName: 'Macroeconomics_Q3_Dataset.xlsx',
    uploadedAt: 'Uploaded Oct 01, 2024',
    uploadedDateObj: new Date('2024-10-01'),
    size: '15.2 MB',
    sizeKb: 15564,
    subject: 'ECONOMICS',
    status: 'QUEUED',
    type: 'slides',
  },
]

// 3. Realistic outline content database for preview modal
interface SubjectContent {
  previewText: string
  summaryBullets: string[]
  flashcards: Array<{ q: string; a: string }>
}

const SUBJECTS_CONTENT_DB: Record<string, SubjectContent> = {
  MATHEMATICS: {
    previewText: `SECTION 1: FUNDAMENTAL ALGEBRA & CALCULUS FORMULAS
1.1 Derivatives of Trigonometric Functions:
  - d/dx [sin(x)] = cos(x)
  - d/dx [cos(x)] = -sin(x)
  - d/dx [tan(x)] = sec²(x)
1.2 Fundamental Integrals:
  - ∫ x^n dx = (x^(n+1))/(n+1) + C  (for n ≠ -1)
  - ∫ 1/x dx = ln|x| + C
1.3 Limits & Series Taylor:
  - e^x = ∑ (x^n)/(n!) = 1 + x + x²/2! + x³/3! + ...
  - sin(x) = x - x³/3! + x⁵/5! - x⁷/7! + ...`,
    summaryBullets: [
      'Cung cấp bảng tóm tắt đạo hàm và tích phân của các hàm lượng giác cơ bản.',
      'Trình bày chi tiết công thức tích phân phân kỳ và điều kiện áp dụng tích phân số.',
      'Giải thích cách khai triển chuỗi Taylor và chuỗi Maclaurin của các hàm số phổ biến.',
      'Định nghĩa các giới hạn đặc biệt phục vụ tính nhanh đạo hàm phức hợp.'
    ],
    flashcards: [
      { q: 'Đạo hàm của sin(x) là gì?', a: 'cos(x)' },
      { q: 'Công thức Euler liên hệ 5 hằng số toán học quan trọng nhất?', a: 'e^(i*π) + 1 = 0' },
      { q: 'Đạo hàm của ln(x) là gì?', a: '1/x' },
    ]
  },
  BIOLOGY: {
    previewText: `CHAPTER 3: CELL STRUCTURE & GENETIC MECHANISMS
3.1 Organelle Functions:
  - Mitochondria: Primary site of ATP (Adenosine Triphosphate) synthesis via cellular respiration.
  - Ribosomes: Responsible for decoding mRNA transcript and assembling polypeptide chains.
3.2 DNA Replication & Transcription:
  - Transcription occurs in the nucleus where DNA acts as a template for RNA polymerase.
  - Translation takes place in cytoplasm on ribosomal complexes.
3.3 Genetics & Heredity:
  - Mendel's laws of segregation and independent assortment.`,
    summaryBullets: [
      'Phân tích chi tiết cấu tạo các bào quan trong tế bào nhân thực và nhân sơ.',
      'Mô tả quy trình phiên mã ngược của DNA và dịch mã tổng hợp protein ở tế bào.',
      'Tóm tắt quy luật di truyền của Mendel cùng tỉ lệ kiểu hình kiểu gen cơ bản.',
      'Đặc tả chức năng tổng hợp năng lượng ATP của Ty thể trong tế bào.'
    ],
    flashcards: [
      { q: 'Ty thể đóng vai trò gì trong tế bào?', a: 'Tổng hợp năng lượng ATP thông qua hô hấp tế bào.' },
      { q: 'Phiên mã (Transcription) diễn ra ở đâu?', a: 'Trong nhân tế bào (ở sinh vật nhân thực).' },
      { q: 'Bazơ nitơ nào thay thế Thymine trong phân tử RNA?', a: 'Uracil (U).' },
    ]
  },
  PHYSICS: {
    previewText: `UNIT 4: QUANTUM MECHANICS AND WAVE FUNCTIONS
4.1 Wave-Particle Duality:
  - De Broglie Wavelength: λ = h/p, where h is Planck's constant and p is momentum.
  - Photoelectric Effect confirms light behaves as particles called photons.
4.2 Schrödinger Equation:
  - Time-independent formulation: Ĥψ = Eψ, where Ĥ is the Hamiltonian operator.
4.3 Quantum Tunneling:
  - Phenomenon where a particle passes through a potential barrier higher than its kinetic energy.`,
    summaryBullets: [
      'Giới thiệu lưỡng tính sóng hạt của vật chất thông qua bước sóng De Broglie.',
      'Trình bày ý nghĩa vật lý của phương trình Schrödinger độc lập thời gian.',
      'Giải thích hiện tượng đường hầm lượng tử và ứng dụng trong linh kiện bán dẫn.',
      'Định lượng hiện tượng quang điện ngoài chứng minh bản chất hạt của ánh sáng.'
    ],
    flashcards: [
      { q: 'Hằng số Planck bằng bao nhiêu?', a: '6.626 x 10^-34 J·s' },
      { q: 'Phương trình Schrödinger tổng quát có dạng nào?', a: 'Ĥψ = Eψ (Ĥ là toán tử Hamiltonian)' },
      { q: 'Hiện tượng đường hầm lượng tử là gì?', a: 'Hạt vượt qua một rào cản thế năng cao hơn động năng của chính nó.' },
    ]
  },
  COMPSCI: {
    previewText: `DEEP LEARNING: NEURAL NETWORKS & BACKPROPAGATION
5.1 Network Architecture:
  - Input Layer -> Hidden Layers (weights, biases) -> Activation -> Output Layer.
  - Common activation functions: ReLU(x) = max(0, x), Sigmoid(x) = 1/(1 + e^-x).
5.2 Backpropagation Algorithm:
  - Computes the gradient of the loss function with respect to weights using chain rule.
  - Optimizer (e.g. Adam, SGD) updates weights: W = W - η * ∂L/∂W.`,
    summaryBullets: [
      'Khái quát cấu trúc mạng nơ-ron nhân tạo gồm các lớp ẩn, trọng số và độ lệch.',
      'Định nghĩa các hàm kích hoạt phổ biến: ReLU, Sigmoid và Leaky ReLU.',
      'Mô tả quy trình thuật toán Lan truyền ngược (Backpropagation) sử dụng quy tắc chuỗi.',
      'Tóm tắt các bộ tối ưu phổ biến giúp cập nhật trọng số hiệu quả (Adam, SGD).'
    ],
    flashcards: [
      { q: 'Lan truyền ngược (Backpropagation) dùng để làm gì?', a: 'Tính toán đạo hàm riêng của hàm mất mát theo từng trọng số để cập nhật mạng.' },
      { q: 'Hàm ReLU định nghĩa như thế nào?', a: 'ReLU(x) = max(0, x)' },
      { q: 'Tốc độ học (Learning rate - η) đóng vai trò gì?', a: 'Quyết định độ lớn của bước cập nhật trọng số trong mỗi chu kỳ tối ưu.' },
    ]
  },
  PHILOSOPHY: {
    previewText: `PHILOSOPHY 101: RATIONALISM AND SKEPTICISM
1.1 René Descartes & Epistemology:
  - Method of Doubt: Stripping away all beliefs that can be doubted to reach absolute certainty.
  - First Principle: "Cogito, ergo sum" (I think, therefore I am).
1.2 Rationalism vs. Empiricism:
  - Rationalists (Descartes, Spinoza) claim knowledge comes from reason.
  - Empiricists (Locke, Hume) argue knowledge comes entirely from sensory experience.`,
    summaryBullets: [
      'Khảo sát phương pháp hoài nghi hệ thống của René Descartes nhằm tìm điểm tựa chân lý.',
      'Phân tích sự khác biệt cốt lõi giữa hai trường phái Triết học: Duy lý và Duy nghiệm.',
      'Giải thích ý nghĩa triết học của câu nói kinh điển "Tôi tư duy, nên tôi tồn tại".',
      'Tóm tắt các vấn đề nhận thức luận về nguồn gốc của tri thức nhân loại.'
    ],
    flashcards: [
      { q: 'Triết lý "Cogito, ergo sum" nghĩa là gì?', a: '"Tôi tư duy, nên tôi tồn tại" (René Descartes).' },
      { q: 'Nhận thức luận (Epistemology) nghiên cứu vấn đề gì?', a: 'Nghiên cứu về bản chất, nguồn gốc và giới hạn của tri thức.' },
      { q: 'Thuyết duy nghiệm (Empiricism) tin tri thức bắt nguồn từ đâu?', a: 'Hoàn toàn từ trải nghiệm giác quan và thực nghiệm thực tế.' },
    ]
  },
  ECONOMICS: {
    previewText: `MACROECONOMICS: ANALYSIS OF AGGREGATE DEMAND & FISCAL POLICY
1.1 Macroeconomic Indicators:
  - Gross Domestic Product (GDP): Total monetary value of finished goods produced within a country.
  - Inflation Rate: Measured via Consumer Price Index (CPI).
1.2 Keynesian Multiplier:
  - Formula: K = 1 / (1 - MPC), where MPC is Marginal Propensity to Consume.
1.3 Central Bank Tools:
  - Reserve requirements, discount rates, and open market operations.`,
    summaryBullets: [
      'Khái quát các chỉ số vĩ mô cốt lõi của nền kinh tế gồm GDP, lạm phát và thất nghiệp.',
      'Phân tích công thức Số nhân Keynes phản ánh tác động của chi tiêu chính phủ.',
      'Tóm tắt các công cụ điều hành chính sách tiền tệ của Ngân hàng Trung ương.',
      'Giải thích mối quan hệ nghịch biến giữa lạm phát và thất nghiệp ngắn hạn.'
    ],
    flashcards: [
      { q: 'GDP viết tắt của từ gì và định nghĩa?', a: 'Gross Domestic Product (Tổng sản phẩm quốc nội), tổng giá trị sản phẩm hoàn thiện trong nước.' },
      { q: 'Chỉ số CPI dùng để đo lường điều gì?', a: 'Consumer Price Index (Chỉ số giá tiêu dùng) dùng để đo lường lạm phát.' },
      { q: 'Chính sách tài khóa do cơ quan nào điều hành?', a: 'Chính phủ (thông qua thuế và chi tiêu công).' },
    ]
  },
  GENERAL: {
    previewText: `GENERAL EDUCATION: STUDY SKILLS AND INTEGRATIVE METHODS
1.1 Effective Learning Practices:
  - Active Recall: Testing your memory during learning rather than passive review.
  - Spaced Repetition: Reviewing material at expanding intervals to optimize brain retention.
  - Feynman Technique: Explaining concepts in simple terms to spot knowledge gaps.
1.2 Synthesis & Academic Writing:
  - Constructing structured outlines, citation standards, and reference frameworks.`,
    summaryBullets: [
      'Giới thiệu phương pháp Active Recall (Chủ động gợi nhớ) giúp tăng hiệu quả ghi nhớ sâu.',
      'Giải thích cơ chế ôn tập ngắt quãng Spaced Repetition dựa trên đường cong lãng quên.',
      'Hướng dẫn áp dụng kỹ thuật Feynman học sâu bằng cách giảng giải đơn giản.',
      'Định hình cách thiết lập dàn bài học thuật chuẩn hóa cho học tập nghiên cứu.'
    ],
    flashcards: [
      { q: 'Active Recall là phương pháp gì?', a: 'Chủ động kiểm tra trí nhớ bằng cách tự hỏi và trả lời thay vì chỉ đọc lại bài học.' },
      { q: 'Kỹ thuật Feynman hoạt động thế nào?', a: 'Giải thích lại một khái niệm phức tạp bằng ngôn từ đơn giản nhất như thể đang giảng cho một đứa trẻ.' },
      { q: 'Lặp lại ngắt quãng (Spaced Repetition) dựa trên hiện tượng nào?', a: 'Đường cong quên lãng (Forgetting Curve) của Ebbinghaus.' },
    ]
  }
}

export function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>(INITIAL_DOCUMENTS)
  const [searchQuery, setSearchQuery] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('All')
  const [typeFilter, setTypeFilter] = useState('All')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  
  // Modals & Drawers state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [isChatDrawerOpen, setIsChatDrawerOpen] = useState(false)
  const [selectedDocForChat, setSelectedDocForChat] = useState<DocumentItem | null>(null)
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null)

  // ENHANCED state: Document Viewer Modal
  const [activePreviewDoc, setActivePreviewDoc] = useState<DocumentItem | null>(null)
  const [activePreviewTab, setActivePreviewTab] = useState<'preview' | 'summary' | 'flashcards'>('preview')
  const [activeFlashcardIndex, setActiveFlashcardIndex] = useState(0)
  const [isFlashcardFlipped, setIsFlashcardFlipped] = useState(false)

  // ENHANCED state: AI Workspace Analytics Modal
  const [isInsightsModalOpen, setIsInsightsModalOpen] = useState(false)

  // ENHANCED state: Per-document chat state store
  const [documentChats, setDocumentChats] = useState<Record<string, Array<{ sender: 'user' | 'ai'; text: string; time: string }>>>({})
  const [newChatMessage, setNewChatMessage] = useState('')

  // ENHANCED state: Dynamic Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [isToastVisible, setIsToastVisible] = useState(false)

  // Upload Form state
  const [newDocTitle, setNewDocTitle] = useState('')
  const [newDocSubject, setNewDocSubject] = useState<'MATHEMATICS' | 'BIOLOGY' | 'PHYSICS' | 'COMPSCI' | 'PHILOSOPHY' | 'ECONOMICS' | 'GENERAL'>('GENERAL')
  const [newDocType, setNewDocType] = useState<'pdf' | 'word' | 'image' | 'text' | 'slides'>('pdf')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  
  // Progress simulation state
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStepMsg, setUploadStepMsg] = useState('')

  // Refs for clicking outside menus
  const menuRef = useRef<HTMLDivElement>(null)

  // Helper trigger notification toast
  const showToast = (message: string) => {
    setToastMessage(message)
    setIsToastVisible(true)
  }

  useEffect(() => {
    if (isToastVisible) {
      const timer = setTimeout(() => {
        setIsToastVisible(false)
      }, 3500)
      return () => clearTimeout(timer)
    }
  }, [isToastVisible])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (activeMenuId && menuRef.current && !menuRef.current.contains(event.target as Node)) {
        const target = event.target as HTMLElement
        if (!target.closest('.menu-trigger-btn')) {
          setActiveMenuId(null)
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [activeMenuId])

  // Filter logic
  const filteredDocuments = documents.filter((doc) => {
    const titleMatch = doc.title.toLowerCase().includes(searchQuery.toLowerCase())
    const filenameMatch = doc.fileName.toLowerCase().includes(searchQuery.toLowerCase())
    const queryMatch = searchQuery ? (titleMatch || filenameMatch) : true

    const subjectMatch = subjectFilter === 'All' ? true : doc.subject === subjectFilter.toUpperCase()
    const typeMatch = typeFilter === 'All' ? true : doc.type === typeFilter.toLowerCase()

    return queryMatch && subjectMatch && typeMatch
  })

  // Simulated upload action
  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile && !newDocTitle) return

    setIsUploading(true)
    setUploadProgress(5)
    setUploadStepMsg('Establishing secure connection...')

    // Step 1: Uploading progress
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev < 40) {
          setUploadStepMsg('Uploading file chunk...')
          return prev + Math.floor(Math.random() * 15) + 5
        } else if (prev < 70) {
          setUploadStepMsg('Processing text extractions...')
          return prev + Math.floor(Math.random() * 10) + 5
        } else if (prev < 95) {
          setUploadStepMsg('Running AI intelligence indexing...')
          return prev + Math.floor(Math.random() * 5) + 2
        } else {
          clearInterval(interval)
          setUploadStepMsg('Summarizing & building instant flashcards...')
          
          // Complete upload after final step
          setTimeout(() => {
            const finalTitle = newDocTitle || selectedFile?.name.split('.')[0] || 'Untitled Study Material'
            const finalFileName = selectedFile?.name || `${finalTitle.toLowerCase().replace(/\s+/g, '_')}.${newDocType}`
            const finalSize = selectedFile ? `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB` : '1.5 MB'
            const finalSizeKb = selectedFile ? Math.round(selectedFile.size / 1024) : 1536

            const newDoc: DocumentItem = {
              id: `doc-${Date.now()}`,
              title: finalTitle,
              fileName: finalFileName,
              uploadedAt: 'Uploaded Just Now',
              uploadedDateObj: new Date(),
              size: finalSize,
              sizeKb: finalSizeKb,
              subject: newDocSubject,
              status: 'ANALYZED',
              type: newDocType,
            }

            setDocuments((prev) => [newDoc, ...prev])
            setIsUploading(false)
            setUploadProgress(0)
            setIsUploadModalOpen(false)
            showToast(`Tài liệu "${finalTitle || finalFileName}" tải lên và phân tích AI thành công!`)
            
            // Reset fields
            setNewDocTitle('')
            setNewDocSubject('GENERAL')
            setNewDocType('pdf')
            setSelectedFile(null)
          }, 1200)

          return 100
        }
      })
    }, 250)
  }

  // ENHANCED Delete Action with Toast
  const handleDeleteDocument = (id: string) => {
    const targetDoc = documents.find(d => d.id === id)
    if (targetDoc) {
      setDocuments((prev) => prev.filter((d) => d.id !== id))
      showToast(`Đã xóa tài liệu "${targetDoc.title || targetDoc.fileName}"`)
    }
    setActiveMenuId(null)
  }

  // ENHANCED Open Chat Drawer with Persistent History per document
  const handleOpenChat = (doc: DocumentItem) => {
    setSelectedDocForChat(doc)
    setIsChatDrawerOpen(true)
    setActiveMenuId(null)

    // Load existing history or create standard welcome message
    if (!documentChats[doc.id]) {
      setDocumentChats((prev) => ({
        ...prev,
        [doc.id]: [
          {
            sender: 'ai',
            text: `Xin chào! Tôi là Trợ lý học tập AI. Tôi đã phân tích hoàn chỉnh tài liệu "${doc.title || doc.fileName}" (${doc.subject}).\n\nBạn có muốn tôi tóm tắt 3 ý cốt lõi, tạo bộ câu hỏi trắc nghiệm ôn tập hay giải đáp cụ thể nội dung nào không?`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }
        ]
      }))
    }
  }

  // ENHANCED Send message in Quick Chat saving history persistently
  const handleSendChatMessage = (e: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault()
    
    const textToSend = customText || newChatMessage
    if (!textToSend.trim() || !selectedDocForChat) return

    const userMsg = {
      sender: 'user' as const,
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    // Save user message immediately to the persistent store
    setDocumentChats((prev) => ({
      ...prev,
      [selectedDocForChat.id]: [...(prev[selectedDocForChat.id] || []), userMsg]
    }))

    if (!customText) setNewChatMessage('')

    // Simulated context-aware AI response based on subject and keywords
    setTimeout(() => {
      let aiText = `Dựa vào tài liệu "${selectedDocForChat.title || selectedDocForChat.fileName}", `
      const lowerText = textToSend.toLowerCase()

      if (lowerText.includes('tóm tắt') || lowerText.includes('summarize')) {
        const db = SUBJECTS_CONTENT_DB[selectedDocForChat.subject] || SUBJECTS_CONTENT_DB.GENERAL
        aiText += `tôi xin tóm tắt các ý chính như sau:\n\n` + db.summaryBullets.map((bullet, idx) => `• ${bullet}`).join('\n')
      } else if (lowerText.includes('flashcard') || lowerText.includes('thẻ')) {
        const db = SUBJECTS_CONTENT_DB[selectedDocForChat.subject] || SUBJECTS_CONTENT_DB.GENERAL
        aiText += `tôi đã tạo nhanh các flashcard ôn tập sau:\n\n` + db.flashcards.map((fc, idx) => `Thẻ ${idx+1}:\n- Câu hỏi: ${fc.q}\n- Trả lời: ${fc.a}`).join('\n\n')
      } else if (lowerText.includes('trắc nghiệm') || lowerText.includes('đố') || lowerText.includes('quiz')) {
        aiText += `đây là 1 câu hỏi ôn tập nhanh cho bạn:\n\n**Câu hỏi**: Đâu là khái niệm cốt lõi được định nghĩa ở mục 1.1 của tài liệu này?\n\n*Gợi ý*: Trả lời trực tiếp để tôi kiểm tra xem bạn đã nắm vững kiến thức chưa!`
      } else {
        aiText += `tôi ghi nhận câu hỏi về "${textToSend}". Đây là chủ đề cốt lõi thuộc phần nghiên cứu chuyên ngành ${selectedDocForChat.subject.toLowerCase()}.\n\nTheo dữ liệu phân tích, nội dung này liên quan chặt chẽ đến phương pháp luận tổng quát ở chương đầu. Bạn cần tôi trích xuất thêm chi tiết ở mục nào không?`
      }

      const aiMsg = {
        sender: 'ai' as const,
        text: aiText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }

      setDocumentChats((prev) => ({
        ...prev,
        [selectedDocForChat.id]: [...(prev[selectedDocForChat.id] || []), aiMsg]
      }))
    }, 900)
  }

  // ENHANCED Download trigger with dynamic file creation & download toast
  const handleDownloadFile = (doc: DocumentItem) => {
    setActiveMenuId(null)
    showToast(`Đang chuẩn bị tải xuống: ${doc.fileName}...`)

    setTimeout(() => {
      // Create mock file content to make a REAL browser download
      const db = SUBJECTS_CONTENT_DB[doc.subject] || SUBJECTS_CONTENT_DB.GENERAL
      const textContent = `=== AI STUDY HUB - WORKSPACE DOCUMENT ===\nDocument ID: ${doc.id}\nTitle: ${doc.title || doc.fileName}\nSubject: ${doc.subject}\nFile Size: ${doc.size}\nUpload Info: ${doc.uploadedAt}\n\n=== DOCUMENT PREVIEW ===\n${db.previewText}\n\n=== AI GENERATED SUMMARY ===\n${db.summaryBullets.join('\n')}\n`
      
      const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = doc.fileName.replace(/\.[^/.]+$/, "") + "_AI_Summary.txt"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      showToast(`Tải xuống thành công tệp: ${doc.fileName}`)
    }, 1000)
  }

  // ENHANCED Open Document Viewer Modal
  const handleOpenPreview = (doc: DocumentItem) => {
    setActivePreviewDoc(doc)
    setActivePreviewTab('preview')
    setActiveFlashcardIndex(0)
    setIsFlashcardFlipped(false)
    setActiveMenuId(null)
  }

  // Helper file icons mapper
  const renderFileIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return (
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-500 shadow-xs border border-rose-100/50">
            <FileText className="h-6 w-6 stroke-[1.8]" />
          </div>
        )
      case 'word':
        return (
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-500 shadow-xs border border-blue-100/50">
            <FileCode className="h-6 w-6 stroke-[1.8]" />
          </div>
        )
      case 'text':
        return (
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-500 shadow-xs border border-emerald-100/50">
            <BookOpen className="h-6 w-6 stroke-[1.8]" />
          </div>
        )
      case 'image':
        return (
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-sky-500 shadow-xs border border-sky-100/50">
            <ImageIcon className="h-6 w-6 stroke-[1.8]" />
          </div>
        )
      case 'slides':
      default:
        return (
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-500 shadow-xs border border-amber-100/50">
            <FolderDown className="h-6 w-6 stroke-[1.8]" />
          </div>
        )
    }
  }

  // Helper AI Status color mapper
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'ANALYZED':
        return (
          <span className="flex items-center gap-1 rounded-md border border-blue-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-blue-600 shadow-xs transition-all duration-300">
            <Sparkles className="h-3 w-3 animate-pulse text-blue-500" />
            ANALYZED
          </span>
        )
      case 'PENDING':
        return (
          <span className="rounded-md border border-gray-255 bg-gray-50 px-2 py-0.5 text-[10px] font-semibold text-gray-500">
            PENDING
          </span>
        )
      case 'SCANNING':
        return (
          <span className="flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50/70 px-2 py-0.5 text-[10px] font-semibold text-amber-600 animate-pulse">
            SCANNING
          </span>
        )
      case 'QUEUED':
      default:
        return (
          <span className="rounded-md border border-gray-100 bg-gray-50 px-2 py-0.5 text-[10px] font-semibold text-gray-400">
            QUEUED
          </span>
        )
    }
  }

  // Calculate storage metrics for Insights Modal
  const totalStorageSize = documents.reduce((sum, doc) => sum + doc.sizeKb, 0)
  const totalStorageFormatted = (totalStorageSize / 1024).toFixed(1)
  const storagePercentage = Math.min(100, Math.round((totalStorageSize / (100 * 1024)) * 100))

  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      
      {/* Dynamic Toast popup in bottom-right */}
      {isToastVisible && toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3.5 rounded-2xl bg-foreground text-white px-5 py-4 shadow-2xl animate-slide-in-right max-w-sm">
          <CheckCircle2 className="h-5 w-5 text-blue-400 shrink-0" />
          <p className="text-sm font-medium leading-normal">{toastMessage}</p>
          <button onClick={() => setIsToastVisible(false)} className="text-white/60 hover:text-white ml-2">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* 1. Header & Title Block */}
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            My Documents
          </h1>
          <p className="mt-2 text-base text-muted max-w-2xl leading-relaxed">
            Manage and organize your study materials with AI. Generate summaries, flashcards, and deep-dives instantly.
          </p>
        </div>

        {/* Action cluster on top right */}
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="icon"
            onClick={() => setIsInsightsModalOpen(true)}
            className="rounded-xl border-border bg-white shadow-sm hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition-all duration-300"
            title="View AI Workspace Metrics"
            aria-label="View AI Metrics"
          >
            <Bot className="h-5 w-5 text-primary animate-bounce-slow" />
          </Button>

          <Button
            onClick={() => setIsUploadModalOpen(true)}
            className="group flex items-center gap-2 rounded-xl bg-primary px-5 py-3 font-semibold text-white shadow-md shadow-primary/20 hover:bg-primary-dark hover:scale-[1.02] active:scale-95 transition-all duration-300"
          >
            <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
            Upload Document
          </Button>
        </div>
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="flex flex-col gap-4 rounded-2xl border border-border/80 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        
        {/* Search Field */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Filter by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-border/80 bg-surface pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted/80 focus:border-primary/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted hover:text-foreground"
            >
              Clear
            </button>
          )}
        </div>

        {/* Dropdowns & View toggles */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Subject Filter */}
          <div className="flex items-center gap-1.5 rounded-xl border border-border/85 bg-surface px-3 py-1.5">
            <span className="text-xs font-medium text-muted">Subject:</span>
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="bg-transparent text-sm font-semibold text-foreground focus:outline-none cursor-pointer pr-1"
            >
              <option value="All">All Subjects</option>
              <option value="Mathematics">Mathematics</option>
              <option value="Biology">Biology</option>
              <option value="Physics">Physics</option>
              <option value="Compsci">CompSci</option>
              <option value="Philosophy">Philosophy</option>
              <option value="Economics">Economics</option>
            </select>
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-1.5 rounded-xl border border-border/85 bg-surface px-3 py-1.5">
            <span className="text-xs font-medium text-muted">Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-transparent text-sm font-semibold text-foreground focus:outline-none cursor-pointer pr-1"
            >
              <option value="All">All Types</option>
              <option value="Pdf">PDF</option>
              <option value="Word">Word</option>
              <option value="Text">Text</option>
              <option value="Image">Image</option>
              <option value="Slides">Slides</option>
            </select>
          </div>

          <div className="h-6 w-px bg-border/80 hidden sm:block mx-1" />

          {/* View Toggles */}
          <div className="flex items-center rounded-xl border border-border/80 bg-surface p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'rounded-lg p-1.5 transition-all duration-200',
                viewMode === 'grid'
                  ? 'bg-white text-primary shadow-xs'
                  : 'text-muted hover:text-foreground'
              )}
              title="Grid View"
              aria-label="Grid View"
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'rounded-lg p-1.5 transition-all duration-200',
                viewMode === 'list'
                  ? 'bg-white text-primary shadow-xs'
                  : 'text-muted hover:text-foreground'
              )}
              title="List View"
              aria-label="List View"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Empty State or Results List */}
      {filteredDocuments.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-white py-16 px-4 text-center shadow-xs">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/5 text-primary">
            <Search className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-lg font-bold text-foreground">No documents found</h3>
          <p className="mt-2 text-sm text-muted max-w-sm">
            We couldn't find any documents matching your filters. Try adjusting your query or filters.
          </p>
          <Button
            variant="secondary"
            className="mt-6 rounded-xl text-sm"
            onClick={() => {
              setSearchQuery('')
              setSubjectFilter('All')
              setTypeFilter('All')
            }}
          >
            Reset Filters
          </Button>
        </div>
      ) : viewMode === 'grid' ? (
        
        // 4. Grid View Layout
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          
          {filteredDocuments.map((doc) => (
            <div
              key={doc.id}
              className="group relative flex flex-col justify-between rounded-2xl border border-border bg-white p-5 shadow-xs transition-all duration-300 hover:-translate-y-1.5 hover:shadow-md hover:border-primary/20 cursor-pointer"
              onClick={() => handleOpenPreview(doc)}
            >
              {/* Card top action */}
              <div className="flex items-start justify-between" onClick={(e) => e.stopPropagation()}>
                {renderFileIcon(doc.type)}
                
                {/* Options Menu Trigger */}
                <div className="relative">
                  <button
                    onClick={() => setActiveMenuId(activeMenuId === doc.id ? null : doc.id)}
                    className="menu-trigger-btn rounded-lg p-1.5 text-muted hover:bg-surface hover:text-foreground focus:outline-none transition-colors"
                    aria-label="Open document actions"
                  >
                    <MoreVertical className="h-4.5 w-4.5" />
                  </button>

                  {/* Context menu dropdown */}
                  {activeMenuId === doc.id && (
                    <div
                      ref={menuRef}
                      className="absolute right-0 top-8 z-30 w-48 rounded-xl border border-border bg-white py-1.5 shadow-xl animate-fade-in"
                      role="menu"
                    >
                      <button
                        onClick={() => handleOpenChat(doc)}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-body hover:bg-surface hover:text-primary transition-colors"
                      >
                        <MessageSquare className="h-4 w-4" />
                        Chat with AI
                      </button>
                      <button
                        onClick={() => handleOpenPreview(doc)}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-body hover:bg-surface transition-colors"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Open & View
                      </button>
                      <button
                        onClick={() => handleDownloadFile(doc)}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-body hover:bg-surface transition-colors"
                      >
                        <Download className="h-4 w-4" />
                        Download File
                      </button>
                      <div className="my-1 border-t border-border/60" />
                      <button
                        onClick={() => handleDeleteDocument(doc.id)}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete Document
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Title / Info area */}
              <div className="mt-5 flex-1">
                <h3 className="line-clamp-1 text-[15px] font-bold text-foreground group-hover:text-primary transition-colors" title={doc.title || doc.fileName}>
                  {doc.title || doc.fileName}
                </h3>
                <p className="mt-1 text-xs text-muted/90 flex items-center gap-1 font-medium">
                  {doc.uploadedAt}
                  <span className="text-[10px] text-border">•</span>
                  <span>{doc.size}</span>
                </p>
              </div>

              {/* Badges footer */}
              <div className="mt-5 flex items-center justify-between gap-2 border-t border-border/40 pt-4">
                <span className="rounded-md bg-blue-50/70 border border-blue-100/50 px-2 py-0.5 text-[10px] font-bold tracking-wider text-[#2563eb]">
                  {doc.subject}
                </span>
                {renderStatusBadge(doc.status)}
              </div>
            </div>
          ))}

          {/* Dotted upload placeholder card */}
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/80 bg-white/40 p-6 text-center transition-all duration-300 hover:border-primary/50 hover:bg-primary/5 hover:shadow-xs focus:outline-none min-h-[178px]"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-primary shadow-xs group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-300">
              <CloudUpload className="h-5 w-5" />
            </div>
            <h4 className="mt-4 text-sm font-bold text-foreground group-hover:text-primary transition-colors">
              Add New File
            </h4>
            <p className="mt-1 text-xs text-muted">
              Max size 50MB
            </p>
          </button>
        </div>
      ) : (
        
        // 5. List View Layout
        <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-border bg-surface text-xs font-semibold uppercase tracking-wider text-muted">
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Subject</th>
                  <th className="px-6 py-4">File Size</th>
                  <th className="px-6 py-4">Upload Date</th>
                  <th className="px-6 py-4">AI Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredDocuments.map((doc) => (
                  <tr
                    key={doc.id}
                    className="group hover:bg-surface/50 transition-colors cursor-pointer"
                    onClick={() => handleOpenPreview(doc)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {renderFileIcon(doc.type)}
                        <div>
                          <h4 className="text-[14px] font-bold text-foreground group-hover:text-primary transition-colors">
                            {doc.title || doc.fileName}
                          </h4>
                          <span className="text-xs text-muted/80">{doc.fileName}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="rounded-md bg-blue-50/70 border border-blue-100/50 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-[#2563eb]">
                        {doc.subject}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-body">
                      {doc.size}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted">
                      {doc.uploadedAt.replace('Uploaded ', '')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex">{renderStatusBadge(doc.status)}</div>
                    </td>
                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenChat(doc)}
                          className="rounded-lg text-primary hover:bg-primary/5"
                          title="Chat with AI"
                        >
                          <MessageSquare className="h-4.5 w-4.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDownloadFile(doc)}
                          className="rounded-lg text-body"
                          title="Download"
                        >
                          <Download className="h-4.5 w-4.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteDocument(doc.id)}
                          className="rounded-lg text-rose-600 hover:bg-rose-50"
                          title="Delete"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. High-fidelity "Upload Document" Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => {
          if (!isUploading) {
            setIsUploadModalOpen(false)
            setSelectedFile(null)
          }
        }}
        title="Upload Study Material"
        description="Provide study documents and our AI will build outlines, mindmaps, summaries, and flashcards instantly."
      >
        <form onSubmit={handleUploadSubmit} className="space-y-6">
          {isUploading ? (
            <div className="py-8 text-center space-y-6">
              {/* Spinner & Progress ring */}
              <div className="relative mx-auto flex h-24 w-24 items-center justify-center">
                <div className="absolute h-full w-full rounded-full border-4 border-border" />
                <div
                  className="absolute h-full w-full rounded-full border-4 border-primary border-t-transparent animate-spin"
                  style={{ animationDuration: '1.2s' }}
                />
                <span className="text-xl font-black text-primary">{uploadProgress}%</span>
              </div>
              <div className="space-y-2 max-w-sm mx-auto">
                <h4 className="text-base font-bold text-foreground animate-pulse">
                  {uploadStepMsg}
                </h4>
                <div className="w-full bg-border rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-primary h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-xs text-muted">Please keep this window open while AI processes your document</p>
              </div>
            </div>
          ) : (
            <>
              {/* Title input */}
              <div className="space-y-1.5">
                <label htmlFor="doc-title-input" className="text-sm font-bold text-foreground">
                  Document Title (Optional)
                </label>
                <Input
                  id="doc-title-input"
                  placeholder="e.g. Calculus II Formulas, Organic Chemistry Seminar"
                  value={newDocTitle}
                  onChange={(e) => setNewDocTitle(e.target.value)}
                />
              </div>

              {/* Subject & Type Grid selection */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label htmlFor="subject-select" className="text-sm font-bold text-foreground">Subject</label>
                  <select
                    id="subject-select"
                    value={newDocSubject}
                    onChange={(e) => setNewDocSubject(e.target.value as any)}
                    className="w-full appearance-none rounded-lg border border-border bg-surface px-3 py-3 pr-10 text-base text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                  >
                    <option value="GENERAL">General/Other</option>
                    <option value="MATHEMATICS">Mathematics</option>
                    <option value="BIOLOGY">Biology</option>
                    <option value="PHYSICS">Physics</option>
                    <option value="COMPSCI">CompSci</option>
                    <option value="PHILOSOPHY">Philosophy</option>
                    <option value="ECONOMICS">Economics</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="type-select" className="text-sm font-bold text-foreground">File Type</label>
                  <select
                    id="type-select"
                    value={newDocType}
                    onChange={(e) => setNewDocType(e.target.value as any)}
                    className="w-full appearance-none rounded-lg border border-border bg-surface px-3 py-3 pr-10 text-base text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                  >
                    <option value="pdf">PDF File (.pdf)</option>
                    <option value="word">Word Document (.docx)</option>
                    <option value="text">Text File (.txt)</option>
                    <option value="image">Image Note (.png, .jpg)</option>
                    <option value="slides">Presentation Slides (.pptx)</option>
                  </select>
                </div>
              </div>

              {/* Drag and Drop Zone */}
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-foreground">Document File</label>
                <div
                  onClick={() => {
                    const input = document.createElement('input')
                    input.type = 'file'
                    input.onchange = (e) => {
                      const files = (e.target as HTMLInputElement).files
                      if (files && files[0]) {
                        setSelectedFile(files[0])
                        if (!newDocTitle) {
                          // Pre-fill title from name
                          const cleanName = files[0].name.split('.')[0].replace(/[_-]/g, ' ')
                          setNewDocTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1))
                        }
                      }
                    }
                    input.click()
                  }}
                  className={cn(
                    'flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border p-8 text-center cursor-pointer transition-all duration-300',
                    selectedFile
                      ? 'border-primary/60 bg-primary/5'
                      : 'hover:border-primary/50 hover:bg-surface'
                  )}
                >
                  <div className={cn(
                    'flex h-12 w-12 items-center justify-center rounded-full shadow-xs transition-colors',
                    selectedFile ? 'bg-primary text-white' : 'bg-primary/5 text-primary'
                  )}>
                    <CloudUpload className="h-6 w-6" />
                  </div>
                  {selectedFile ? (
                    <div className="mt-4">
                      <p className="text-sm font-bold text-foreground">{selectedFile.name}</p>
                      <p className="text-xs text-muted mt-1">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready to process</p>
                    </div>
                  ) : (
                    <div className="mt-4">
                      <p className="text-sm font-bold text-foreground">Drag and drop your document here</p>
                      <p className="text-xs text-muted mt-1">or click to browse your folders (PDF, DOCX, TXT, PNG, PPTX up to 50MB)</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer actions */}
              <div className="flex items-center justify-end gap-3 border-t border-border pt-4 mt-8">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setIsUploadModalOpen(false)
                    setSelectedFile(null)
                  }}
                  className="rounded-xl font-medium"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!selectedFile && !newDocTitle}
                  className="rounded-xl bg-primary text-white font-semibold shadow-md shadow-primary/10 px-6"
                >
                  Process with AI
                </Button>
              </div>
            </>
          )}
        </form>
      </Modal>

      {/* 7. ENHANCED AI Quick Chat Side Drawer */}
      {isChatDrawerOpen && selectedDocForChat && (
        <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white border-l border-border shadow-2xl animate-slide-in-right">
          
          {/* Drawer Header */}
          <div className="flex items-center justify-between border-b border-border p-4 bg-surface">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h3 className="truncate text-sm font-bold text-foreground">
                  AI Study Assistant
                </h3>
                <p className="truncate text-xs text-muted font-medium">
                  Document: {selectedDocForChat.title || selectedDocForChat.fileName}
                </p>
              </div>
            </div>
            
            <button
              onClick={() => setIsChatDrawerOpen(false)}
              className="rounded-lg p-1.5 text-muted hover:bg-border/40 hover:text-foreground transition-all"
              aria-label="Close Chat"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#fafbfe]">
            {(documentChats[selectedDocForChat.id] || []).map((msg, index) => (
              <div
                key={index}
                className={cn(
                  'flex max-w-[85%] flex-col rounded-2xl p-3.5 text-sm shadow-xs transition-all',
                  msg.sender === 'user'
                    ? 'ml-auto bg-primary text-white rounded-br-none'
                    : 'bg-white text-foreground border border-border/80 rounded-bl-none'
                )}
              >
                <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                <span
                  className={cn(
                    'mt-1.5 self-end text-[9px] font-semibold',
                    msg.sender === 'user' ? 'text-blue-200' : 'text-muted'
                  )}
                >
                  {msg.time}
                </span>
              </div>
            ))}
          </div>

          {/* Quick options buttons */}
          <div className="border-t border-border/50 px-4 py-2 flex items-center gap-2 overflow-x-auto bg-white whitespace-nowrap scrollbar-none">
            <button
              onClick={(e) => handleSendChatMessage(e, 'Tóm tắt tài liệu này giúp tôi')}
              className="rounded-lg border border-border/80 bg-surface px-2.5 py-1 text-xs text-body hover:border-primary/45 hover:text-primary transition-all"
            >
              📝 Tóm tắt chính
            </button>
            <button
              onClick={(e) => handleSendChatMessage(e, 'Tạo các flashcard ôn tập')}
              className="rounded-lg border border-border/80 bg-surface px-2.5 py-1 text-xs text-body hover:border-primary/45 hover:text-primary transition-all"
            >
              🧠 Tạo Flashcard
            </button>
            <button
              onClick={(e) => handleSendChatMessage(e, 'Trắc nghiệm đố vui kiến thức')}
              className="rounded-lg border border-border/80 bg-surface px-2.5 py-1 text-xs text-body hover:border-primary/45 hover:text-primary transition-all"
            >
              ❓ Đố kiến thức
            </button>
          </div>

          {/* Message Input bar */}
          <form
            onSubmit={handleSendChatMessage}
            className="border-t border-border p-4 bg-white flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Ask anything about this document..."
              value={newChatMessage}
              onChange={(e) => setNewChatMessage(e.target.value)}
              className="flex-1 rounded-xl border border-border/85 bg-surface px-4 py-2.5 text-sm focus:border-primary/50 focus:bg-white focus:outline-none transition-all"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!newChatMessage.trim()}
              className="rounded-xl bg-primary text-white h-10 w-10 shadow-xs hover:bg-primary-dark shrink-0"
              aria-label="Send message"
            >
              <Send className="h-4.5 w-4.5" />
            </Button>
          </form>
        </div>
      )}

      {/* 8. ENHANCED Interactive Document Preview with Summaries & Flashcards Modal */}
      {activePreviewDoc && (
        <Modal
          isOpen={!!activePreviewDoc}
          onClose={() => setActivePreviewDoc(null)}
          title={activePreviewDoc.title || activePreviewDoc.fileName}
          description={`${activePreviewDoc.subject} • ${activePreviewDoc.size} • ${activePreviewDoc.uploadedAt}`}
          className="max-w-4xl"
        >
          <div className="space-y-6">
            
            {/* Modal Tabs Header */}
            <div className="flex border-b border-border">
              <button
                onClick={() => setActivePreviewTab('preview')}
                className={cn(
                  'px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-all',
                  activePreviewTab === 'preview'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted hover:text-foreground'
                )}
              >
                Document Reader
              </button>
              <button
                onClick={() => setActivePreviewTab('summary')}
                className={cn(
                  'px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-all',
                  activePreviewTab === 'summary'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted hover:text-foreground'
                )}
              >
                AI Summary
              </button>
              <button
                onClick={() => {
                  setActivePreviewTab('flashcards')
                  setActiveFlashcardIndex(0)
                  setIsFlashcardFlipped(false)
                }}
                className={cn(
                  'px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-all',
                  activePreviewTab === 'flashcards'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted hover:text-foreground'
                )}
              >
                Flashcards ({SUBJECTS_CONTENT_DB[activePreviewDoc.subject]?.flashcards.length || 0})
              </button>
            </div>

            {/* Tab content 1: Preview text */}
            {activePreviewTab === 'preview' && (
              <div className="space-y-4">
                <div className="rounded-xl border border-border bg-surface p-5 max-h-[350px] overflow-y-auto font-mono text-sm leading-relaxed text-body whitespace-pre-wrap">
                  {SUBJECTS_CONTENT_DB[activePreviewDoc.subject]?.previewText || SUBJECTS_CONTENT_DB.GENERAL.previewText}
                </div>
                <div className="flex justify-between items-center bg-blue-50/40 rounded-xl p-4 border border-blue-100/50">
                  <div className="flex items-center gap-3 text-sm text-primary font-medium">
                    <BrainCircuit className="h-5 w-5 text-primary" />
                    AI has indexed this document successfully
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      const doc = activePreviewDoc
                      setActivePreviewDoc(null)
                      handleOpenChat(doc)
                    }}
                    className="text-primary hover:bg-primary/5 font-semibold text-sm rounded-lg"
                  >
                    Discuss with AI assistant →
                  </Button>
                </div>
              </div>
            )}

            {/* Tab content 2: AI Bulleted summaries */}
            {activePreviewTab === 'summary' && (
              <div className="space-y-5 py-2">
                <div className="flex gap-4 items-start bg-primary/5 rounded-2xl p-5 border border-primary/10">
                  <div className="bg-primary/10 rounded-xl p-2.5 text-primary">
                    <Sparkles className="h-6 w-6 stroke-[1.8] animate-pulse" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-foreground text-[16px]">AI Executive Summary</h4>
                    <p className="text-sm text-muted mt-1">Here is a comprehensive semantic summary of the uploaded document, generated instantly by deep reading.</p>
                  </div>
                </div>

                <div className="rounded-xl border border-border/80 bg-white p-5 space-y-4">
                  {(SUBJECTS_CONTENT_DB[activePreviewDoc.subject]?.summaryBullets || SUBJECTS_CONTENT_DB.GENERAL.summaryBullets).map((bullet, idx) => (
                    <div key={idx} className="flex gap-3 items-start text-sm text-body leading-relaxed">
                      <CheckCircle2 className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                      <p>{bullet}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab content 3: Interactive Flippable Flashcards */}
            {activePreviewTab === 'flashcards' && (
              <div className="space-y-6 py-2 flex flex-col items-center">
                
                {/* Flashcard container */}
                {(() => {
                  const db = SUBJECTS_CONTENT_DB[activePreviewDoc.subject] || SUBJECTS_CONTENT_DB.GENERAL
                  const currentCard = db.flashcards[activeFlashcardIndex]

                  if (!currentCard) return <p className="text-sm text-muted">No flashcards available</p>

                  return (
                    <>
                      {/* Flippable card */}
                      <div
                        onClick={() => setIsFlashcardFlipped(!isFlashcardFlipped)}
                        className={cn(
                          'relative h-56 w-full max-w-lg rounded-2xl border cursor-pointer select-none shadow-sm transition-all duration-500 preserve-3d flex items-center justify-center p-8 text-center hover:shadow-md',
                          isFlashcardFlipped
                            ? 'border-blue-200 bg-blue-50/30'
                            : 'border-border bg-white'
                        )}
                      >
                        {isFlashcardFlipped ? (
                          <div className="space-y-3">
                            <span className="text-[10px] uppercase tracking-widest text-primary font-bold bg-blue-100/60 px-2 py-0.5 rounded">Answer / Mặt B</span>
                            <p className="text-lg font-bold text-foreground leading-relaxed">{currentCard.a}</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <span className="text-[10px] uppercase tracking-widest text-muted font-bold bg-surface px-2 py-0.5 rounded">Question / Mặt A</span>
                            <p className="text-xl font-black text-foreground leading-relaxed">{currentCard.q}</p>
                            <p className="text-xs text-muted/70 pt-4">Click card to reveal answer</p>
                          </div>
                        )}
                      </div>

                      {/* Pagination Controls */}
                      <div className="flex items-center gap-6 mt-4">
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={activeFlashcardIndex === 0}
                          onClick={() => {
                            setActiveFlashcardIndex(prev => prev - 1)
                            setIsFlashcardFlipped(false)
                          }}
                          className="rounded-lg text-xs"
                        >
                          ← Previous
                        </Button>
                        <span className="text-sm text-muted font-semibold">
                          {activeFlashcardIndex + 1} / {db.flashcards.length}
                        </span>
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={activeFlashcardIndex === db.flashcards.length - 1}
                          onClick={() => {
                            setActiveFlashcardIndex(prev => prev + 1)
                            setIsFlashcardFlipped(false)
                          }}
                          className="rounded-lg text-xs"
                        >
                          Next →
                        </Button>
                      </div>
                    </>
                  )
                })()}

              </div>
            )}

            {/* Footer action */}
            <div className="flex justify-end border-t border-border pt-4 mt-6">
              <Button
                variant="secondary"
                onClick={() => setActivePreviewDoc(null)}
                className="rounded-xl font-semibold"
              >
                Close Viewer
              </Button>
            </div>

          </div>
        </Modal>
      )}

      {/* 9. ENHANCED Interactive AI Workspace Analytics / Insights Modal */}
      {isInsightsModalOpen && (
        <Modal
          isOpen={isInsightsModalOpen}
          onClose={() => setIsInsightsModalOpen(false)}
          title="AI Workspace Insights"
          description="Detailed intelligence telemetry and statistics regarding your uploaded documents."
          className="max-w-xl"
        >
          <div className="space-y-6 py-2">
            
            {/* Grid metrics blocks */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-border p-4 bg-white flex flex-col justify-between">
                <span className="text-xs text-muted font-bold uppercase tracking-wider">Total Files</span>
                <span className="text-3xl font-black text-foreground mt-2">{documents.length}</span>
                <span className="text-[10px] text-emerald-600 font-bold mt-1 flex items-center gap-0.5">
                  <TrendingUp className="h-3.5 w-3.5" />
                  +100% active study
                </span>
              </div>

              <div className="rounded-2xl border border-border p-4 bg-white flex flex-col justify-between">
                <span className="text-xs text-muted font-bold uppercase tracking-wider">Cloud Storage</span>
                <span className="text-3xl font-black text-foreground mt-2">{totalStorageFormatted} <span className="text-sm font-semibold">MB</span></span>
                <span className="text-[10px] text-muted font-semibold mt-1">of 100 MB maximum capacity</span>
              </div>
            </div>

            {/* Storage Progress bar */}
            <div className="rounded-2xl border border-border p-5 bg-surface space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-body flex items-center gap-1">
                  <HardDrive className="h-4 w-4 text-muted" />
                  Allocated Storage
                </span>
                <span className="text-foreground">{storagePercentage}% Used</span>
              </div>
              <div className="w-full bg-border/80 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${storagePercentage}%` }}
                />
              </div>
            </div>

            {/* Subject Distribution mini graph bar */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-foreground uppercase tracking-wider">Subject Analytics</h4>
              <div className="space-y-2.5">
                {['MATHEMATICS', 'BIOLOGY', 'PHYSICS', 'COMPSCI', 'PHILOSOPHY', 'ECONOMICS'].map((subj) => {
                  const count = documents.filter(d => d.subject === subj).length
                  const maxCount = Math.max(...['MATHEMATICS', 'BIOLOGY', 'PHYSICS', 'COMPSCI', 'PHILOSOPHY', 'ECONOMICS'].map(s => documents.filter(d => d.subject === s).length))
                  const barWidth = maxCount > 0 ? (count / maxCount) * 100 : 0
                  
                  return (
                    <div key={subj} className="flex items-center gap-4 text-xs">
                      <span className="w-24 truncate font-bold text-body">{subj}</span>
                      <div className="flex-1 bg-border/40 h-6 rounded-md overflow-hidden relative flex items-center px-2">
                        <div
                          className="bg-blue-100 border-r-2 border-primary absolute left-0 top-0 bottom-0 transition-all duration-500"
                          style={{ width: `${barWidth}%` }}
                        />
                        <span className="z-10 font-bold text-primary ml-auto">{count} file{count !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Footer close */}
            <div className="flex justify-end border-t border-border pt-4 mt-8">
              <Button
                variant="secondary"
                onClick={() => setIsInsightsModalOpen(false)}
                className="rounded-xl font-bold"
              >
                Close Metrics
              </Button>
            </div>

          </div>
        </Modal>
      )}

    </div>
  )
}
