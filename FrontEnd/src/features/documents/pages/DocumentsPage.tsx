import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { logActivity } from '@/services/activityLogService'
import { aiService } from '@/services/aiService'
import type { AiSummaryResponse, FlashcardResponse, QuizQuestionResponse } from '@/services/aiService'
import { useAuthStore } from '@/stores/authStore'
import { documentService } from '@/services/documentService'
import {
  X,
  Send,
  Sparkles,
  CheckCircle2,
  BrainCircuit,
  CloudUpload,
  FileText,
  FileCode,
  BookOpen,
  Image as ImageIcon,
  FolderDown,
  HardDrive,
  TrendingUp
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/context/LanguageContext'

// Types
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
  essential?: boolean
}

interface SubjectContent {
  previewText: string
  summaryBullets: string[]
  flashcards: Array<{ q: string; a: string }>
}

// Initial Mock Data
export const INITIAL_DOCUMENTS: DocumentItem[] = [
  // Existing files
  {
    id: 'doc-design-patterns',
    title: 'Design Patterns',
    fileName: 'Design_Patterns_Java_Guide.pdf',
    uploadedAt: 'Uploaded 2 hours ago',
    uploadedDateObj: new Date(),
    size: '3.8 MB',
    sizeKb: 3890,
    subject: 'COMPSCI',
    status: 'ANALYZED',
    type: 'pdf',
  },
  {
    id: 'doc-agile',
    title: 'Agile Methodologies',
    fileName: 'Agile_Scrum_Kanban_DeepDive.docx',
    uploadedAt: 'Uploaded Yesterday',
    uploadedDateObj: new Date(Date.now() - 24 * 60 * 60 * 1000),
    size: '1.9 MB',
    sizeKb: 1945,
    subject: 'GENERAL',
    status: 'ANALYZED',
    type: 'word',
    essential: true,
  },
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

  // === 12 NEUROSCIENCE DOCUMENTS ===
  {
    id: 'neuro-1',
    title: 'Neuroscience 101: Brain Structures Summary',
    fileName: 'Neuroscience_101_Brain_Structures_Summary.pdf',
    uploadedAt: 'Uploaded Oct 15, 2024',
    uploadedDateObj: new Date('2024-10-15'),
    size: '3.6 MB',
    sizeKb: 3686,
    subject: 'NEUROSCIENCE',
    status: 'ANALYZED',
    type: 'pdf',
  },
  {
    id: 'neuro-2',
    title: 'Cognitive Neuroscience Notes',
    fileName: 'Cognitive_Neuroscience_Lecture_Notes.docx',
    uploadedAt: 'Uploaded Oct 16, 2024',
    uploadedDateObj: new Date('2024-10-16'),
    size: '1.8 MB',
    sizeKb: 1843,
    subject: 'NEUROSCIENCE',
    status: 'ANALYZED',
    type: 'word',
  },
  {
    id: 'neuro-3',
    title: 'Neurotransmitters Study Guide',
    fileName: 'Neurotransmitters_Study_Guide.pdf',
    uploadedAt: 'Uploaded Oct 11, 2024',
    uploadedDateObj: new Date('2024-10-11'),
    size: '2.1 MB',
    sizeKb: 2150,
    subject: 'NEUROSCIENCE',
    status: 'ANALYZED',
    type: 'pdf',
  },
  {
    id: 'neuro-4',
    title: 'Introduction to Synapses',
    fileName: 'Intro_to_Synaptic_Transmission.pdf',
    uploadedAt: 'Uploaded Oct 09, 2024',
    uploadedDateObj: new Date('2024-10-09'),
    size: '1.4 MB',
    sizeKb: 1433,
    subject: 'NEUROSCIENCE',
    status: 'ANALYZED',
    type: 'pdf',
  },
  {
    id: 'neuro-5',
    title: 'Neuroplasticity Research Paper',
    fileName: 'Neuroplasticity_Mechanisms_Paper.docx',
    uploadedAt: 'Uploaded Oct 14, 2024',
    uploadedDateObj: new Date('2024-10-14'),
    size: '4.2 MB',
    sizeKb: 4300,
    subject: 'NEUROSCIENCE',
    status: 'ANALYZED',
    type: 'word',
  },
  {
    id: 'neuro-6',
    title: 'Sensory Systems Overview',
    fileName: 'Sensory_Systems_Overview.docx',
    uploadedAt: 'Uploaded Oct 07, 2024',
    uploadedDateObj: new Date('2024-10-07'),
    size: '2.8 MB',
    sizeKb: 2867,
    subject: 'NEUROSCIENCE',
    status: 'ANALYZED',
    type: 'word',
  },
  {
    id: 'neuro-7',
    title: 'Motor Pathways Guide',
    fileName: 'Motor_Pathways_Guide.pdf',
    uploadedAt: 'Uploaded Oct 05, 2024',
    uploadedDateObj: new Date('2024-10-05'),
    size: '3.1 MB',
    sizeKb: 3174,
    subject: 'NEUROSCIENCE',
    status: 'ANALYZED',
    type: 'pdf',
  },
  {
    id: 'neuro-8',
    title: 'Limbic System Structures',
    fileName: 'Limbic_System_Structures.pdf',
    uploadedAt: 'Uploaded Oct 03, 2024',
    uploadedDateObj: new Date('2024-10-03'),
    size: '1.9 MB',
    sizeKb: 1945,
    subject: 'NEUROSCIENCE',
    status: 'ANALYZED',
    type: 'pdf',
  },
  {
    id: 'neuro-9',
    title: 'Brain Development Slides',
    fileName: 'Brain_Development_Slides.pptx',
    uploadedAt: 'Uploaded Oct 12, 2024',
    uploadedDateObj: new Date('2024-10-12'),
    size: '8.4 MB',
    sizeKb: 8601,
    subject: 'NEUROSCIENCE',
    status: 'ANALYZED',
    type: 'slides',
  },
  {
    id: 'neuro-10',
    title: 'Neurodegenerative Diseases Notes',
    fileName: 'Neurodegenerative_Diseases_Notes.pdf',
    uploadedAt: 'Uploaded Oct 10, 2024',
    uploadedDateObj: new Date('2024-10-10'),
    size: '2.5 MB',
    sizeKb: 2560,
    subject: 'NEUROSCIENCE',
    status: 'ANALYZED',
    type: 'pdf',
  },
  {
    id: 'neuro-11',
    title: 'Neuroimaging Technologies',
    fileName: 'Neuroimaging_Technologies.txt',
    uploadedAt: 'Uploaded Oct 06, 2024',
    uploadedDateObj: new Date('2024-10-06'),
    size: '950 KB',
    sizeKb: 950,
    subject: 'NEUROSCIENCE',
    status: 'ANALYZED',
    type: 'text',
  },
  {
    id: 'neuro-12',
    title: 'Nervous System Anatomy Whiteboard',
    fileName: 'Nervous_System_Anatomy_Whiteboard.png',
    uploadedAt: 'Uploaded Yesterday',
    uploadedDateObj: new Date(Date.now() - 24 * 60 * 60 * 1000),
    size: '5.2 MB',
    sizeKb: 5324,
    subject: 'NEUROSCIENCE',
    status: 'ANALYZED',
    type: 'image',
  },

  // === 8 BIOLOGY DOCUMENTS ===
  {
    id: 'doc-2',
    title: 'Molecular Biology Lect',
    fileName: 'Molecular_Biology_Lecture_Notes_Neuroscience.docx',
    uploadedAt: 'Uploaded Oct 14, 2024',
    uploadedDateObj: new Date('2024-10-14'),
    size: '1.1 MB',
    sizeKb: 1126,
    subject: 'BIOLOGY',
    status: 'PENDING',
    type: 'word',
  },
  {
    id: 'doc-6',
    title: 'Genetics Lab Report Dr',
    fileName: 'Genetics_Lab_Report_Draft_Neuroscience.docx',
    uploadedAt: 'Uploaded 3 days ago',
    uploadedDateObj: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    size: '1.8 MB',
    sizeKb: 1843,
    subject: 'BIOLOGY',
    status: 'ANALYZED',
    type: 'word',
  },
  {
    id: 'bio-3',
    title: 'Cellular Respiration in Brain Cells',
    fileName: 'Cellular_Respiration_in_Neurons.pdf',
    uploadedAt: 'Uploaded Oct 15, 2024',
    uploadedDateObj: new Date('2024-10-15'),
    size: '2.2 MB',
    sizeKb: 2252,
    subject: 'BIOLOGY',
    status: 'ANALYZED',
    type: 'pdf',
  },
  {
    id: 'bio-4',
    title: 'Photosynthesis and Plant Biology (Neuroscience Context)',
    fileName: 'Plant_Biology_and_Neuro_Signaling.pdf',
    uploadedAt: 'Uploaded Oct 13, 2024',
    uploadedDateObj: new Date('2024-10-13'),
    size: '3.1 MB',
    sizeKb: 3174,
    subject: 'BIOLOGY',
    status: 'ANALYZED',
    type: 'pdf',
  },
  {
    id: 'bio-5',
    title: 'Plant Neurobiology Anatomy Overview',
    fileName: 'Plant_Neurobiology_Overview.docx',
    uploadedAt: 'Uploaded Oct 12, 2024',
    uploadedDateObj: new Date('2024-10-12'),
    size: '2.5 MB',
    sizeKb: 2560,
    subject: 'BIOLOGY',
    status: 'ANALYZED',
    type: 'word',
  },
  {
    id: 'bio-6',
    title: 'Mendelian Genetics in Neuro-developmental Disorders',
    fileName: 'Mendelian_Genetics_Neuro_Disorders.pdf',
    uploadedAt: 'Uploaded Oct 11, 2024',
    uploadedDateObj: new Date('2024-10-11'),
    size: '1.7 MB',
    sizeKb: 1740,
    subject: 'BIOLOGY',
    status: 'ANALYZED',
    type: 'pdf',
  },
  {
    id: 'bio-7',
    title: 'Ecology, Ecosystems and Evolutionary Neuroscience',
    fileName: 'Ecosystems_and_Evolutionary_Neuroscience.docx',
    uploadedAt: 'Uploaded Oct 10, 2024',
    uploadedDateObj: new Date('2024-10-10'),
    size: '3.4 MB',
    sizeKb: 3481,
    subject: 'BIOLOGY',
    status: 'ANALYZED',
    type: 'word',
  },
  {
    id: 'bio-8',
    title: 'Evolutionary Biology: Nervous System Evolution',
    fileName: 'Evolution_of_Nervous_Systems.txt',
    uploadedAt: 'Uploaded Oct 09, 2024',
    uploadedDateObj: new Date('2024-10-09'),
    size: '890 KB',
    sizeKb: 890,
    subject: 'BIOLOGY',
    status: 'ANALYZED',
    type: 'text',
  },

  // === 4 PSYCHOLOGY DOCUMENTS ===
  {
    id: 'psych-1',
    title: 'Introduction to Neuropsychology',
    fileName: 'Introduction_to_Neuropsychology.docx',
    uploadedAt: 'Uploaded Oct 15, 2024',
    uploadedDateObj: new Date('2024-10-15'),
    size: '1.9 MB',
    sizeKb: 1945,
    subject: 'PSYCHOLOGY',
    status: 'ANALYZED',
    type: 'word',
  },
  {
    id: 'psych-2',
    title: 'Behavioral Psychology and Neuroscience Basics',
    fileName: 'Behavioral_Psychology_Neuroscience.pdf',
    uploadedAt: 'Uploaded Oct 14, 2024',
    uploadedDateObj: new Date('2024-10-14'),
    size: '2.7 MB',
    sizeKb: 2764,
    subject: 'PSYCHOLOGY',
    status: 'ANALYZED',
    type: 'pdf',
  },
  {
    id: 'psych-3',
    title: 'Cognitive Development and Brain Plasticity',
    fileName: 'Cognitive_Development_Brain.pdf',
    uploadedAt: 'Uploaded Oct 13, 2024',
    uploadedDateObj: new Date('2024-10-13'),
    size: '3.2 MB',
    sizeKb: 3276,
    subject: 'PSYCHOLOGY',
    status: 'ANALYZED',
    type: 'pdf',
  },
  {
    id: 'psych-4',
    title: 'Social Psychology: Neuro-social Interactions',
    fileName: 'Social_Psychology_Neuro_Social.docx',
    uploadedAt: 'Uploaded Oct 12, 2024',
    uploadedDateObj: new Date('2024-10-12'),
    size: '2.1 MB',
    sizeKb: 2150,
    subject: 'PSYCHOLOGY',
    status: 'ANALYZED',
    type: 'word',
  },
]

const SUBJECTS_CONTENT_DB: Record<string, SubjectContent> = {
  'doc-design-patterns': {
    previewText: `SECTION 1: SOFTWARE DESIGN PATTERNS (JAVA WORKSPACE)
1.1 Creational Patterns:
  - Singleton: Ensures a class has only one instance and provides a global point of access.
  - Factory Method: Defines an interface for creating an object, but lets subclasses decide which class to instantiate.
  - Builder: Separates the construction of a complex object from its representation.
1.2 Structural Patterns:
  - Adapter: Allows incompatible interfaces to work together.
  - Decorator: Attaches additional responsibilities to an object dynamically.
  - Proxy: Provides a placeholder for another object to control access to it.
1.3 Behavioral Patterns:
  - Observer: Defines a one-to-many dependency so that when one object changes state, all its dependents are notified automatically.
  - Strategy: Defines a family of algorithms, encapsulates each one, and makes them interchangeable.`,
    summaryBullets: [
      'Tóm tắt chi tiết 3 loại mẫu thiết kế chính: Creational (Khởi tạo), Structural (Cấu trúc), và Behavioral (Hành vi).',
      'Phân tích mã nguồn ví dụ thực tế cho mẫu thiết kế Singleton Thread-safe trong ngôn ngữ lập trình Java.',
      'Hướng dẫn áp dụng mẫu thiết kế Observer cho việc xử lý sự kiện bất đồng bộ và kiến trúc Event-Driven.',
      'So sánh chi tiết ưu nhược điểm của việc dùng mẫu Strategy so với việc lồng các câu lệnh rẽ nhánh if-else phức tạp.'
    ],
    flashcards: [
      { q: 'Mẫu thiết kế Singleton dùng để làm gì?', a: 'Đảm bảo một lớp chỉ có duy nhất một thực thể (instance) và cung cấp một điểm truy cập toàn cục cho thực thể đó.' },
      { q: 'Mẫu thiết kế Observer hoạt động theo cơ chế nào?', a: 'Định nghĩa mối quan hệ phụ thuộc một-nhiều giữa các đối tượng. Khi một đối tượng thay đổi trạng thái, tất cả các đối tượng phụ thuộc sẽ được tự động thông báo và cập nhật.' },
      { q: 'Sự khác biệt giữa Factory Method và Abstract Factory là gì?', a: 'Factory Method sử dụng tính kế thừa để quyết định đối tượng cụ thể nào được khởi tạo. Abstract Factory sử dụng ủy quyền (composition) để khởi tạo một họ các đối tượng liên quan.' }
    ]
  },
  'doc-agile': {
    previewText: `CHAPTER 2: AGILE FRAMEWORKS & WORKFLOW MANAGEMENT
2.1 Core Agile Principles:
  - Customer collaboration over contract negotiation.
  - Responding to change over following a plan.
2.2 Scrum Framework:
  - Roles: Product Owner, Scrum Master, Developers.
  - Events: Sprint Planning, Daily Scrum, Sprint Review, Sprint Retrospective.
  - Artifacts: Product Backlog, Sprint Backlog, Increment.
2.3 Kanban System:
  - Visualizing work (Kanban Board).
  - Limiting Work in Progress (WIP) to prevent bottlenecks.
  - Managing and improving flow continuously.`,
    summaryBullets: [
      'Giới thiệu 4 giá trị cốt lõi và 12 nguyên lý của Tuyên ngôn Agile (Agile Manifesto).',
      'Phân tích chi tiết quy trình Scrum với 3 vai trò, 5 sự kiện chính và 3 tạo tác tiêu chuẩn.',
      'Giải thích nguyên lý hoạt động của bảng Kanban và tầm quan trọng của việc giới hạn WIP (Work in Progress).',
      'Hướng dẫn cách đo lường hiệu suất dự án thông qua biểu đồ Burn-down và Burn-up.'
    ],
    flashcards: [
      { q: '3 vai trò cốt lõi trong một Scrum Team là gì?', a: 'Product Owner (Chủ sở hữu sản phẩm), Scrum Master (Bậc thầy Scrum), và Developers (Nhóm phát triển).' },
      { q: 'Tại sao phải giới hạn WIP (Work in Progress) trong Kanban?', a: 'Để tránh hiện tượng nghẽn cổ chai (bottlenecks), tối ưu hóa luồng công việc và giúp nhóm hoàn thành các công việc đang dang dở nhanh hơn.' },
      { q: 'Sự kiện Daily Scrum kéo dài tối đa bao lâu và nhằm mục đích gì?', a: 'Kéo dài tối đa 15 phút, nhằm đồng bộ hóa hoạt động của nhóm và lên kế hoạch làm việc cho 24 giờ tiếp theo.' }
    ]
  },
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
  - Time-independent formulation: Ĥψ = Eψ, where Ĥ Richmond is the Hamiltonian operator.
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
  },
  NEUROSCIENCE: {
    previewText: `SECTION 1: INTRODUCTION TO NEUROANATOMY & BRAIN STRUCTURES
1.1 Cerebral Cortex:
  - Divided into four main lobes: Frontal, Parietal, Occipital, and Temporal.
  - Frontal Lobe: Responsible for executive functions, decision-making, planning, and motor control.
  - Temporal Lobe: Plays a key role in auditory processing, memory encoding, and language comprehension.
1.2 Limbic System:
  - Amygdala: Coordinates emotional responses, particularly fear and threat detection.
  - Hippocampus: Essential for the consolidation of short-term memory into long-term memory.
1.3 Synaptic Transmission:
  - Action potential triggers release of neurotransmitters across the synaptic cleft.`,
    summaryBullets: [
      'Cung cấp bản đồ giải phẫu vỏ não với chức năng chi tiết của 4 thùy chính.',
      'Phân tích chức năng lưu trữ ký ức dài hạn của Hồi hải mã (Hippocampus) thuộc hệ viền.',
      'Mô tả chi tiết cơ chế truyền dẫn qua khe synap dưới tác động của điện thế hoạt động.',
      'Giải thích vai trò điều khiển cảm xúc sợ hãi của Hạch hạnh nhân (Amygdala).'
    ],
    flashcards: [
      { q: 'Thùy trán (Frontal Lobe) chịu trách nhiệm chính về chức năng nào?', a: 'Các chức năng điều hành (executive functions) như lập kế hoạch, ra quyết định và kiểm soát vận động.' },
      { q: 'Hồi hải mã (Hippocampus) đóng vai trò gì trong hệ thống trí nhớ?', a: 'Chuyển đổi ký ức ngắn hạn thành ký ức dài hạn (memory consolidation).' },
      { q: 'Khe synap (Synaptic Cleft) là gì?', a: 'Khoảng trống nhỏ giữa hai tế bào thần kinh nơi diễn ra quá trình truyền dẫn hóa học.' },
    ]
  },
  PSYCHOLOGY: {
    previewText: `CHAPTER 1: BEHAVIORAL AND COGNITIVE PSYCHOLOGY
1.1 Classical Conditioning vs. Operant Conditioning:
  - Ivan Pavlov: Classical conditioning (association of stimuli).
  - B.F. Skinner: Operant conditioning (reinforcement and punishment).
1.2 Brain Plasticity & Behavior:
  - Environmental enrichment promotes neurogenesis and dendritic branching.
1.3 Social Psychology:
  - Conformity, obedience, and the neural substrates of social interactions.`,
    summaryBullets: [
      'So sánh triệt để thuyết điều kiện hóa cổ điển và thuyết điều kiện hóa hành vi.',
      'Giải thích tác động của môi trường giàu kích thích đối với tính mềm dẻo của não bộ.',
      'Phân tích cơ chế thần kinh đằng sau các hành vi xã hội như sự phục tùng và đồng điệu.',
      'Tóm tắt các thí nghiệm kinh điển của Pavlov và Skinner về hành vi động vật.'
    ],
    flashcards: [
      { q: 'Thuyết điều kiện hóa cổ điển gắn liền với tên tuổi nhà tâm lý học nào?', a: 'Ivan Pavlov.' },
      { q: 'Tính mềm dẻo của não bộ (Brain Plasticity) là gì?', a: 'Khả năng tự tái cấu trúc và thích nghi của não bộ dưới tác động của học tập và môi trường.' },
      { q: 'Sự khác biệt chính giữa củng cố tích cực và tiêu cực trong Operant Conditioning?', a: 'Củng cố tích cực thêm kích thích mong muốn; củng cố tiêu cực loại bỏ kích thích không mong muốn.' },
    ]
  }
}

const QUIZ_QUESTIONS = [
  {
    q: "Mẫu thiết kế nào dưới đây thuộc nhóm Creational (Khởi tạo)?",
    options: ["Observer", "Singleton", "Adapter", "Strategy"],
    answer: 1, // Singleton
    explain: "Singleton, Factory Method, và Builder là các mẫu thiết kế thuộc nhóm Creational (Khởi tạo) dùng để kiểm soát việc khởi tạo đối tượng."
  },
  {
    q: "Mẫu thiết kế nào cho phép các đối tượng không tương thích có thể làm việc cùng nhau bằng cách bọc giao diện của chúng?",
    options: ["Decorator", "Facade", "Adapter", "Proxy"],
    answer: 2, // Adapter
    explain: "Adapter Pattern hoạt động như một bộ chuyển đổi giữa hai giao diện không tương thích, giúp tái sử dụng mã nguồn cũ."
  },
  {
    q: "Khi muốn định nghĩa một họ các thuật toán, đóng gói từng thuật toán và làm cho chúng có thể thay thế cho nhau tại thời điểm chạy (runtime), ta dùng mẫu thiết kế nào?",
    options: ["Strategy", "Observer", "Command", "Template Method"],
    answer: 0, // Strategy
    explain: "Strategy Pattern định nghĩa các thuật toán độc lập và cho phép khách hàng hoán đổi thuật toán linh hoạt dựa theo ngữ cảnh."
  }
]

export function DocumentsPage() {
  const { t } = useTranslation()
  const user = useAuthStore(state => state.user)
  const userId = Number(user?.id || 1)
  const [documents, setDocuments] = useState<DocumentItem[]>([])

  // Quiz Modal States
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false)
  const [currentQuizQuestion, setCurrentQuizQuestion] = useState(0)
  const [selectedQuizAnswer, setSelectedQuizAnswer] = useState<number | null>(null)
  const [quizScore, setQuizScore] = useState(0)
  const [showQuizResults, setShowQuizResults] = useState(false)

  // Practice Quiz Modal States & Handlers
  const [selectedDocForQuiz, setSelectedDocForQuiz] = useState<DocumentItem | null>(null)
  const [quizQuestionsForModal, setQuizQuestionsForModal] = useState<QuizQuestionResponse[]>([])
  const [isLoadingQuizForModal, setIsLoadingQuizForModal] = useState(false)
  const [isModifyingQuizForModal, setIsModifyingQuizForModal] = useState(false)
  const [quizPromptForModal, setQuizPromptForModal] = useState('')

  const handleOpenQuizModal = async (doc?: DocumentItem) => {
    const targetDoc = doc || documents[0]
    if (!targetDoc) {
      showToast('Vui lòng tải lên tài liệu trước khi thực hành trắc nghiệm!')
      return
    }
    setSelectedDocForQuiz(targetDoc)
    setCurrentQuizQuestion(0)
    setSelectedQuizAnswer(null)
    setQuizScore(0)
    setShowQuizResults(false)
    setIsQuizModalOpen(true)
    setIsLoadingQuizForModal(true)
    
    try {
      let data = await aiService.getQuiz(targetDoc.id)
      if (!data || data.length === 0) {
        data = await aiService.generateQuiz(targetDoc.id)
      }
      setQuizQuestionsForModal(data)
    } catch (e) {
      console.error(e)
      setQuizQuestionsForModal([])
    } finally {
      setIsLoadingQuizForModal(false)
    }
  }

  const handleModifyQuizForModalWithPrompt = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDocForQuiz || !quizPromptForModal.trim()) return
    setIsModifyingQuizForModal(true)
    try {
      const updatedQuiz = await aiService.modifyQuizWithAi(selectedDocForQuiz.id, quizPromptForModal)
      setQuizQuestionsForModal(updatedQuiz)
      setQuizPromptForModal('')
      setCurrentQuizQuestion(0)
      setSelectedQuizAnswer(null)
      setQuizScore(0)
      setShowQuizResults(false)
      showToast('Bộ đề trắc nghiệm đã được cập nhật bởi AI!')
    } catch (err) {
      console.error(err)
      showToast('Không thể hiệu chỉnh bộ đề. Vui lòng thử lại!')
    } finally {
      setIsModifyingQuizForModal(false)
    }
  }

  // Upload Modal States
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStepMsg, setUploadStepMsg] = useState('')
  const [newDocTitle, setNewDocTitle] = useState('')
  const [newDocSubject, setNewDocSubject] = useState<'MATHEMATICS' | 'BIOLOGY' | 'PHYSICS' | 'COMPSCI' | 'PHILOSOPHY' | 'ECONOMICS' | 'GENERAL'>('GENERAL')
  const [newDocType, setNewDocType] = useState<'pdf' | 'word' | 'image' | 'text' | 'slides'>('pdf')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  // Preview Modal States
  const [activePreviewDoc, setActivePreviewDoc] = useState<DocumentItem | null>(null)
  const [activePreviewTab, setActivePreviewTab] = useState<'preview' | 'summary' | 'flashcards' | 'quiz'>('preview')
  const [activeFlashcardIndex, setActiveFlashcardIndex] = useState(0)
  const [isFlashcardFlipped, setIsFlashcardFlipped] = useState(false)
  const [previewSummary, setPreviewSummary] = useState<AiSummaryResponse | null>(null)
  const [previewFlashcards, setPreviewFlashcards] = useState<FlashcardResponse[]>([])
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestionResponse[]>([])
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false)
  const [isModifyingQuiz, setIsModifyingQuiz] = useState(false)
  const [quizPrompt, setQuizPrompt] = useState('')

  // Quick Chat drawer States
  const [isChatDrawerOpen, setIsChatDrawerOpen] = useState(false)
  const [selectedDocForChat, setSelectedDocForChat] = useState<DocumentItem | null>(null)
  const [documentChats, setDocumentChats] = useState<Record<string, Array<{ sender: 'user' | 'ai'; text: string; time: string }>>>({})
  const [newChatMessage, setNewChatMessage] = useState('')
  const [activeChatSessionId, setActiveChatSessionId] = useState<number | null>(null)

  // Toast Notification States
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [isToastVisible, setIsToastVisible] = useState(false)

  // AI Workspace Analytics Insights Modal States & Variables
  const [isInsightsModalOpen, setIsInsightsModalOpen] = useState(false)
  
  // Dynamic Storage calculations for AI Workspace Analytics Insights Modal
  const totalStorageMb = documents.reduce((acc, doc) => acc + (doc.sizeKb || 0), 0) / 1024
  const totalStorageFormatted = totalStorageMb.toFixed(1)
  const storagePercentage = Math.min(100, Math.round((totalStorageMb / 100) * 100))

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

  // Mapping functions helper for backend DocumentResponse -> DocumentItem
  const mapMimeOrExtensionToType = (fileType: string, fileName: string): 'pdf' | 'word' | 'image' | 'text' | 'slides' => {
    const nameLower = fileName.toLowerCase()
    if (nameLower.endsWith('.pdf')) return 'pdf'
    if (nameLower.endsWith('.doc') || nameLower.endsWith('.docx')) return 'word'
    if (nameLower.endsWith('.ppt') || nameLower.endsWith('.pptx')) return 'slides'
    if (nameLower.endsWith('.png') || nameLower.endsWith('.jpg') || nameLower.endsWith('.jpeg')) return 'image'
    if (nameLower.endsWith('.txt')) return 'text'
    
    const typeLower = (fileType || '').toLowerCase()
    if (typeLower.includes('pdf')) return 'pdf'
    if (typeLower.includes('word') || typeLower.includes('msword') || typeLower.includes('officedocument.wordprocessingml')) return 'word'
    if (typeLower.includes('powerpoint') || typeLower.includes('officedocument.presentationml')) return 'slides'
    if (typeLower.includes('image') || typeLower.includes('png') || typeLower.includes('jpeg')) return 'image'
    return 'text'
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const mapBackendDocToItem = (doc: any): DocumentItem => {
    return {
      id: String(doc.id),
      title: doc.title,
      fileName: doc.fileName || doc.originalFileName || 'Untitled',
      uploadedAt: doc.createdAt ? `Uploaded ${new Date(doc.createdAt).toLocaleDateString('vi-VN')}` : 'Uploaded Just Now',
      uploadedDateObj: doc.createdAt ? new Date(doc.createdAt) : new Date(),
      size: doc.fileSize ? formatBytes(doc.fileSize) : '0 Bytes',
      sizeKb: doc.fileSize ? Math.round(doc.fileSize / 1024) : 0,
      subject: (doc.subject || 'GENERAL') as any,
      status: 'ANALYZED',
      type: mapMimeOrExtensionToType(doc.fileType, doc.fileName || doc.originalFileName || '')
    }
  }

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const backendDocs = await documentService.getAllDocuments(userId)
        if (backendDocs) {
          setDocuments(backendDocs.map(mapBackendDocToItem))
        }
      } catch (e) {
        console.error('Failed to load documents from backend:', e)
        showToast('Không thể tải danh sách tài liệu từ máy chủ.')
      }
    }
    fetchDocuments()
  }, [userId])

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile) {
      showToast('Vui lòng chọn một tệp tin để tải lên!')
      return
    }

    setIsUploading(true)
    setUploadProgress(5)
    setUploadStepMsg('Establishing secure connection...')

    // Start progress simulator that stops at 90%
    let progressVal = 5
    const progressInterval = setInterval(() => {
      progressVal += Math.floor(Math.random() * 10) + 2
      if (progressVal >= 90) {
        progressVal = 90
        setUploadStepMsg('Waiting for AI analysis to complete...')
        clearInterval(progressInterval)
      } else {
        if (progressVal < 35) {
          setUploadStepMsg('Uploading file to cloud storage...')
        } else if (progressVal < 65) {
          setUploadStepMsg('Extracting text content...')
        } else {
          setUploadStepMsg('Running AI semantic analysis...')
        }
      }
      setUploadProgress(progressVal)
    }, 150)

    try {
      const finalTitle = newDocTitle || selectedFile.name.split('.')[0] || 'Untitled Study Material'
      const response = await documentService.uploadDocument(
        selectedFile,
        finalTitle,
        '', // description
        newDocSubject,
        'PRIVATE',
        userId,
        [] // tags
      )

      clearInterval(progressInterval)
      setUploadProgress(100)
      setUploadStepMsg('Finished!')

      setTimeout(() => {
        const newDocItem = mapBackendDocToItem(response)
        setDocuments((prev) => [newDocItem, ...prev])
        setIsUploading(false)
        setUploadProgress(0)
        setIsUploadModalOpen(false)

        // Log document upload
        logActivity({
          eventKey: 'documentUploaded',
          category: 'moderation',
          status: 'success',
          eventTextEn: 'Document uploaded',
          eventTextVi: 'Tải lên tài liệu',
          detailsTextEn: `Uploaded document '${finalTitle}' successfully.`,
          detailsTextVi: `Tải lên thành công tài liệu '${finalTitle}'.`
        })

        // Log AI summary generated
        logActivity({
          eventKey: 'aiSummaryGenerated',
          category: 'ai-audit',
          status: 'success',
          eventTextEn: 'AI Summary generated',
          eventTextVi: 'Tạo tóm tắt AI',
          detailsTextEn: `Successfully generated AI Summary for document '${finalTitle}'.`,
          detailsTextVi: `Đã tạo thành công Tóm tắt AI cho tài liệu '${finalTitle}'.`
        })

        showToast(`Tài liệu "${finalTitle}" tải lên và phân tích AI thành công!`)
        
        setNewDocTitle('')
        setNewDocSubject('GENERAL')
        setNewDocType('pdf')
        setSelectedFile(null)
      }, 500)
    } catch (error) {
      clearInterval(progressInterval)
      setIsUploading(false)
      setUploadProgress(0)
      console.error('Failed to upload document:', error)
      showToast('Có lỗi xảy ra khi tải lên tài liệu. Vui lòng thử lại!')
    }
  }

  // Delete Action
  const handleDeleteDocument = async (id: string) => {
    const targetDoc = documents.find(d => d.id === id)
    if (targetDoc) {
      try {
        await documentService.deleteDocument(id)
        setDocuments((prev) => prev.filter((d) => d.id !== id))
        
        // Log document deletion activity
        logActivity({
          eventKey: 'documentDeleted',
          category: 'moderation',
          status: 'success',
          eventTextEn: 'Document deleted',
          eventTextVi: 'Xóa tài liệu',
          detailsTextEn: `Permanently deleted document '${targetDoc.title || targetDoc.fileName}' from storage.`,
          detailsTextVi: `Đã xóa vĩnh viễn tài liệu '${targetDoc.title || targetDoc.fileName}' khỏi kho lưu trữ.`
        })

        showToast(`Đã xóa tài liệu "${targetDoc.title || targetDoc.fileName}"`)
      } catch (e) {
        console.error('Failed to delete document:', e)
        showToast('Có lỗi xảy ra khi xóa tài liệu. Vui lòng thử lại!')
      }
    }
  }

  // Open Chat Drawer
  const handleOpenChat = async (doc: DocumentItem) => {
    setSelectedDocForChat(doc)
    setIsChatDrawerOpen(true)
    
    try {
      const session = await aiService.createOrGetChatSession(doc.id, userId)
      setActiveChatSessionId(session.id)
      
      const history = await aiService.getChatHistory(session.id)
      if (history && history.length > 0) {
        const mappedMsgs = history.map(msg => ({
          sender: msg.sender.toLowerCase() === 'user' ? 'user' as const : 'ai' as const,
          text: msg.messageText,
          time: new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }))
        setDocumentChats(prev => ({
          ...prev,
          [doc.id]: mappedMsgs
        }))
      } else {
        // seed welcome message
        setDocumentChats(prev => ({
          ...prev,
          [doc.id]: [
            {
              sender: 'ai' as const,
              text: `Xin chào! Tôi là Trợ lý học tập AI. Tôi đã phân tích hoàn chỉnh tài liệu "${doc.title || doc.fileName}" (${doc.subject}).\n\nBạn có muốn tôi tóm tắt 3 ý cốt lõi, tạo bộ câu hỏi trắc nghiệm ôn tập hay giải đáp cụ thể nội dung nào không?`,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          ]
        }))
      }
    } catch (err) {
      console.error('Failed to load chat history:', err)
      // seed welcome message fallback
      setDocumentChats(prev => ({
        ...prev,
        [doc.id]: [
          {
            sender: 'ai' as const,
            text: `Xin chào! Tôi là Trợ lý học tập AI. Tôi đã phân tích hoàn chỉnh tài liệu "${doc.title || doc.fileName}" (${doc.subject}).\n\nBạn có muốn tôi tóm tắt 3 ý cốt lõi, tạo bộ câu hỏi trắc nghiệm ôn tập hay giải đáp cụ thể nội dung nào không?`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]
      }))
    }
  }

  // Chat message send
  const handleSendChatMessage = async (e: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault()
    
    const textToSend = customText || newChatMessage
    if (!textToSend.trim() || !selectedDocForChat) return

    // Log AI Chat Assistant query activity
    logActivity({
      eventKey: 'aiChatAssistant',
      category: 'ai-audit',
      status: 'success',
      eventTextEn: 'AI Chat Assistant query',
      eventTextVi: 'Truy vấn trợ lý AI',
      detailsTextEn: `Queried AI Assistant: '${textToSend.length > 60 ? textToSend.substring(0, 57) + '...' : textToSend}'.`,
      detailsTextVi: `Đã gửi câu hỏi trợ lý AI: '${textToSend.length > 60 ? textToSend.substring(0, 57) + '...' : textToSend}'.`
    })

    const userMsg = {
      sender: 'user' as const,
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setDocumentChats((prev) => ({
      ...prev,
      [selectedDocForChat.id]: [...(prev[selectedDocForChat.id] || []), userMsg]
    }))

    if (!customText) setNewChatMessage('')

    try {
      let sessionId = activeChatSessionId
      if (!sessionId) {
        const session = await aiService.createOrGetChatSession(selectedDocForChat.id, userId)
        sessionId = session.id
        setActiveChatSessionId(session.id)
      }
      
      const reply = await aiService.sendMessage(sessionId, textToSend)
      
      const aiMsg = {
        sender: 'ai' as const,
        text: reply.messageText,
        time: new Date(reply.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }

      setDocumentChats((prev) => ({
        ...prev,
        [selectedDocForChat.id]: [...(prev[selectedDocForChat.id] || []), aiMsg]
      }))
    } catch (err) {
      console.error('Failed to send chat message:', err)
      const errorMsg = {
        sender: 'ai' as const,
        text: 'Xin lỗi, tôi gặp sự cố khi xử lý câu hỏi của bạn. Vui lòng thử lại sau!',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
      setDocumentChats((prev) => ({
        ...prev,
        [selectedDocForChat.id]: [...(prev[selectedDocForChat.id] || []), errorMsg]
      }))
    }
  }

  // Download Action
  const handleDownloadFile = async (doc: DocumentItem) => {
    showToast(`Đang chuẩn bị tải xuống: ${doc.fileName}...`)

    try {
      const blob = await documentService.downloadDocument(doc.id, userId)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = doc.fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      showToast(`Tải xuống thành công tệp: ${doc.fileName}`)
    } catch (e) {
      console.error('Failed to download document:', e)
      showToast('Có lỗi xảy ra khi tải tài liệu. Vui lòng thử lại!')
    }
  }

  // Open Preview Modal
  const handleOpenPreview = (doc: DocumentItem) => {
    setActivePreviewDoc(doc)
    setActivePreviewTab('preview')
    setActiveFlashcardIndex(0)
    setIsFlashcardFlipped(false)
  }

  // Load quiz questions for the preview tab
  const handleLoadDocQuizForTab = async (doc: DocumentItem) => {
    setIsGeneratingQuiz(true)
    try {
      let data = await aiService.getQuiz(doc.id)
      if (!data || data.length === 0) {
        data = await aiService.generateQuiz(doc.id)
      }
      setQuizQuestions(data)
    } catch (e) {
      console.error(e)
      // Fallback mock data if the API fails
      setQuizQuestions(QUIZ_QUESTIONS.map((q, idx) => ({
        id: idx,
        documentId: 0,
        q: q.q,
        options: JSON.stringify(q.options),
        answer: q.answer,
        explain: q.explain,
        createdAt: new Date().toISOString()
      })))
    } finally {
      setIsGeneratingQuiz(false)
    }
  }

  // Handle modifying quiz with AI prompt
  const handleModifyQuizWithPrompt = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activePreviewDoc || !quizPrompt.trim()) return
    setIsModifyingQuiz(true)
    try {
      const updatedQuiz = await aiService.modifyQuizWithAi(activePreviewDoc.id, quizPrompt)
      setQuizQuestions(updatedQuiz)
      setQuizPrompt('')
      showToast('Bộ đề trắc nghiệm đã được cập nhật bởi AI!')
    } catch (err) {
      console.error(err)
      showToast('Không thể hiệu chỉnh bộ đề. Vui lòng thử lại!')
    } finally {
      setIsModifyingQuiz(false)
    }
  }

  // Automatically fetch AI summaries and flashcards when opening preview doc
  useEffect(() => {
    if (!activePreviewDoc) {
      setPreviewSummary(null)
      setPreviewFlashcards([])
      return
    }

    const loadDocDetails = async () => {
      try {
        // Load summary
        try {
          const summary = await aiService.getSummary(activePreviewDoc.id)
          setPreviewSummary(summary)
        } catch (e) {
          // If summary not found, generate it
          try {
            const summary = await aiService.generateSummary(activePreviewDoc.id)
            setPreviewSummary(summary)
          } catch (genErr) {
            console.error('Failed to get/generate summary:', genErr)
          }
        }

        // Load flashcards
        try {
          const flashcards = await aiService.getFlashcards(activePreviewDoc.id)
          setPreviewFlashcards(flashcards)
        } catch (fcErr) {
          console.error('Failed to get flashcards:', fcErr)
        }
      } catch (err) {
        console.error('Error loading preview document AI content:', err)
      }
    }

    loadDocDetails()
  }, [activePreviewDoc])

  const getDocContent = (doc: DocumentItem | null) => {
    if (!doc) return SUBJECTS_CONTENT_DB.GENERAL
    return SUBJECTS_CONTENT_DB[doc.id] || SUBJECTS_CONTENT_DB[doc.subject] || SUBJECTS_CONTENT_DB.GENERAL
  }

  // File Icon Renderer
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

  // Status Badge Renderer
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'ANALYZED':
        return (
          <span className="flex items-center gap-1 rounded-md border border-blue-200 dark:border-blue-900 bg-white dark:bg-slate-900 px-2 py-0.5 text-[10px] font-semibold text-blue-600 dark:text-blue-400 shadow-xs transition-all duration-300">
            <Sparkles className="h-3 w-3 animate-pulse text-blue-500" />
            ANALYZED
          </span>
        )
      case 'PENDING':
        return (
          <span className="rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
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
          <span className="rounded-md border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-400 dark:text-slate-550">
            QUEUED
          </span>
        )
    }
  }

  return (
    <div className="relative min-h-screen">
      {/* Toast popup */}
      {isToastVisible && toastMessage && (
        <div className="fixed bottom-24 right-6 z-50 flex items-center gap-3.5 rounded-2xl bg-slate-900 text-white px-5 py-4 shadow-2xl animate-slide-in-right max-w-sm">
          <CheckCircle2 className="h-5 w-5 text-blue-400 shrink-0" />
          <p className="text-sm font-medium leading-normal">{toastMessage}</p>
          <button onClick={() => setIsToastVisible(false)} className="text-white/60 hover:text-white ml-2" aria-label="Close Notification">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Renders MyDocumentsPage or SubjectCategoryPage */}
      <Outlet
        context={{
          // Shared Context
          documents,
          setDocuments,
          openUploadModal: () => setIsUploadModalOpen(true),
          openChatDrawer: handleOpenChat,
          openPreviewModal: handleOpenPreview,
          handleOpenPreview,
          openQuizModal: handleOpenQuizModal,

          // Utilities passed down to child pages
          showToast,
          handleDownloadFile,
          handleDeleteDocument,
          renderFileIcon,
          renderStatusBadge,

          setIsUploadModalOpen,
          setIsInsightsModalOpen,
          handleOpenChat,
        }}
      />

      {/* Upload Document Modal */}
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
              <div className="relative mx-auto flex h-24 w-24 items-center justify-center">
                <div className="absolute h-full w-full rounded-full border-4 border-slate-100 dark:border-slate-800" />
                <div
                  className="absolute h-full w-full rounded-full border-4 border-[#2563eb] border-t-transparent animate-spin"
                  style={{ animationDuration: '1.2s' }}
                />
                <span className="text-xl font-black text-[#2563eb]">{uploadProgress}%</span>
              </div>
              <div className="space-y-2 max-w-sm mx-auto">
                <h4 className="text-base font-bold text-slate-800 dark:text-slate-100 animate-pulse">
                  {uploadStepMsg}
                </h4>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-[#2563eb] h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-500">Please keep this window open while AI processes your document</p>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-1.5 text-left">
                <label htmlFor="doc-title-input" className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  Document Title (Optional)
                </label>
                <Input
                  id="doc-title-input"
                  placeholder="e.g. Calculus II Formulas, Organic Chemistry Seminar"
                  value={newDocTitle}
                  onChange={(e) => setNewDocTitle(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-left">
                <div className="space-y-1.5">
                  <label htmlFor="subject-select" className="text-sm font-bold text-slate-700 dark:text-slate-300">Subject</label>
                  <select
                    id="subject-select"
                    value={newDocSubject}
                    onChange={(e) => setNewDocSubject(e.target.value as any)}
                    className="w-full appearance-none rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-3 pr-10 text-base text-slate-800 dark:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb]/30"
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
                  <label htmlFor="type-select" className="text-sm font-bold text-slate-700 dark:text-slate-300">File Type</label>
                  <select
                    id="type-select"
                    value={newDocType}
                    onChange={(e) => setNewDocType(e.target.value as any)}
                    className="w-full appearance-none rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-3 pr-10 text-base text-slate-800 dark:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb]/30"
                  >
                    <option value="pdf">PDF File (.pdf)</option>
                    <option value="word">Word Document (.docx)</option>
                    <option value="text">Text File (.txt)</option>
                    <option value="image">Image Note (.png, .jpg)</option>
                    <option value="slides">Presentation Slides (.pptx)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-350">Document File</label>
                <div
                  onClick={() => {
                    const input = document.createElement('input')
                    input.type = 'file'
                    input.onchange = (e) => {
                      const files = (e.target as HTMLInputElement).files
                      if (files && files[0]) {
                        setSelectedFile(files[0])
                        if (!newDocTitle) {
                          const cleanName = files[0].name.split('.')[0].replace(/[_-]/g, ' ')
                          setNewDocTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1))
                        }
                      }
                    }
                    input.click()
                  }}
                  className={cn(
                    'flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 p-8 text-center cursor-pointer transition-all duration-300',
                    selectedFile
                      ? 'border-blue-500 bg-blue-50/20 dark:bg-blue-950/20'
                      : 'hover:border-blue-500/50 hover:bg-slate-50 dark:hover:bg-slate-800 bg-slate-50/30'
                  )}
                >
                  <div className={cn(
                    'flex h-12 w-12 items-center justify-center rounded-full shadow-xs transition-colors',
                    selectedFile ? 'bg-[#2563eb] text-white' : 'bg-blue-50 dark:bg-slate-800 text-[#2563eb] dark:text-blue-400'
                  )}>
                    <CloudUpload className="h-6 w-6" />
                  </div>
                  {selectedFile ? (
                    <div className="mt-4">
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{selectedFile.name}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready to process</p>
                    </div>
                  ) : (
                    <div className="mt-4">
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Drag and drop your document here</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">or click to browse your folders (PDF, DOCX, TXT, PNG, PPTX up to 50MB)</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4 mt-8">
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
                  className="rounded-xl bg-[#2563eb] text-white font-semibold shadow-md shadow-blue-500/10 px-6"
                >
                  Process with AI
                </Button>
              </div>
            </>
          )}
        </form>
      </Modal>

      {/* AI Quick Chat Drawer */}
      {isChatDrawerOpen && selectedDocForChat && (
        <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl animate-slide-in-right">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-850 p-4 bg-slate-50 dark:bg-slate-850">
            <div className="flex items-center gap-3 text-left">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/40 text-[#2563eb] dark:text-blue-400">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h3 className="truncate text-sm font-bold text-slate-800 dark:text-slate-100">
                  AI Study Assistant
                </h3>
                <p className="truncate text-xs text-slate-400 dark:text-slate-500 font-medium">
                  Document: {selectedDocForChat.title || selectedDocForChat.fileName}
                </p>
              </div>
            </div>
            
            <button
              onClick={() => setIsChatDrawerOpen(false)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-250 transition-all cursor-pointer"
              aria-label="Close Chat"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-slate-950">
            {(documentChats[selectedDocForChat.id] || []).map((msg, index) => (
              <div
                key={index}
                className={cn(
                  'flex max-w-[85%] flex-col rounded-2xl p-3.5 text-sm shadow-xs transition-all text-left',
                  msg.sender === 'user'
                    ? 'ml-auto bg-blue-600 text-white rounded-br-none'
                    : 'bg-white dark:bg-slate-850 text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-slate-800/80 rounded-bl-none'
                )}
              >
                <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                <span
                  className={cn(
                    'mt-1.5 self-end text-[9px] font-semibold',
                    msg.sender === 'user' ? 'text-blue-200' : 'text-slate-400 dark:text-slate-500'
                  )}
                >
                  {msg.time}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 px-4 py-2 flex items-center gap-2 overflow-x-auto bg-white dark:bg-slate-900 whitespace-nowrap scrollbar-none">
            <button
              onClick={(e) => handleSendChatMessage(e, 'Tóm tắt tài liệu này giúp tôi')}
              className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-2.5 py-1 text-xs text-slate-600 dark:text-slate-400 hover:border-blue-500/40 hover:text-blue-600 dark:hover:text-blue-400 transition-all cursor-pointer"
            >
              📝 Tóm tắt chính
            </button>
            <button
              onClick={(e) => handleSendChatMessage(e, 'Tạo các flashcard ôn tập')}
              className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-2.5 py-1 text-xs text-slate-600 dark:text-slate-400 hover:border-blue-500/40 hover:text-blue-600 dark:hover:text-blue-400 transition-all cursor-pointer"
            >
              🧠 Tạo Flashcard
            </button>
            <button
              onClick={(e) => handleSendChatMessage(e, 'Trắc nghiệm đố vui kiến thức')}
              className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-2.5 py-1 text-xs text-slate-600 dark:text-slate-400 hover:border-blue-500/40 hover:text-blue-600 dark:hover:text-blue-400 transition-all cursor-pointer"
            >
              ❓ Đố kiến thức
            </button>
          </div>

          <form
            onSubmit={handleSendChatMessage}
            className="border-t border-slate-200 dark:border-slate-800 p-4 bg-white dark:bg-slate-900 flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Ask anything about this document..."
              value={newChatMessage}
              onChange={(e) => setNewChatMessage(e.target.value)}
              className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-[#2563eb]/50 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!newChatMessage.trim()}
              className="rounded-xl bg-[#2563eb] text-white h-10 w-10 shadow-xs hover:bg-blue-700 shrink-0"
              aria-label="Send message"
            >
              <Send className="h-4.5 w-4.5" />
            </Button>
          </form>
        </div>
      )}

      {/* Interactive Document Preview Modal */}
      {activePreviewDoc && (
        <Modal
          isOpen={!!activePreviewDoc}
          onClose={() => setActivePreviewDoc(null)}
          title={activePreviewDoc.title || activePreviewDoc.fileName}
          description={`${activePreviewDoc.subject} • ${activePreviewDoc.size} • ${activePreviewDoc.uploadedAt}`}
          className="max-w-4xl animate-fade-in"
        >
          <div className="space-y-6">
            <div className="flex border-b border-slate-100">
              <button
                onClick={() => setActivePreviewTab('preview')}
                className={cn(
                  'px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-all',
                  activePreviewTab === 'preview'
                    ? 'border-[#2563eb] text-[#2563eb]'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                )}
              >
                Document Reader
              </button>
              <button
                onClick={() => setActivePreviewTab('summary')}
                className={cn(
                  'px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-all',
                  activePreviewTab === 'summary'
                    ? 'border-[#2563eb] text-[#2563eb]'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
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
                    ? 'border-[#2563eb] text-[#2563eb]'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                )}
              >
                Flashcards ({previewFlashcards.length > 0 ? previewFlashcards.length : (getDocContent(activePreviewDoc)?.flashcards.length || 0)})
              </button>
              <button
                onClick={() => {
                  setActivePreviewTab('quiz')
                  if (activePreviewDoc) {
                    handleLoadDocQuizForTab(activePreviewDoc)
                  }
                }}
                className={cn(
                  'px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-all',
                  activePreviewTab === 'quiz'
                    ? 'border-[#2563eb] text-[#2563eb]'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                )}
              >
                Practice Quiz
              </button>
            </div>

            {activePreviewTab === 'preview' && (
              <div className="space-y-4">
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-5 max-h-[350px] overflow-y-auto font-mono text-sm leading-relaxed text-slate-700 dark:text-slate-350 whitespace-pre-wrap">
                  {getDocContent(activePreviewDoc)?.previewText}
                </div>
                <div className="flex justify-between items-center bg-blue-50/40 dark:bg-blue-955/20 rounded-xl p-4 border border-blue-100/50 dark:border-blue-900/30">
                  <div className="flex items-center gap-3 text-sm text-[#2563eb] dark:text-blue-400 font-medium">
                    <BrainCircuit className="h-5 w-5" />
                    AI has indexed this document successfully
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      const doc = activePreviewDoc
                      setActivePreviewDoc(null)
                      handleOpenChat(doc)
                    }}
                    className="text-[#2563eb] dark:text-blue-400 hover:bg-blue-50/80 dark:hover:bg-blue-955/40 font-semibold text-sm rounded-lg"
                  >
                    Discuss with AI assistant →
                  </Button>
                </div>
              </div>
            )}

            {activePreviewTab === 'summary' && (
              <div className="space-y-5 py-2">
                <div className="flex gap-4 items-start bg-blue-50/30 dark:bg-blue-950/20 rounded-2xl p-5 border border-blue-100/40 dark:border-blue-900/30">
                  <div className="bg-blue-100 dark:bg-blue-955/60 rounded-xl p-2.5 text-[#2563eb] dark:text-blue-400">
                    <Sparkles className="h-6 w-6 stroke-[1.8] animate-pulse" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-[16px]">AI Executive Summary</h4>
                    <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Here is a comprehensive semantic summary of the uploaded document, generated instantly by deep reading.</p>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
                  {(() => {
                    let bullets: string[] = []
                    if (previewSummary) {
                      try {
                        if (typeof previewSummary.summaryBullets === 'string') {
                          bullets = JSON.parse(previewSummary.summaryBullets)
                        } else if (Array.isArray(previewSummary.summaryBullets)) {
                          bullets = previewSummary.summaryBullets
                        }
                      } catch (e) {
                        if (previewSummary.summaryText) {
                          bullets = [previewSummary.summaryText]
                        }
                      }
                    }
                    if (!bullets || bullets.length === 0) {
                      bullets = getDocContent(activePreviewDoc)?.summaryBullets || []
                    }
                    return bullets.map((bullet, idx) => (
                      <div key={idx} className="flex gap-3 items-start text-sm text-slate-700 dark:text-slate-350 leading-relaxed text-left">
                        <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                        <p>{bullet}</p>
                      </div>
                    ))
                  })()}
                </div>
              </div>
            )}

            {activePreviewTab === 'flashcards' && (
              <div className="space-y-6 py-2 flex flex-col items-center">
                {(() => {
                  let flashcardsList = (previewFlashcards || []).map(fc => ({ question: fc.question, answer: fc.answer }))
                  if (flashcardsList.length === 0) {
                    const localFc = getDocContent(activePreviewDoc)?.flashcards || []
                    flashcardsList = localFc.map(fc => ({ question: fc.q, answer: fc.a }))
                  }
                  const currentCard = flashcardsList[activeFlashcardIndex]

                  if (!currentCard) return <p className="text-sm text-slate-400 dark:text-slate-500">No flashcards available</p>

                  const q = currentCard.question
                  const a = currentCard.answer

                  return (
                    <>
                      <div
                        onClick={() => setIsFlashcardFlipped(!isFlashcardFlipped)}
                        className={cn(
                          'relative h-56 w-full max-w-lg rounded-2xl border cursor-pointer select-none shadow-xs transition-all duration-500 preserve-3d flex items-center justify-center p-8 text-center hover:shadow-md',
                          isFlashcardFlipped
                            ? 'border-blue-200 dark:border-blue-900 bg-blue-50/30 dark:bg-blue-955/20'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                        )}
                      >
                        {isFlashcardFlipped ? (
                          <div className="space-y-3">
                            <span className="text-[10px] uppercase tracking-widest text-[#2563eb] dark:text-blue-400 font-bold bg-blue-100/60 dark:bg-blue-955/60 px-2 py-0.5 rounded">Answer / Mặt B</span>
                            <p className="text-lg font-bold text-slate-800 dark:text-slate-100 leading-relaxed">{a}</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <span className="text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500 font-bold bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded">Question / Mặt A</span>
                            <p className="text-xl font-black text-slate-800 dark:text-slate-100 leading-relaxed">{q}</p>
                            <p className="text-xs text-slate-400 dark:text-slate-500 pt-4">Click card to reveal answer</p>
                          </div>
                        )}
                      </div>

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
                        <span className="text-sm text-slate-500 dark:text-slate-400 font-semibold">
                          {activeFlashcardIndex + 1} / {flashcardsList.length}
                        </span>
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={activeFlashcardIndex === flashcardsList.length - 1}
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

            {activePreviewTab === 'quiz' && (
              <div className="space-y-6 py-2 text-left">
                {isGeneratingQuiz ? (
                  <div className="py-12 text-center space-y-4">
                    <div className="w-10 h-10 rounded-full border-4 border-t-blue-600 border-blue-100 animate-spin mx-auto" />
                    <p className="text-xs text-slate-400">AI đang chuẩn bị câu hỏi trắc nghiệm...</p>
                  </div>
                ) : quizQuestions.length === 0 ? (
                  <p className="text-center text-sm py-8 text-slate-400">Không có câu hỏi trắc nghiệm.</p>
                ) : !showQuizResults ? (
                  <>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs font-bold text-slate-400">
                        <span>QUESTION {currentQuizQuestion + 1} OF {quizQuestions.length}</span>
                        <span className="text-[#2563eb]">{Math.round(((currentQuizQuestion) / quizQuestions.length) * 100)}% Complete</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div 
                          className="bg-[#2563eb] h-2 rounded-full transition-all duration-300"
                          style={{ width: `${((currentQuizQuestion + 1) / quizQuestions.length) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div className="rounded-2xl bg-slate-50 dark:bg-slate-800 p-5 border border-slate-200 dark:border-slate-700">
                      <h4 className="text-base font-extrabold text-slate-800 dark:text-slate-100 leading-relaxed">
                        {quizQuestions[currentQuizQuestion].q}
                      </h4>
                    </div>

                    <div className="space-y-3">
                      {(() => {
                        const opts = typeof quizQuestions[currentQuizQuestion].options === 'string' 
                          ? JSON.parse(quizQuestions[currentQuizQuestion].options) 
                          : quizQuestions[currentQuizQuestion].options;
                        return opts.map((option: string, idx: number) => {
                          const isSelected = selectedQuizAnswer === idx;
                          const isCorrect = quizQuestions[currentQuizQuestion].answer === idx;
                          const hasAnswered = selectedQuizAnswer !== null;

                          let optionClass = "flex items-center justify-between w-full p-4 rounded-xl border text-left font-semibold text-sm transition-all duration-200 focus:outline-none ";
                          
                          if (!hasAnswered) {
                            optionClass += "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-[#2563eb]/50 hover:bg-[#2563eb]/5 text-slate-700 dark:text-slate-350";
                          } else if (isSelected) {
                            optionClass += isCorrect 
                              ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-350" 
                              : "border-rose-500 bg-rose-50/50 dark:bg-rose-955/20 text-rose-800 dark:text-rose-350";
                          } else if (isCorrect) {
                            optionClass += "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-350";
                          } else {
                            optionClass += "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-650 opacity-60";
                          }

                          return (
                            <button
                              key={idx}
                              disabled={hasAnswered}
                              onClick={() => {
                                setSelectedQuizAnswer(idx)
                                if (idx === quizQuestions[currentQuizQuestion].answer) {
                                  setQuizScore(prev => prev + 1)
                                }
                              }}
                              className={optionClass}
                            >
                              <div className="flex items-center gap-3">
                                <span className={cn(
                                  "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold border transition-colors",
                                  !hasAnswered && (isSelected ? "bg-[#2563eb] text-white border-[#2563eb]" : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-550"),
                                  hasAnswered && isCorrect && "bg-emerald-500 text-white border-emerald-500",
                                  hasAnswered && isSelected && !isCorrect && "bg-rose-500 text-white border-rose-500",
                                  hasAnswered && !isSelected && !isCorrect && "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-550"
                                )}>
                                  {String.fromCharCode(65 + idx)}
                                </span>
                                <span className="leading-snug">{option}</span>
                              </div>
                              
                              {hasAnswered && (
                                <div>
                                  {isCorrect && (
                                    <svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                      <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                  )}
                                  {isSelected && !isCorrect && (
                                    <svg className="h-5 w-5 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                      <line x1="18" y1="6" x2="6" y2="18" />
                                      <line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                  )}
                                </div>
                              )}
                            </button>
                          );
                        });
                      })()}
                    </div>

                    {selectedQuizAnswer !== null && (
                      <div className="rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/40 dark:bg-amber-955/20 p-4.5 text-xs text-amber-900 dark:text-amber-300 leading-relaxed flex gap-3.5 animate-fade-in shadow-xs">
                        <div className="bg-amber-100 dark:bg-amber-900/40 rounded-lg p-2 text-amber-700 dark:text-amber-400 h-fit shrink-0">
                          <svg className="h-4.5 w-4.5 stroke-[2]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
                            <path d="M9 18h6" />
                            <path d="M10 22h4" />
                          </svg>
                        </div>
                        <div className="space-y-1">
                          <p className="font-extrabold">AI Tip & Explanation:</p>
                          <p className="font-medium text-amber-800 dark:text-amber-350">{quizQuestions[currentQuizQuestion].explain}</p>
                        </div>
                      </div>
                    )}

                    {/* AI Assistant Edit Panel inside Preview Modal Quiz Tab */}
                    <div className="mt-6 p-4 rounded-xl border border-indigo-150/60 dark:border-indigo-950/60 bg-[#f4f7ff] dark:bg-indigo-955/10 backdrop-blur-md">
                      <div className="flex gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/40 flex items-center justify-center shrink-0">
                          <Sparkles className="size-4.5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-[12px] font-extrabold text-slate-800 dark:text-slate-200">
                            Trợ lý Hiệu chỉnh Bộ đề AI (AI Prompt Edit)
                          </h4>
                          <p className="text-[10px] font-semibold text-slate-400 mt-0.5">
                            Nhập yêu cầu (ví dụ: 'Dịch sang tiếng Việt', 'Làm đề khó hơn') để tinh chỉnh bộ đề.
                          </p>
                        </div>
                      </div>
                      <form onSubmit={handleModifyQuizWithPrompt} className="flex gap-2 mt-3">
                        <input
                          type="text"
                          value={quizPrompt}
                          onChange={(e) => setQuizPrompt(e.target.value)}
                          placeholder="Nhập prompt hiệu chỉnh..."
                          className="flex-1 rounded-lg border border-slate-250 bg-white px-3 py-1.5 text-xs focus:outline-none dark:border-slate-850 dark:bg-slate-900 dark:text-white"
                        />
                        <Button type="submit" disabled={isModifyingQuiz || !quizPrompt.trim()} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs px-3">
                          Gửi AI
                        </Button>
                      </form>
                    </div>

                    <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4 mt-6">
                      <Button
                        disabled={selectedQuizAnswer === null}
                        onClick={() => {
                          if (currentQuizQuestion < quizQuestions.length - 1) {
                            setCurrentQuizQuestion(prev => prev + 1)
                            setSelectedQuizAnswer(null)
                          } else {
                            setShowQuizResults(true)
                          }
                        }}
                        className="rounded-xl bg-[#2563eb] text-white font-bold shadow-md shadow-blue-500/10 px-6 py-2.5 text-sm"
                      >
                        {currentQuizQuestion === quizQuestions.length - 1 ? "Finish Quiz" : "Next Question"}
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="py-6 text-center space-y-6 animate-fade-in">
                    <div className="relative mx-auto flex h-24 w-24 items-center justify-center">
                      <div className="absolute h-full w-full rounded-full border-4 border-slate-100 dark:border-slate-800" />
                      <div 
                        className="absolute h-full w-full rounded-full border-4 border-emerald-500 border-t-transparent"
                        style={{ 
                          transform: `rotate(${(quizScore / quizQuestions.length) * 360}deg)`,
                          transition: 'transform 1.5s ease-out'
                        }}
                      />
                      <span className="text-3xl font-black text-slate-800 dark:text-slate-100">{quizScore}/{quizQuestions.length}</span>
                    </div>

                    <div className="space-y-2 max-w-sm mx-auto">
                      <h4 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 leading-tight">
                        {quizScore === quizQuestions.length 
                          ? "Excellent Mastery!" 
                          : quizScore >= (quizQuestions.length / 2) 
                            ? "Great Achievement!" 
                            : "Keep Studying!"}
                      </h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                        {quizScore === quizQuestions.length 
                          ? "Perfect Score! You have successfully mastered the material." 
                          : quizScore >= (quizQuestions.length / 2) 
                            ? "Solid score! Review the explanations to lock down a perfect mark next time." 
                            : "Take another look at the document and re-run this quiz to test your growth!"}
                      </p>
                    </div>

                    <div className="flex items-center justify-center gap-3 border-t border-slate-100 pt-6 mt-8">
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setCurrentQuizQuestion(0)
                          setSelectedQuizAnswer(null)
                          setQuizScore(0)
                          setShowQuizResults(false)
                        }}
                        className="rounded-xl font-bold"
                      >
                        Retake Quiz
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end border-t border-slate-100 pt-4 mt-6">
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
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 bg-white dark:bg-slate-900 flex flex-col justify-between">
                <span className="text-xs text-muted font-bold uppercase tracking-wider">Total Files</span>
                <span className="text-3xl font-black text-foreground mt-2">{documents.length}</span>
                <span className="text-[10px] text-emerald-600 font-bold mt-1 flex items-center gap-0.5">
                  <TrendingUp className="h-3.5 w-3.5" />
                  +100% active study
                </span>
              </div>

              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 bg-white dark:bg-slate-900 flex flex-col justify-between">
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
                {['MATHEMATICS', 'BIOLOGY', 'PHYSICS', 'COMPSCI', 'PHILOSOPHY', 'ECONOMICS', 'NEUROSCIENCE', 'PSYCHOLOGY'].map((subj) => {
                  const count = documents.filter(d => d.subject === subj).length
                  const maxCount = Math.max(...['MATHEMATICS', 'BIOLOGY', 'PHYSICS', 'COMPSCI', 'PHILOSOPHY', 'ECONOMICS', 'NEUROSCIENCE', 'PSYCHOLOGY'].map(s => documents.filter(d => d.subject === s).length))
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

      {/* Practice Quiz Modal */}
      {isQuizModalOpen && (
        <Modal
          isOpen={isQuizModalOpen}
          onClose={() => setIsQuizModalOpen(false)}
          title={selectedDocForQuiz ? t.quiz.modalTitle(selectedDocForQuiz.title) : t.quiz.modalTitleDefault}
          description={t.quiz.modalDescription}
          className="max-w-xl animate-fade-in"
        >
          <div className="space-y-6 py-2">
            {isLoadingQuizForModal ? (
              <div className="py-12 text-center space-y-4">
                <div className="relative mx-auto flex h-12 w-12 items-center justify-center">
                  <div className="absolute h-full w-full rounded-full border-4 border-slate-100 dark:border-slate-800" />
                  <div className="absolute h-full w-full rounded-full border-4 border-[#2563eb] border-t-transparent animate-spin" />
                </div>
                <p className="text-xs text-slate-400">{t.quiz.loading}</p>
              </div>
            ) : quizQuestionsForModal.length === 0 ? (
              <div className="py-12 text-center space-y-4">
                <p className="text-sm text-slate-500">{t.quiz.empty}</p>
                <Button variant="secondary" onClick={() => setIsQuizModalOpen(false)}>{t.quiz.close}</Button>
              </div>
            ) : !showQuizResults ? (
              <>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-400">
                    <span>{t.quiz.questionProgress(currentQuizQuestion + 1, quizQuestionsForModal.length)}</span>
                    <span className="text-[#2563eb]">{t.quiz.percentComplete(Math.round(((currentQuizQuestion) / quizQuestionsForModal.length) * 100))}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-[#2563eb] h-2 rounded-full transition-all duration-300"
                      style={{ width: `${((currentQuizQuestion + 1) / quizQuestionsForModal.length) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-50 dark:bg-slate-800 p-5 border border-slate-200 dark:border-slate-700">
                  <h4 className="text-base font-extrabold text-slate-800 dark:text-slate-100 leading-relaxed">
                    {quizQuestionsForModal[currentQuizQuestion].q}
                  </h4>
                </div>

                <div className="space-y-3">
                  {(() => {
                    const rawOpts = quizQuestionsForModal[currentQuizQuestion].options
                    let opts: string[] = []
                    if (typeof rawOpts === 'string') {
                      try {
                        opts = JSON.parse(rawOpts) as string[]
                      } catch (e) {
                        opts = []
                      }
                    } else if (Array.isArray(rawOpts)) {
                      opts = rawOpts
                    }
                    return opts.map((option, idx) => {
                      const isSelected = selectedQuizAnswer === idx;
                      const isCorrect = quizQuestionsForModal[currentQuizQuestion].answer === idx;
                      const hasAnswered = selectedQuizAnswer !== null;

                      let optionClass = "flex items-center justify-between w-full p-4 rounded-xl border text-left font-semibold text-sm transition-all duration-200 focus:outline-none ";
                      
                      if (!hasAnswered) {
                        optionClass += "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-[#2563eb]/50 hover:bg-[#2563eb]/5 text-slate-700 dark:text-slate-350";
                      } else if (isSelected) {
                        optionClass += isCorrect 
                          ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-350" 
                          : "border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-350";
                      } else if (isCorrect) {
                        optionClass += "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-350";
                      } else {
                        optionClass += "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-650 opacity-60";
                      }

                      return (
                        <button
                          key={idx}
                          disabled={hasAnswered}
                          onClick={() => {
                            setSelectedQuizAnswer(idx)
                            if (idx === quizQuestionsForModal[currentQuizQuestion].answer) {
                              setQuizScore(prev => prev + 1)
                            }
                          }}
                          className={optionClass}
                        >
                          <div className="flex items-center gap-3">
                            <span className={cn(
                              "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold border transition-colors",
                              !hasAnswered && (isSelected ? "bg-[#2563eb] text-white border-[#2563eb]" : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-550"),
                              hasAnswered && isCorrect && "bg-emerald-500 text-white border-emerald-500",
                              hasAnswered && isSelected && !isCorrect && "bg-rose-500 text-white border-rose-500",
                              hasAnswered && !isSelected && !isCorrect && "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-550"
                            )}>
                              {String.fromCharCode(65 + idx)}
                            </span>
                            <span className="leading-snug">{option}</span>
                          </div>
                          
                          {hasAnswered && (
                            <div>
                              {isCorrect && (
                                <svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              )}
                              {isSelected && !isCorrect && (
                                <svg className="h-5 w-5 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                  <line x1="18" y1="6" x2="6" y2="18" />
                                  <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                              )}
                            </div>
                          )}
                        </button>
                      );
                    });
                  })()}
                </div>

                {selectedQuizAnswer !== null && (
                  <div className="rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/40 dark:bg-amber-955/20 p-4.5 text-xs text-amber-900 dark:text-amber-300 leading-relaxed flex gap-3.5 animate-fade-in shadow-xs">
                    <div className="bg-amber-100 dark:bg-amber-900/40 rounded-lg p-2 text-amber-700 dark:text-amber-400 h-fit shrink-0">
                      <svg className="h-4.5 w-4.5 stroke-[2]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
                        <path d="M9 18h6" />
                        <path d="M10 22h4" />
                      </svg>
                    </div>
                    <div className="space-y-1">
                      <p className="font-extrabold">{t.quiz.explanationTitle}</p>
                      <p className="font-medium text-amber-800 dark:text-amber-350">{quizQuestionsForModal[currentQuizQuestion].explain}</p>
                    </div>
                  </div>
                )}

                {/* AI Assistant Edit Panel inside Practice Quiz Modal */}
                <div className="p-4 rounded-xl border border-indigo-150/60 dark:border-indigo-950/60 bg-[#f4f7ff] dark:bg-indigo-955/10 backdrop-blur-md">
                  <div className="flex gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-955/40 flex items-center justify-center shrink-0">
                      <Sparkles className="size-4.5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[12px] font-extrabold text-slate-800 dark:text-slate-200">
                        {t.quiz.aiAssistantTitle}
                      </h4>
                      <p className="text-[10px] font-semibold text-slate-400 mt-0.5">
                        {t.quiz.aiAssistantSubtitle}
                      </p>
                    </div>
                  </div>
                  <form onSubmit={handleModifyQuizForModalWithPrompt} className="flex gap-2 mt-3">
                    <input
                      type="text"
                      value={quizPromptForModal}
                      onChange={(e) => setQuizPromptForModal(e.target.value)}
                      placeholder={t.quiz.promptPlaceholder}
                      className="flex-1 rounded-lg border border-slate-250 bg-white px-3 py-1.5 text-xs focus:outline-none dark:border-slate-850 dark:bg-slate-900 dark:text-white"
                    />
                    <Button type="submit" disabled={isModifyingQuizForModal || !quizPromptForModal.trim()} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs px-3">
                      {isModifyingQuizForModal ? t.quiz.sendingPrompt : t.quiz.sendPrompt}
                    </Button>
                  </form>
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4 mt-6">
                  <Button
                    variant="secondary"
                    onClick={() => setIsQuizModalOpen(false)}
                    className="rounded-xl font-semibold text-sm"
                  >
                    {t.quiz.quit}
                  </Button>
                  <Button
                    disabled={selectedQuizAnswer === null}
                    onClick={() => {
                      if (currentQuizQuestion < quizQuestionsForModal.length - 1) {
                        setCurrentQuizQuestion(prev => prev + 1)
                        setSelectedQuizAnswer(null)
                      } else {
                        setShowQuizResults(true)
                        // Log quiz completed
                        logActivity({
                          eventKey: 'aiQuizGenerated',
                          category: 'ai-audit',
                          status: 'success',
                          eventTextEn: 'AI Practice Quiz completed',
                          eventTextVi: 'Hoàn thành trắc nghiệm AI',
                          detailsTextEn: `Completed custom practice quiz with score ${quizScore + (selectedQuizAnswer === quizQuestionsForModal[currentQuizQuestion].answer ? 1 : 0)}/${quizQuestionsForModal.length}.`,
                          detailsTextVi: `Đã hoàn thành bộ trắc nghiệm thực hành với điểm số ${quizScore + (selectedQuizAnswer === quizQuestionsForModal[currentQuizQuestion].answer ? 1 : 0)}/${quizQuestionsForModal.length}.`
                        })
                      }
                    }}
                    className="rounded-xl bg-[#2563eb] text-white font-bold shadow-md shadow-blue-500/10 px-6 py-2.5 text-sm"
                  >
                    {currentQuizQuestion === quizQuestionsForModal.length - 1 ? t.quiz.finishQuiz : t.quiz.nextQuestion}
                  </Button>
                </div>
              </>
            ) : (
              <div className="py-6 text-center space-y-6 animate-fade-in">
                <div className="relative mx-auto flex h-24 w-24 items-center justify-center">
                  <div className="absolute h-full w-full rounded-full border-4 border-slate-100 dark:border-slate-800" />
                  <div 
                    className="absolute h-full w-full rounded-full border-4 border-emerald-500 border-t-transparent"
                    style={{ 
                      transform: `rotate(${(quizScore / quizQuestionsForModal.length) * 360}deg)`,
                      transition: 'transform 1.5s ease-out'
                    }}
                  />
                  <span className="text-3xl font-black text-slate-800 dark:text-slate-100">{quizScore}/{quizQuestionsForModal.length}</span>
                </div>

                <div className="space-y-2 max-w-sm mx-auto">
                  <h4 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 leading-tight">
                    {quizScore === quizQuestionsForModal.length 
                      ? t.quiz.scoreExcellent 
                      : quizScore >= (quizQuestionsForModal.length / 2)
                        ? t.quiz.scoreGood 
                        : t.quiz.scorePoor}
                  </h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                    {quizScore === quizQuestionsForModal.length 
                      ? t.quiz.descExcellent 
                      : quizScore >= (quizQuestionsForModal.length / 2)
                        ? t.quiz.descGood 
                        : t.quiz.descPoor}
                  </p>
                </div>

                <div className="flex items-center justify-center gap-3 border-t border-slate-100 pt-6 mt-8">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setCurrentQuizQuestion(0)
                      setSelectedQuizAnswer(null)
                      setQuizScore(0)
                      setShowQuizResults(false)
                    }}
                    className="rounded-xl font-bold"
                  >
                    {t.quiz.retake}
                  </Button>
                  <Button
                    onClick={() => setIsQuizModalOpen(false)}
                    className="rounded-xl bg-[#2563eb] text-white font-bold shadow-md shadow-blue-500/10 px-6"
                  >
                    {t.quiz.closePractice}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

    </div>
  )
}
