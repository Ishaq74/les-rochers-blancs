import { AdminLayout } from '@/components/admin/AdminLayout';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useComments, useCommentMutations } from '@/hooks/useAdminData';
import { Check, X, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { getDateFnsLocale } from '@/lib/i18n-utils';

const CommentsManager = () => {
  const { i18n, t } = useTranslation();
  const dateLocale = getDateFnsLocale(i18n.resolvedLanguage || i18n.language);
  const { data: comments, isLoading } = useComments();
  const { approveComment, rejectComment, deleteComment } = useCommentMutations();

  const handleApprove = async (id: string) => {
    try {
      await approveComment.mutateAsync(id);
      toast.success(t('comments.toast.approved'));
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const handleReject = async (id: string) => {
    try {
      await rejectComment.mutateAsync(id);
      toast.success(t('comments.toast.rejected'));
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('comments.confirmDelete'))) return;
    try {
      await deleteComment.mutateAsync(id);
      toast.success(t('comments.toast.deleted'));
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const getStatus = (comment: { is_approved: boolean; is_rejected: boolean }) => {
    if (comment.is_approved) return { label: t('comments.status.approved'), variant: 'default' as const };
    if (comment.is_rejected) return { label: t('comments.status.rejected'), variant: 'destructive' as const };
    return { label: t('comments.status.pending'), variant: 'secondary' as const };
  };

  const pendingComments = comments?.filter(c => !c.is_approved && !c.is_rejected) || [];
  const otherComments = comments?.filter(c => c.is_approved || c.is_rejected) || [];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-serif font-bold">{t('comments.title')}</h1>
          <p className="text-muted-foreground mt-1">{t('comments.subtitle')}</p>
        </div>

        {pendingComments.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <Badge variant="secondary">{pendingComments.length}</Badge>
                {t('comments.pendingTitle')}
              </h2>
              <div className="space-y-4">
                {pendingComments.map(comment => (
                  <div key={comment.id} className="p-4 border rounded-lg bg-secondary/30">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium">{comment.author_name}</span>
                          <span className="text-muted-foreground text-sm">{comment.author_email}</span>
                        </div>
                        <p className="text-sm mb-2">{comment.content}</p>
                        <div className="text-xs text-muted-foreground">
                          {t('comments.articlePrefix')}: {comment.post?.translations?.find(tr => tr.locale === 'fr')?.title || comment.post?.slug || 'N/A'} • 
                          {format(new Date(comment.created_at), ' dd MMM yyyy HH:mm', { locale: dateLocale })}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleApprove(comment.id)} className="text-green-600 hover:text-green-700">
                          <Check className="w-4 h-4 mr-1" />{t('comments.approve')}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleReject(comment.id)} className="text-destructive hover:text-destructive">
                          <X className="w-4 h-4 mr-1" />{t('comments.reject')}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('comments.table.author')}</TableHead>
                  <TableHead>{t('comments.table.comment')}</TableHead>
                  <TableHead>{t('comments.table.article')}</TableHead>
                  <TableHead>{t('comments.table.date')}</TableHead>
                  <TableHead>{t('comments.table.status')}</TableHead>
                  <TableHead className="text-right">{t('comments.table.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></TableCell></TableRow>
                ) : otherComments.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">{t('comments.noItems')}</TableCell></TableRow>
                ) : (
                  otherComments.map(comment => {
                    const status = getStatus(comment);
                    return (
                      <TableRow key={comment.id}>
                        <TableCell>
                          <div className="font-medium">{comment.author_name}</div>
                          <div className="text-xs text-muted-foreground">{comment.author_email}</div>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{comment.content}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {comment.post?.translations?.find(tr => tr.locale === 'fr')?.title || comment.post?.slug || 'N/A'}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {format(new Date(comment.created_at), 'dd/MM/yyyy', { locale: dateLocale })}
                        </TableCell>
                        <TableCell>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {!comment.is_approved && (
                            <Button variant="ghost" size="icon" onClick={() => handleApprove(comment.id)}>
                              <Check className="w-4 h-4 text-green-600" />
                            </Button>
                          )}
                          {!comment.is_rejected && (
                            <Button variant="ghost" size="icon" onClick={() => handleReject(comment.id)}>
                              <X className="w-4 h-4 text-orange-600" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(comment.id)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default CommentsManager;
