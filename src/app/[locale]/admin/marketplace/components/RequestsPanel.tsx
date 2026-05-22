'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { resolveLicenseRequestAction } from '../actions';
import { Check, X, Loader2, ShieldAlert } from 'lucide-react';

interface RequestsPanelProps {
  requests: { _id: string; tenantId: string; appId: string; requestedBy: string; comments: string; createdAt: Date }[];
  locale: string;
}

export function RequestsPanel({ requests, locale }: RequestsPanelProps) {
  const t = useTranslations('admin.marketplace');
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [commentsMap, setCommentsMap] = useState<Record<string, string>>({});
  const [errorMsg, setErrorMsg] = useState('');

  const handleResolve = async (requestId: string, action: 'APPROVE' | 'DENY') => {
    setResolvingId(requestId);
    setErrorMsg('');
    try {
      const comment = commentsMap[requestId] || '';
      await resolveLicenseRequestAction(requestId, action, comment);
    } catch (error: Error | unknown) {
      const err = error as Error;
      setErrorMsg(err.message || t('toastError'));
    } finally {
      setResolvingId(null);
    }
  };

  const handleCommentChange = (id: string, val: string) => {
    setCommentsMap(prev => ({ ...prev, [id]: val }));
  };

  if (!requests || requests.length === 0) return null;

  return (
    <div className="bg-card text-card-foreground p-6 rounded-xl border border-border shadow-md mb-2">
      <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
        <span className="bg-primary/20 text-primary p-2 rounded-lg">
          <ShieldAlert className="w-5 h-5" />
        </span>
        {t('requestsPanelTitle')}
      </h2>
      
      {errorMsg && (
        <div className="text-destructive text-sm font-medium bg-destructive/10 p-3 rounded-md mb-4">
          {errorMsg}
        </div>
      )}

      <div className="flex flex-col gap-4">
        {requests.map((req) => (
          <div key={req._id} className="border border-border rounded-lg p-5 bg-muted/20 flex flex-col lg:flex-row lg:items-start justify-between gap-6 transition-all hover:border-primary/30">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <span className="font-bold text-lg">{req.tenantId}</span>
                <span className="text-muted-foreground text-sm">&rarr;</span>
                <span className="font-semibold bg-primary/10 text-primary px-3 py-1 rounded-full text-xs uppercase tracking-wider">{req.appId}</span>
              </div>
              <div className="text-sm text-muted-foreground mb-3 flex items-center gap-2">
                <span className="font-medium text-foreground">@</span> {req.requestedBy}
              </div>
              <div className="bg-background border border-border p-4 rounded-md text-sm italic relative">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/50 rounded-l-md"></div>
                &quot;{req.comments}&quot;
              </div>
            </div>
            
            <div className="flex flex-col gap-3 min-w-[300px]">
              <input 
                type="text" 
                placeholder={t('resolutionComment')} 
                value={commentsMap[req._id] || ''}
                onChange={(e) => handleCommentChange(req._id, e.target.value)}
                className="w-full text-sm p-3 rounded-md border border-input bg-background focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => handleResolve(req._id, 'APPROVE')}
                  disabled={resolvingId === req._id}
                  className="flex-1 flex items-center justify-center gap-2 bg-green-500/10 text-green-600 hover:bg-green-500/20 border border-green-500/20 py-2.5 rounded-md font-medium text-sm transition-colors disabled:opacity-50"
                  aria-label={t('approve')}
                >
                  {resolvingId === req._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {t('approve')}
                </button>
                <button
                  onClick={() => handleResolve(req._id, 'DENY')}
                  disabled={resolvingId === req._id}
                  className="flex-1 flex items-center justify-center gap-2 bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20 py-2.5 rounded-md font-medium text-sm transition-colors disabled:opacity-50"
                  aria-label={t('deny')}
                >
                  {resolvingId === req._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                  {t('deny')}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
