import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFormations, useFormationMutations } from '@/hooks/useAdminData';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { LOCALE_LABELS, SUPPORTED_LOCALES } from '@/lib/i18n-utils';
import type { Formation } from '@/types/admin';

const LOCALES = SUPPORTED_LOCALES;

const FormationsManager = () => {
  const { t } = useTranslation();
  const { data: formations, isLoading } = useFormations();
  const { createFormation, updateFormation, deleteFormation } = useFormationMutations();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFormation, setEditingFormation] = useState<Formation | null>(null);
  const [formData, setFormData] = useState({
    slug: '',
    image_url: '',
    duration: '',
    price: '',
    is_active: true,
    translations: LOCALES.map(locale => ({ locale, name: '', description: '', objectives: '' })),
  });

  const resetForm = () => {
    setFormData({
      slug: '',
      image_url: '',
      duration: '',
      price: '',
      is_active: true,
      translations: LOCALES.map(locale => ({ locale, name: '', description: '', objectives: '' })),
    });
    setEditingFormation(null);
  };

  const openEditDialog = (formation: Formation) => {
    setEditingFormation(formation);
    setFormData({
      slug: formation.slug,
      image_url: formation.image_url || '',
      duration: formation.duration || '',
      price: formation.price?.toString() || '',
      is_active: formation.is_active,
      translations: LOCALES.map(locale => {
        const existing = formation.translations?.find(t => t.locale === locale);
        return { locale, name: existing?.name || '', description: existing?.description || '', objectives: existing?.objectives || '' };
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
        duration: formData.duration || undefined,
        price: formData.price ? parseFloat(formData.price) : undefined,
        is_active: formData.is_active,
        translations: formData.translations.filter(tr => tr.name),
      };
      if (editingFormation) {
        await updateFormation.mutateAsync({ id: editingFormation.id, ...data, translations: data.translations as any });
        toast.success(t('formations.toast.updated'));
      } else {
        await createFormation.mutateAsync(data);
        toast.success(t('formations.toast.created'));
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast.error(t('formations.toast.errorSave'));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('formations.confirmDelete'))) return;
    try {
      await deleteFormation.mutateAsync(id);
      toast.success(t('formations.toast.deleted'));
    } catch (error) {
      toast.error(t('formations.toast.errorDelete'));
    }
  };

  const updateTranslation = (locale: string, field: 'name' | 'description' | 'objectives', value: string) => {
    setFormData(prev => ({
      ...prev,
      translations: prev.translations.map(tr => 
        tr.locale === locale ? { ...tr, [field]: value } : tr
      ),
    }));
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-serif font-bold">{t('formations.title')}</h1>
            <p className="text-muted-foreground mt-1">{t('formations.subtitle')}</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" />{t('formations.new')}</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingFormation ? t('formations.editTitle') : t('formations.newTitle')}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="slug">Slug</Label>
                    <Input id="slug" value={formData.slug} onChange={e => setFormData(p => ({ ...p, slug: e.target.value }))} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="duration">{t('formations.form.duration')}</Label>
                    <Input id="duration" value={formData.duration} onChange={e => setFormData(p => ({ ...p, duration: e.target.value }))} placeholder={t('formations.form.durationPlaceholder')} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">{t('formations.form.price')}</Label>
                    <Input id="price" type="number" step="0.01" value={formData.price} onChange={e => setFormData(p => ({ ...p, price: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="image_url">{t('formations.form.imageUrl')}</Label>
                    <Input id="image_url" value={formData.image_url} onChange={e => setFormData(p => ({ ...p, image_url: e.target.value }))} />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={formData.is_active} onCheckedChange={v => setFormData(p => ({ ...p, is_active: v }))} />
                  <Label>{t('common.active')}</Label>
                </div>
                <Tabs defaultValue="fr">
                  <TabsList className="grid grid-cols-4">
                    {LOCALES.map(l => <TabsTrigger key={l} value={l}>{LOCALE_LABELS[l]}</TabsTrigger>)}
                  </TabsList>
                  {LOCALES.map(locale => (
                    <TabsContent key={locale} value={locale} className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label>{t('formations.form.name')} ({locale.toUpperCase()})</Label>
                        <Input 
                          value={formData.translations.find(tr => tr.locale === locale)?.name || ''} 
                          onChange={e => updateTranslation(locale, 'name', e.target.value)}
                          required={locale === 'fr'}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t('formations.form.description')} ({locale.toUpperCase()})</Label>
                        <Textarea 
                          value={formData.translations.find(tr => tr.locale === locale)?.description || ''} 
                          onChange={e => updateTranslation(locale, 'description', e.target.value)}
                          rows={3}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t('formations.form.objectives')} ({locale.toUpperCase()})</Label>
                        <Textarea 
                          value={formData.translations.find(tr => tr.locale === locale)?.objectives || ''} 
                          onChange={e => updateTranslation(locale, 'objectives', e.target.value)}
                          rows={2}
                        />
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>{t('common.cancel')}</Button>
                  <Button type="submit" disabled={createFormation.isPending || updateFormation.isPending}>
                    {(createFormation.isPending || updateFormation.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {editingFormation ? t('common.update') : t('common.create')}
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
                  <TableHead>{t('formations.table.name')}</TableHead>
                  <TableHead>{t('formations.table.duration')}</TableHead>
                  <TableHead>{t('formations.table.price')}</TableHead>
                  <TableHead>{t('common.status')}</TableHead>
                  <TableHead className="text-right">{t('common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></TableCell></TableRow>
                ) : formations?.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">{t('formations.noItems')}</TableCell></TableRow>
                ) : (
                  formations?.map(formation => (
                    <TableRow key={formation.id}>
                      <TableCell className="font-medium">
                        {formation.translations?.find(tr => tr.locale === 'fr')?.name || formation.slug}
                      </TableCell>
                      <TableCell>{formation.duration || '-'}</TableCell>
                      <TableCell>{formation.price ? `${formation.price} €` : '-'}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${formation.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {formation.is_active ? t('common.active') : t('common.inactive')}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(formation)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(formation.id)}>
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

export default FormationsManager;
