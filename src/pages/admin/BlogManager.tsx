import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useBlogPosts, useBlogPostMutations } from '@/hooks/useAdminData';
import { Plus, Pencil, Trash2, Loader2, Eye, EyeOff, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { getDateFnsLocale, LOCALE_LABELS, SUPPORTED_LOCALES } from '@/lib/i18n-utils';
import type { BlogPost } from '@/types/admin';

const LOCALES = SUPPORTED_LOCALES;

const BlogManager = () => {
  const { i18n, t } = useTranslation();
  const dateLocale = getDateFnsLocale(i18n.resolvedLanguage || i18n.language);
  const { data: posts, isLoading } = useBlogPosts();
  const { createBlogPost, updateBlogPost, deleteBlogPost, publishBlogPost, unpublishBlogPost } = useBlogPostMutations();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [formData, setFormData] = useState({
    slug: '',
    image_url: '',
    translations: LOCALES.map(locale => ({ locale, title: '', excerpt: '', content: '', meta_title: '', meta_description: '' })),
  });

  const resetForm = () => {
    setFormData({
      slug: '',
      image_url: '',
      translations: LOCALES.map(locale => ({ locale, title: '', excerpt: '', content: '', meta_title: '', meta_description: '' })),
    });
    setEditingPost(null);
  };

  const openEditDialog = (post: BlogPost) => {
    setEditingPost(post);
    setFormData({
      slug: post.slug,
      image_url: post.image_url || '',
      translations: LOCALES.map(locale => {
        const existing = post.translations?.find(t => t.locale === locale);
        return { 
          locale, 
          title: existing?.title || '', 
          excerpt: existing?.excerpt || '', 
          content: existing?.content || '',
          meta_title: existing?.meta_title || '',
          meta_description: existing?.meta_description || '',
        };
      }),
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        slug: formData.slug,
        image_url: formData.image_url || undefined,
        translations: formData.translations.filter(t => t.title),
      };
      if (editingPost) {
        await updateBlogPost.mutateAsync({ id: editingPost.id, ...data, translations: data.translations as any });
        toast.success(t('blog.toast.updated'));
      } else {
        await createBlogPost.mutateAsync(data);
        toast.success(t('blog.toast.created'));
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast.error(t('blog.toast.errorSave'));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('blog.confirmDelete'))) return;
    try {
      await deleteBlogPost.mutateAsync(id);
      toast.success(t('blog.toast.deleted'));
    } catch (error) {
      toast.error(t('blog.toast.errorDelete'));
    }
  };

  const handleTogglePublish = async (post: BlogPost) => {
    try {
      if (post.is_published) {
        await unpublishBlogPost.mutateAsync(post.id);
        toast.success(t('blog.unpublished'));
      } else {
        await publishBlogPost.mutateAsync(post.id);
        toast.success(t('blog.published'));
      }
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const updateTranslation = (locale: string, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      translations: prev.translations.map(t => 
        t.locale === locale ? { ...t, [field]: value } : t
      ),
    }));
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-serif font-bold">{t('blog.title')}</h1>
            <p className="text-muted-foreground mt-1">{t('blog.subtitle')}</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" />{t('blog.new')}</Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingPost ? t('blog.editTitle') : t('blog.newTitle')}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="slug">{t('blog.form.slug')}</Label>
                    <Input id="slug" value={formData.slug} onChange={e => setFormData(p => ({ ...p, slug: e.target.value }))} required placeholder="mon-article" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="image_url">{t('blog.form.imageUrl')}</Label>
                    <Input id="image_url" value={formData.image_url} onChange={e => setFormData(p => ({ ...p, image_url: e.target.value }))} />
                  </div>
                </div>
                <Tabs defaultValue="fr">
                  <TabsList className="grid grid-cols-4">
                    {LOCALES.map(l => <TabsTrigger key={l} value={l}>{LOCALE_LABELS[l]}</TabsTrigger>)}
                  </TabsList>
                  {LOCALES.map(locale => (
                    <TabsContent key={locale} value={locale} className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label>{t('blog.form.title')} ({locale.toUpperCase()})</Label>
                        <Input 
                          value={formData.translations.find(t => t.locale === locale)?.title || ''} 
                          onChange={e => updateTranslation(locale, 'title', e.target.value)}
                          required={locale === 'fr'}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t('blog.form.excerpt')} ({locale.toUpperCase()})</Label>
                        <Textarea 
                          value={formData.translations.find(t => t.locale === locale)?.excerpt || ''} 
                          onChange={e => updateTranslation(locale, 'excerpt', e.target.value)}
                          rows={2}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t('blog.form.content')} ({locale.toUpperCase()})</Label>
                        <Textarea 
                          value={formData.translations.find(t => t.locale === locale)?.content || ''} 
                          onChange={e => updateTranslation(locale, 'content', e.target.value)}
                          rows={10}
                          className="font-mono text-sm"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>{t('blog.form.metaTitle')}</Label>
                          <Input 
                            value={formData.translations.find(t => t.locale === locale)?.meta_title || ''} 
                            onChange={e => updateTranslation(locale, 'meta_title', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>{t('blog.form.metaDescription')}</Label>
                          <Input 
                            value={formData.translations.find(t => t.locale === locale)?.meta_description || ''} 
                            onChange={e => updateTranslation(locale, 'meta_description', e.target.value)}
                          />
                        </div>
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>{t('common.cancel')}</Button>
                  <Button type="submit" disabled={createBlogPost.isPending || updateBlogPost.isPending}>
                    {(createBlogPost.isPending || updateBlogPost.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {editingPost ? t('common.update') : t('common.create')}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('blog.table.title')}</TableHead>
                  <TableHead>{t('blog.table.date')}</TableHead>
                  <TableHead>{t('blog.table.views')}</TableHead>
                  <TableHead>{t('blog.table.status')}</TableHead>
                  <TableHead className="text-right">{t('blog.table.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></TableCell></TableRow>
                ) : posts?.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">{t('blog.noItems')}</TableCell></TableRow>
                ) : (
                  posts?.map(post => (
                    <TableRow key={post.id}>
                      <TableCell className="font-medium">
                        <div>
                          {post.translations?.find(t => t.locale === 'fr')?.title || post.slug}
                        </div>
                        <div className="text-xs text-muted-foreground">/blog/{post.slug}</div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {post.published_at 
                          ? format(new Date(post.published_at), 'dd MMM yyyy', { locale: dateLocale })
                          : format(new Date(post.created_at), 'dd MMM yyyy', { locale: dateLocale })
                        }
                      </TableCell>
                      <TableCell>{post.views_count}</TableCell>
                      <TableCell>
                        <Badge variant={post.is_published ? 'default' : 'secondary'}>
                          {post.is_published ? t('blog.publishedBadge') : t('blog.draftBadge')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button variant="ghost" size="icon" onClick={() => handleTogglePublish(post)} title={post.is_published ? 'Dépublier' : 'Publier'}>
                          {post.is_published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                        {post.is_published && (
                          <Button variant="ghost" size="icon" asChild>
                            <a href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(post)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(post.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default BlogManager;
