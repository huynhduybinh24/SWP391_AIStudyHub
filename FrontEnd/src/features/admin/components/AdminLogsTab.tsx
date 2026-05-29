import { useState, useMemo, useEffect } from 'react'
import { ClipboardList, Search, ShieldAlert, CheckCircle, XCircle } from 'lucide-react'
import { useTranslation } from '@/context/LanguageContext'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'
import { getLogs, checkAndPurgeExpiredLogs, SystemLog } from '@/services/activityLogService'

export function AdminLogsTab() {
  const { t, language } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'security' | 'subscription' | 'ai-audit' | 'moderation'>('all');
  const [logs, setLogs] = useState<SystemLog[]>(getLogs());

  useEffect(() => {
    const handleLogsUpdate = () => {
      setLogs(getLogs());
    };
    window.addEventListener('aiStudyHubLogsUpdated', handleLogsUpdate);

    // Initial check for expired logs
    checkAndPurgeExpiredLogs();

    // Check periodically for expired logs
    const interval = setInterval(() => {
      checkAndPurgeExpiredLogs();
    }, 15000);

    return () => {
      window.removeEventListener('aiStudyHubLogsUpdated', handleLogsUpdate);
      clearInterval(interval);
    };
  }, []);

  const getEventName = (log: SystemLog) => {
    if (log.eventKey && t.activityLogs.events[log.eventKey as keyof typeof t.activityLogs.events]) {
      return t.activityLogs.events[log.eventKey as keyof typeof t.activityLogs.events];
    }
    return language === 'vi'
      ? (log.eventTextVi || log.eventTextEn || log.eventKey || '')
      : (log.eventTextEn || log.eventTextVi || log.eventKey || '');
  };

  const getDetailsText = (log: SystemLog) => {
    if (log.detailsKey && t.activityLogs.details[log.detailsKey as keyof typeof t.activityLogs.details]) {
      return t.activityLogs.details[log.detailsKey as keyof typeof t.activityLogs.details];
    }
    return language === 'vi'
      ? (log.detailsTextVi || log.detailsTextEn || log.detailsKey || '')
      : (log.detailsTextEn || log.detailsTextVi || log.detailsKey || '');
  };

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const eventName = getEventName(log);
      const detailsText = getDetailsText(log);
      const matchesSearch =
        eventName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        detailsText.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.performer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.performerEmail.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory = categoryFilter === 'all' || log.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [logs, searchTerm, categoryFilter, language]);


  return (
    <div className="space-y-6 select-none text-left">
      {/* Search and Filters Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-4 rounded-3xl backdrop-blur-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t.activityLogs.searchPlaceholder}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/25 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 font-semibold"
          />
        </div>

        {/* Filters pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {(['all', 'security', 'subscription', 'ai-audit', 'moderation'] as const).map((cat) => {
            const getLabel = () => {
              switch (cat) {
                case 'all': return t.activityLogs.filters.all
                case 'security': return t.activityLogs.filters.security
                case 'subscription': return t.activityLogs.filters.subscription
                case 'ai-audit': return t.activityLogs.filters['ai-audit']
                case 'moderation': return t.activityLogs.filters.moderation
              }
            }
            const isActive = categoryFilter === cat
            return (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-600 text-white dark:bg-blue-600'
                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800 dark:hover:bg-slate-800'
                }`}
              >
                {getLabel()}
              </button>
            )
          })}
        </div>
      </div>

      {/* Logs Table */}
      <Card className="rounded-[28px] overflow-hidden shadow-md">
        <div className="overflow-x-auto overflow-y-auto max-h-[580px] scrollbar-thin relative z-0">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800">
                <th className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900 p-4 pl-6 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider shadow-[inset_0_-1px_0_rgba(0,0,0,0.05)] dark:shadow-[inset_0_-1px_0_rgba(255,255,255,0.05)]">{t.activityLogs.columns.event}</th>
                <th className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900 p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider shadow-[inset_0_-1px_0_rgba(0,0,0,0.05)] dark:shadow-[inset_0_-1px_0_rgba(255,255,255,0.05)]">{t.activityLogs.columns.category}</th>
                <th className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900 p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider shadow-[inset_0_-1px_0_rgba(0,0,0,0.05)] dark:shadow-[inset_0_-1px_0_rgba(255,255,255,0.05)]">{t.activityLogs.columns.performer}</th>
                <th className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900 p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider shadow-[inset_0_-1px_0_rgba(0,0,0,0.05)] dark:shadow-[inset_0_-1px_0_rgba(255,255,255,0.05)]">{t.activityLogs.columns.details}</th>
                <th className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900 p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider shadow-[inset_0_-1px_0_rgba(0,0,0,0.05)] dark:shadow-[inset_0_-1px_0_rgba(255,255,255,0.05)]">{t.activityLogs.columns.timestamp}</th>
                <th className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900 p-4 pr-6 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right shadow-[inset_0_-1px_0_rgba(0,0,0,0.05)] dark:shadow-[inset_0_-1px_0_rgba(255,255,255,0.05)]">{t.activityLogs.columns.status}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => {
                  const getStatusIcon = () => {
                    switch (log.status) {
                      case 'success':
                        return <CheckCircle className="size-4 text-emerald-500" />
                      case 'warning':
                        return <ShieldAlert className="size-4 text-amber-500" />
                      case 'failed':
                        return <XCircle className="size-4 text-rose-500" />
                    }
                  }

                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-slate-100/70 dark:hover:bg-slate-800/40 even:bg-slate-50/40 dark:even:bg-slate-900/20 transition-all duration-200 group"
                    >
                      <td className="p-4 pl-6 font-extrabold text-slate-800 dark:text-slate-200">
                        {getEventName(log)}
                      </td>

                      <td className="p-4">
                        <Badge className={cn(
                          "font-bold text-[10px] uppercase tracking-wider rounded-full px-2.5 py-0.5",
                          log.category === 'security' && "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20",
                          log.category === 'ai-audit' && "bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20",
                          log.category === 'subscription' && "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
                          log.category === 'moderation' && "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                        )}>
                          {t.activityLogs.categories[log.category]}
                        </Badge>
                      </td>

                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="font-extrabold text-slate-700 dark:text-slate-300">{log.performer}</span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{log.performerEmail}</span>
                        </div>
                      </td>

                      <td className="p-4 text-xs text-slate-550 dark:text-slate-400 leading-normal max-w-[280px] truncate" title={getDetailsText(log)}>
                        {getDetailsText(log)}
                      </td>

                      <td className="p-4 text-slate-500 dark:text-slate-400 text-xs font-semibold">
                        {log.timestamp}
                      </td>

                      <td className="p-4 pr-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {getStatusIcon()}
                          <span className={cn(
                            "text-xs font-bold uppercase",
                            log.status === 'success' && "text-emerald-500",
                            log.status === 'warning' && "text-amber-500",
                            log.status === 'failed' && "text-rose-500"
                          )}>
                            {t.activityLogs.status[log.status]}
                          </span>
                        </div>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-700">
                      <ClipboardList className="size-10 stroke-[1.25] mb-2" />
                      <p className="font-extrabold text-sm text-slate-700 dark:text-slate-350">
                        {t.activityLogs.noLogsFound}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
