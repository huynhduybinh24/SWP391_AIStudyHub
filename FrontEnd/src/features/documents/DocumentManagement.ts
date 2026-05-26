export type DocumentSubject =
  | 'MATHEMATICS'
  | 'BIOLOGY'
  | 'PHYSICS'
  | 'COMPSCI'
  | 'PHILOSOPHY'
  | 'ECONOMICS'
  | 'GENERAL'
  | 'NEUROSCIENCE'
  | 'PSYCHOLOGY'

export type DocumentType = 'pdf' | 'word' | 'image' | 'text' | 'slides'

export type DocumentStatus = 'ANALYZED' | 'PENDING' | 'SCANNING' | 'QUEUED' | 'ARCHIVED' | 'REJECTED' | 'APPROVED'

export interface DocumentRecord {
  id: string
  title: string
  fileName: string
  uploadedAt: string
  subject: DocumentSubject
  status: DocumentStatus
  type: DocumentType
  sizeKb: number
  tags: string[]
  isShared: boolean
  sharedWith: string[]
  versions: string[]
  approvedBy?: string
  rejectedReason?: string
}

export interface SearchFilters {
  query?: string
  subjects?: DocumentSubject[]
  types?: DocumentType[]
  statuses?: DocumentStatus[]
  tags?: string[]
}

export class DocumentManagement {
  private documents: DocumentRecord[] = []

  constructor(initialDocuments: DocumentRecord[] = []) {
    this.documents = [...initialDocuments]
  }

  addDocument(document: DocumentRecord): DocumentRecord {
    this.documents.push(document)
    return document
  }

  updateDocumentMetadata(id: string, metadata: Partial<Omit<DocumentRecord, 'id' | 'versions' | 'sharedWith'>>): DocumentRecord | undefined {
    const document = this.documents.find((doc) => doc.id === id)
    if (!document) return undefined
    Object.assign(document, metadata)
    return document
  }

  renameDocument(id: string, newTitle: string): DocumentRecord | undefined {
    return this.updateDocumentMetadata(id, { title: newTitle })
  }

  deleteDocument(id: string): boolean {
    const index = this.documents.findIndex((doc) => doc.id === id)
    if (index === -1) return false
    this.documents.splice(index, 1)
    return true
  }

  archiveDocument(id: string): DocumentRecord | undefined {
    return this.updateDocumentMetadata(id, { status: 'ARCHIVED' })
  }

  restoreDocument(id: string): DocumentRecord | undefined {
    const document = this.documents.find((doc) => doc.id === id)
    if (!document || document.status !== 'ARCHIVED') return undefined
    document.status = 'PENDING'
    return document
  }

  searchDocuments(filters: SearchFilters): DocumentRecord[] {
    return this.documents.filter((doc) => {
      const matchesQuery =
        !filters.query ||
        [doc.title, doc.fileName, doc.subject, doc.status]
          .join(' ')
          .toLowerCase()
          .includes(filters.query.toLowerCase())
      const matchesSubjects = !filters.subjects || filters.subjects.includes(doc.subject)
      const matchesTypes = !filters.types || filters.types.includes(doc.type)
      const matchesStatuses = !filters.statuses || filters.statuses.includes(doc.status)
      const matchesTags =
        !filters.tags || filters.tags.every((tag) => doc.tags.includes(tag))
      return matchesQuery && matchesSubjects && matchesTypes && matchesStatuses && matchesTags
    })
  }

  filterDocumentsBySubject(subject: DocumentSubject): DocumentRecord[] {
    return this.documents.filter((doc) => doc.subject === subject)
  }

  filterDocumentsByType(type: DocumentType): DocumentRecord[] {
    return this.documents.filter((doc) => doc.type === type)
  }

  paginateDocuments(page: number, pageSize: number): DocumentRecord[] {
    const start = (page - 1) * pageSize
    return this.documents.slice(start, start + pageSize)
  }

  shareDocument(id: string, userEmail: string): DocumentRecord | undefined {
    const document = this.documents.find((doc) => doc.id === id)
    if (!document) return undefined
    document.isShared = true
    if (!document.sharedWith.includes(userEmail)) {
      document.sharedWith.push(userEmail)
    }
    return document
  }

  revokeShareAccess(id: string, userEmail: string): DocumentRecord | undefined {
    const document = this.documents.find((doc) => doc.id === id)
    if (!document) return undefined
    document.sharedWith = document.sharedWith.filter((email) => email !== userEmail)
    if (document.sharedWith.length === 0) {
      document.isShared = false
    }
    return document
  }

  addTagToDocument(id: string, tag: string): DocumentRecord | undefined {
    const document = this.documents.find((doc) => doc.id === id)
    if (!document) return undefined
    if (!document.tags.includes(tag)) {
      document.tags.push(tag)
    }
    return document
  }

  removeTagFromDocument(id: string, tag: string): DocumentRecord | undefined {
    const document = this.documents.find((doc) => doc.id === id)
    if (!document) return undefined
    document.tags = document.tags.filter((existing) => existing !== tag)
    return document
  }

  createDocumentVersion(id: string, versionLabel: string): DocumentRecord | undefined {
    const document = this.documents.find((doc) => doc.id === id)
    if (!document) return undefined
    document.versions.push(versionLabel)
    return document
  }

  getDocumentVersions(id: string): string[] {
    const document = this.documents.find((doc) => doc.id === id)
    return document?.versions ?? []
  }

  exportDocumentSummary(id: string): string | undefined {
    const document = this.documents.find((doc) => doc.id === id)
    if (!document) return undefined
    return `Summary for ${document.title || document.fileName}: subject=${document.subject}, type=${document.type}, status=${document.status}, tags=${document.tags.join(", ")}`
  }

  validateDocumentFormat(id: string): boolean {
    const document = this.documents.find((doc) => doc.id === id)
    if (!document) return false
    return ['pdf', 'word', 'text', 'slides', 'image'].includes(document.type)
  }

  approveDocument(id: string, approverEmail: string): DocumentRecord | undefined {
    return this.updateDocumentMetadata(id, {
      status: 'APPROVED',
      approvedBy: approverEmail,
      rejectedReason: undefined
    })
  }

  rejectDocument(id: string, reason: string): DocumentRecord | undefined {
    return this.updateDocumentMetadata(id, {
      status: 'REJECTED',
      rejectedReason: reason
    })
  }

  getDocumentDetails(id: string): DocumentRecord | undefined {
    return this.documents.find((doc) => doc.id === id)
  }

  getAllDocuments(): DocumentRecord[] {
    return [...this.documents]
  }

  generateTestDocument(subject: DocumentSubject, type: DocumentType): DocumentRecord {
    const id = `test-${subject.toLowerCase()}-${type}-${Date.now()}`
    const document: DocumentRecord = {
      id,
      title: `AI StudyHub Test Document - ${subject}`,
      fileName: `ai-studyhub-${subject.toLowerCase()}-${type}.pdf`,
      uploadedAt: 'Uploaded just now',
      subject,
      status: 'PENDING',
      type,
      sizeKb: 512,
      tags: ['ai-studyhub', 'test', subject.toLowerCase()],
      isShared: false,
      sharedWith: [],
      versions: ['v1']
    }
    this.documents.push(document)
    return document
  }
}
