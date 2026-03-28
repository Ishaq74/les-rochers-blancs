import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useMedia, useMediaMutations } from '@/hooks/useAdminData';
import { Upload, Trash2, Loader2, Image as ImageIcon, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { getDateFnsLocale } from '@/lib/i18n-utils';
import type { Media } from '@/types/admin';

const MediaManager = () => {
  const { i18n, t } = useTranslation();
  const dateLocale = getDateFnsLocale(i18n.resolvedLanguage || i18n.language);
  const { data: media, isLoading } = useMedia();
  const { uploadMedia, deleteMedia } = useMediaMutations();
  const [uploading, setUploading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        await uploadMedia.mutateAsync(file);
      }
      toast.success(t('media.toast.uploaded', { count: files.length }));
    } catch (error) {
      toast.error(t('media.toast.errorUpload'));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (mediaItem: Media) => {
    if (!confirm(t('media.confirmDelete'))) return;
    try {
      await deleteMedia.mutateAsync(mediaItem);
      toast.success(t('media.toast.deleted'));
    } catch (error) {
      toast.error(t('media.toast.errorDelete'));
    }
  };

  const copyUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast.success(t('media.toast.copied'));
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isImage = (type: string) => type.startsWith('image/');

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-serif font-bold">{t('media.title')}</h1>
            <p className="text-muted-foreground mt-1">{t('media.subtitle')}</p>
          </div>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,application/pdf"
              onChange={handleUpload}
              className="hidden"
            />
            <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
              {t('media.upload')}
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : media?.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">{t('media.noItems')}</p>
              <Button variant="outline" className="mt-4" onClick={() => fileInputRef.current?.click()}>
                <Upload className="w-4 h-4 mr-2" />{t('media.uploadFirst')}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {media?.map((item) => (
              <Card key={item.id} className="overflow-hidden group">
                <div className="aspect-square relative bg-muted">
                  {isImage(item.file_type) ? (
                    <img 
                      src={item.file_url} 
                      alt={item.alt_text || item.original_filename}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-12 h-12 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button size="icon" variant="secondary" onClick={() => copyUrl(item.file_url, item.id)}>
                      {copiedId === item.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                    <Button size="icon" variant="destructive" onClick={() => handleDelete(item)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <CardContent className="p-3">
                  <p className="text-sm font-medium truncate" title={item.original_filename}>
                    {item.original_filename}
                  </p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                    <span>{formatFileSize(item.file_size)}</span>
                    <span>{format(new Date(item.created_at), 'dd/MM/yy', { locale: dateLocale })}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default MediaManager;
