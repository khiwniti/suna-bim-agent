'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  Plus,
  ChevronRight,
  Loader2,
  MessageSquare,
  Building2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBIMStore } from '@/stores';
import { useTranslation } from '@/i18n/provider';

interface BCFIssue {
  id: string;
  guid: string;
  title: string;
  description: string | null;
  status: string;
  topicType: string;
  priority: string;
  assignedTo: string | null;
  createdByAgent: string | null;
  index: number | null;
  createdAt: string;
  updatedAt: string;
  linkedElementCount: number;
  commentCount: number;
}

interface IssuesPanelProps {
  projectId?: string;
  className?: string;
}

export function IssuesPanel({ projectId, className }: IssuesPanelProps) {
  const { t } = useTranslation();
  const [issues, setIssues] = useState<BCFIssue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const currentModel = useBIMStore((state) => state.currentModel);
  const effectiveProjectId = projectId || currentModel?.id;

  const fetchIssues = useCallback(async () => {
    if (!effectiveProjectId) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ projectId: effectiveProjectId });
      if (filter !== 'all') {
        params.append('status', filter);
      }

      const response = await fetch(`/api/issues?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch issues');
      }

      setIssues(data.issues || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch issues');
    } finally {
      setLoading(false);
    }
  }, [effectiveProjectId, filter]);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  const updateIssueStatus = async (issueId: string, status: string) => {
    try {
      const response = await fetch(`/api/issues/${issueId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error('Failed to update issue');
      }

      // Refresh issues list
      fetchIssues();
    } catch (err) {
      console.error('Failed to update issue:', err);
    }
  };

  // Empty state
  if (!effectiveProjectId) {
    return (
      <div className={cn('h-full flex items-center justify-center bg-background p-6', className)}>
        <div className="text-center">
          <Building2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-semibold mb-2">{t('issues.noModelLoaded')}</h3>
          <p className="text-sm text-muted-foreground">
            {t('issues.loadModelToView')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('h-full flex flex-col bg-background', className)}>
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">{t('issues.title')}</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t('issues.newIssue')}
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1">
          {['all', 'open', 'in_progress', 'resolved', 'closed'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-full transition-colors',
                filter === status
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-accent/50 text-muted-foreground hover:bg-accent'
              )}
            >
              {status === 'all' ? t('issues.filters.all') :
               status === 'open' ? t('issues.filters.open') :
               status === 'in_progress' ? t('issues.filters.inProgress') :
               status === 'resolved' ? t('issues.filters.resolved') :
               t('issues.filters.closed')}
            </button>
          ))}
        </div>
      </div>

      {/* Issues list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-500" />
            <p className="text-sm text-muted-foreground">{error}</p>
            <button
              onClick={fetchIssues}
              className="mt-2 text-sm text-primary hover:underline"
            >
              {t('common.tryAgain')}
            </button>
          </div>
        ) : issues.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-500/50" />
            <h3 className="font-medium mb-1">{t('issues.noIssuesFound')}</h3>
            <p className="text-sm text-muted-foreground">
              {filter === 'all'
                ? t('issues.createFirstIssue')
                : t('issues.noFilteredIssues', { filter: filter.replace('_', ' ') })
              }
            </p>
          </div>
        ) : (
          <AnimatePresence>
            {issues.map((issue) => (
              <IssueCard
                key={issue.id}
                issue={issue}
                onStatusChange={updateIssueStatus}
              />
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Create issue modal */}
      {showCreateModal && (
        <CreateIssueModal
          projectId={effectiveProjectId}
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            fetchIssues();
          }}
        />
      )}
    </div>
  );
}

interface IssueCardProps {
  issue: BCFIssue;
  onStatusChange: (issueId: string, status: string) => void;
}

function IssueCard({ issue, onStatusChange }: IssueCardProps) {
  const { t } = useTranslation();
  const statusConfig = {
    open: { icon: AlertCircle, color: 'text-yellow-600', bg: 'bg-yellow-100 dark:bg-yellow-950' },
    in_progress: { icon: Clock, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-950' },
    resolved: { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-950' },
    closed: { icon: XCircle, color: 'text-muted-foreground', bg: 'bg-muted' },
  };

  const priorityColors = {
    low: 'bg-muted text-muted-foreground',
    normal: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
    high: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400',
    critical: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
  };

  const config = statusConfig[issue.status as keyof typeof statusConfig] || statusConfig.open;
  const StatusIcon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-card rounded-lg border border-border p-4 hover:shadow-sm transition-shadow"
    >
      <div className="flex items-start gap-3">
        <div className={cn('p-2 rounded-lg', config.bg)}>
          <StatusIcon className={cn('w-4 h-4', config.color)} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-muted-foreground font-mono">
              #{issue.index || '?'}
            </span>
            <span className={cn(
              'px-2 py-0.5 text-xs font-medium rounded',
              priorityColors[issue.priority as keyof typeof priorityColors] || priorityColors.normal
            )}>
              {issue.priority}
            </span>
            <span className="px-2 py-0.5 text-xs font-medium bg-accent rounded">
              {issue.topicType}
            </span>
          </div>

          <h4 className="font-medium truncate">{issue.title}</h4>

          {issue.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
              {issue.description}
            </p>
          )}

          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
            {issue.linkedElementCount > 0 && (
              <span className="flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                {issue.linkedElementCount} {t('issues.meta.elements')}
              </span>
            )}
            {issue.commentCount > 0 && (
              <span className="flex items-center gap-1">
                <MessageSquare className="w-3 h-3" />
                {issue.commentCount} {t('issues.meta.comments')}
              </span>
            )}
            {issue.createdByAgent && (
              <span className="text-primary">
                {t('issues.meta.by')} {issue.createdByAgent}
              </span>
            )}
          </div>
        </div>

        <button className="p-1 hover:bg-accent rounded">
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Quick status actions */}
      {issue.status !== 'closed' && (
        <div className="flex gap-2 mt-3 pt-3 border-t border-border">
          {issue.status === 'open' && (
            <button
              onClick={() => onStatusChange(issue.id, 'in_progress')}
              className="text-xs px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400 rounded hover:bg-blue-200 dark:hover:bg-blue-900"
            >
              {t('issues.actions.startProgress')}
            </button>
          )}
          {issue.status === 'in_progress' && (
            <button
              onClick={() => onStatusChange(issue.id, 'resolved')}
              className="text-xs px-2 py-1 bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400 rounded hover:bg-green-200 dark:hover:bg-green-900"
            >
              {t('issues.actions.markResolved')}
            </button>
          )}
          {(issue.status === 'resolved' || issue.status === 'in_progress') && (
            <button
              onClick={() => onStatusChange(issue.id, 'closed')}
              className="text-xs px-2 py-1 bg-muted text-muted-foreground rounded hover:bg-accent"
            >
              {t('issues.actions.close')}
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}

interface CreateIssueModalProps {
  projectId: string;
  onClose: () => void;
  onCreated: () => void;
}

function CreateIssueModal({ projectId, onClose, onCreated }: CreateIssueModalProps) {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [topicType, setTopicType] = useState('issue');
  const [priority, setPriority] = useState('medium');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setError(t('issues.createModal.titleRequired'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          title: title.trim(),
          description: description.trim(),
          topicType,
          priority,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create issue');
      }

      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create issue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card rounded-xl shadow-xl w-full max-w-md mx-4"
      >
        <div className="p-4 border-b border-border">
          <h3 className="text-lg font-semibold">{t('issues.createModal.title')}</h3>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="p-3 bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 text-sm rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1.5">{t('issues.createModal.titleLabel')}</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('issues.createModal.titlePlaceholder')}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">{t('issues.createModal.descriptionLabel')}</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('issues.createModal.descriptionPlaceholder')}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">{t('issues.createModal.typeLabel')}</label>
              <select
                value={topicType}
                onChange={(e) => setTopicType(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="issue">{t('issues.createModal.types.issue')}</option>
                <option value="clash">{t('issues.createModal.types.clash')}</option>
                <option value="design">{t('issues.createModal.types.design')}</option>
                <option value="compliance">{t('issues.createModal.types.compliance')}</option>
                <option value="rfi">{t('issues.createModal.types.rfi')}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">{t('issues.createModal.priorityLabel')}</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="low">{t('issues.priority.low')}</option>
                <option value="medium">{t('issues.priority.normal')}</option>
                <option value="high">{t('issues.priority.high')}</option>
                <option value="critical">{t('issues.priority.critical')}</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent rounded-lg transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {t('issues.createModal.createButton')}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default IssuesPanel;
