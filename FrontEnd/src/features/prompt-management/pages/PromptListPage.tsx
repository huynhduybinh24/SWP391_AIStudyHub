import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Plus,
  Search,
  Filter,
  FileText,
  Clock,
  ChevronRight,
  Sparkles,
  Layers,
  Activity,
  History,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import { usePrompts, useTogglePromptStatus } from '../hooks/usePrompts'
import { PromptActiveBadge } from '../components/PromptStatusBadge'
import type { PromptCategory } from '../types/prompt'
import { useToast } from '@/components/ui/Toast'

export function PromptListPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const { data: prompts = [], isLoading, isError, error, refetch } = usePrompts()
  const toggleStatusMutation = useTogglePromptStatus()

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')
  const [selectedActive, setSelectedActive] = useState<string>('ALL')
  const [selectedPublished, setSelectedPublished] = useState<string>('ALL')

  const filteredPrompts = useMemo(() => {
    return prompts.filter((p) => {
      // Search
      const matchesSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()))

      // Category
      const matchesCategory = selectedCategory === 'ALL' || p.category === selectedCategory

      // Active
      const matchesActive =
        selectedActive === 'ALL' ||
        (selectedActive === 'ACTIVE' && p.active) ||
        (selectedActive === 'INACTIVE' && !p.active)

      // Published
      const matchesPublished =
        selectedPublished === 'ALL' ||
        (selectedPublished === 'PUBLISHED' && !!p.currentPublishedVersion) ||
        (selectedPublished === 'NO_PUBLISHED' && !p.currentPublishedVersion)

      return matchesSearch && matchesCategory && matchesActive && matchesPublished
    })
  }, [prompts, searchTerm, selectedCategory, selectedActive, selectedPublished])

  const handleToggleActive = async (promptId: number, currentActive: boolean) => {
    try {
      await toggleStatusMutation.mutateAsync(promptId)
      toast.success(`Prompt status changed to ${!currentActive ? 'ACTIVE' : 'INACTIVE'}`)
    } catch (err: any) {
      toast.error(err.message || 'Failed to toggle status')
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Banner & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl border border-blue-500/20">
              <Sparkles className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              AI Prompt Management
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 pl-11">
            Manage, version, review, and monitor system AI prompt templates for LumiEdu.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/dashboard/admin/ai-execution-logs"
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 transition-colors shadow-xs"
          >
            <Activity className="w-4 h-4 text-emerald-500" />
            <span>AI Execution Logs</span>
          </Link>
          <Link
            to="/dashboard/admin/prompts/new"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Prompt</span>
          </Link>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search code or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-slate-200"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium dark:text-slate-200"
          >
            <option value="ALL">All Categories</option>
            <option value="GENERATION">GENERATION</option>
            <option value="ASSESSMENT">ASSESSMENT</option>
            <option value="CONVERSATION">CONVERSATION</option>
            <option value="MODERATION">MODERATION</option>
            <option value="SYSTEM">SYSTEM</option>
          </select>

          {/* Active Filter */}
          <select
            value={selectedActive}
            onChange={(e) => setSelectedActive(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium dark:text-slate-200"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
          </select>

          {/* Published Filter */}
          <select
            value={selectedPublished}
            onChange={(e) => setSelectedPublished(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium dark:text-slate-200"
          >
            <option value="ALL">All Deployment Status</option>
            <option value="PUBLISHED">Has Published Version</option>
            <option value="NO_PUBLISHED">No Published Version</option>
          </select>
        </div>
      </div>

      {/* Main Content Table */}
      {isLoading ? (
        <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-3">
          <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Loading system prompts...</p>
        </div>
      ) : isError ? (
        <div className="bg-rose-50 dark:bg-rose-950/40 p-6 rounded-2xl border border-rose-200 dark:border-rose-800 text-center space-y-3 text-rose-700 dark:text-rose-300">
          <p className="text-sm font-semibold">Failed to load prompts</p>
          <p className="text-xs">{(error as Error)?.message}</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-1.5 bg-rose-600 text-white text-xs font-semibold rounded-lg shadow-xs"
          >
            Retry
          </button>
        </div>
      ) : filteredPrompts.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-3">
          <Layers className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No Prompts Found</p>
          <p className="text-xs text-slate-400">Try adjusting your filters or search term.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <th className="py-3.5 px-4">Prompt Name / Code</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Active</th>
                  <th className="py-3.5 px-4">Published Version</th>
                  <th className="py-3.5 px-4">Updated By / At</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredPrompts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-4 space-y-1">
                      <Link
                        to={`/dashboard/admin/prompts/${p.id}`}
                        className="font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 text-sm flex items-center gap-1.5"
                      >
                        <span>{p.name}</span>
                        <ChevronRight className="w-3.5 h-3.5 opacity-40" />
                      </Link>
                      <div className="font-mono text-xs text-blue-600 dark:text-blue-400 font-semibold bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-md inline-block">
                        {p.code}
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <span className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {p.category}
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      <PromptActiveBadge active={p.active} />
                    </td>

                    <td className="py-4 px-4">
                      {p.currentPublishedVersion ? (
                        <span className="inline-flex items-center gap-1 font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {p.currentPublishedVersion}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-md border border-amber-200 dark:border-amber-800 font-medium">
                          <XCircle className="w-3.5 h-3.5" />
                          NO PUBLISHED
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-4 space-y-0.5 text-slate-500">
                      <div className="font-medium text-slate-700 dark:text-slate-300">
                        {p.updatedByName || p.createdByName || 'SYSTEM'}
                      </div>
                      <div className="flex items-center gap-1 text-[11px]">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>
                          {p.updatedAt
                            ? new Date(p.updatedAt).toLocaleString()
                            : p.createdAt
                            ? new Date(p.createdAt).toLocaleString()
                            : '-'}
                        </span>
                      </div>
                    </td>

                    <td className="py-4 px-4 text-right space-x-2">
                      <Link
                        to={`/dashboard/admin/prompts/${p.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>View</span>
                      </Link>

                      <Link
                        to={`/dashboard/admin/prompts/${p.id}/versions/new`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>New Version</span>
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleToggleActive(p.id, p.active)}
                        disabled={toggleStatusMutation.isPending}
                        className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                          p.active
                            ? 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800'
                            : 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
                        }`}
                      >
                        {p.active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
