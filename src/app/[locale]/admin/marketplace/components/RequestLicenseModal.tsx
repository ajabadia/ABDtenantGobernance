'use client';

/**
 * @purpose Gestiona un modal para solicitar una licencia con campos de comentarios y maneja el proceso de envío.
 * @purpose_en Renders a modal for requesting a license with input fields for comments and handles the submission process.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Medium
 * @fingerprint exports:1,imports:4,sig:um9z2w
 * @lastUpdated 2026-06-23T20:37:40.933Z
 */

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { createLicenseRequestAction } from '../actions';
import { X, Loader2 } from 'lucide-react';

interface RequestLicenseModalProps {
  appId: string;
  tenantId: string;
  onClose: () => void;
}

export function RequestLicenseModal({ appId, tenantId, onClose }: RequestLicenseModalProps) {
  const t = useTranslations('admin.marketplace');
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comments.trim()) return;

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await createLicenseRequestAction(tenantId, appId, comments);
      onClose();
    } catch (error: Error | unknown) {
      const err = error as Error;
      setErrorMsg(err.message || t('toastError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-card text-card-foreground border border-border shadow-2xl rounded-xl w-full max-w-md overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-bold">{t('requestTitle')}</h2>
          <button onClick={onClose} aria-label={t('cancel')} className="p-1 hover:bg-muted rounded-md transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <p className="text-sm text-muted-foreground mb-2">
            {t('requestDesc')}
          </p>
          
          <div className="flex flex-col gap-2">
            <label htmlFor="comments" className="text-sm font-semibold">
              {t('requestLabel')}
            </label>
            <textarea
              id="comments"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder={t('requestPlaceholder')}
              className="w-full min-h-[120px] p-3 rounded-md border border-input bg-background focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all resize-none text-sm"
              required
            />
          </div>

          {errorMsg && (
            <div className="text-destructive text-sm font-medium bg-destructive/10 p-3 rounded-md">
              {errorMsg}
            </div>
          )}

          <div className="flex justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-md transition-colors"
              aria-label={t('cancel')}
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !comments.trim()}
              className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50"
              aria-label={t('submit')}
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {t('submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
