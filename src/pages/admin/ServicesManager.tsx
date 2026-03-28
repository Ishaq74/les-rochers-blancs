import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useServices, useServiceMutations } from '@/hooks/useAdminData';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { LOCALE_LABELS, SUPPORTED_LOCALES } from '@/lib/i18n-utils';
import type { Service } from '@/types/admin';

const LOCALES = SUPPORTED_LOCALES;

const ServicesManager = () => {
  const { t } = useTranslation();
  const { data: services, isLoading } = useServices();
  const { createService, updateService, deleteService } = useServiceMutations();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState({
    slug: '',
    icon: '',
    image_url: '',
    is_active: true,
    translations: LOCALES.map(locale => ({ locale, name: '', description: '' })),
  });

  const resetForm = () => {
    setFormData({
      slug: '',
      icon: '',
      image_url: '',
      is_active: true,
      translations: LOCALES.map(locale => ({ locale, name: '', description: '' })),
    });
    setEditingService(null);
  };

  const openEditDialog = (service: Service) => {
    setEditingService(service);
    setFormData({
      slug: service.slug,
      icon: service.icon || '',
      image_url: service.image_url || '',
      is_active: service.is_active,
      translations: LOCALES.map(locale => {
        const existing = service.translations?.find(t => t.locale === locale);
        return { locale, name: existing?.name || '', description: existing?.description || '' };
      }),
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingService) {
        await updateService.mutateAsync({
          id: editingService.id,
          slug: formData.slug,
          icon: formData.icon || null,
          image_url: formData.image_url || null,
          is_active: formData.is_active,
          translations: formData.translations.filter(tr => tr.name) as any,
        });
        toast.success(t('services.toast.updated'));
      } else {
        await createService.mutateAsync({
          slug: formData.slug,
          icon: formData.icon || undefined,
          image_url: formData.image_url || undefined,
          is_active: formData.is_active,
          translations: formData.translations.filter(tr => tr.name),
        });
        toast.success(t('services.toast.created'));
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast.error(t('services.toast.errorSave'));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('services.confirmDelete'))) return;
    try {
      await deleteService.mutateAsync(id);
      toast.success(t('services.toast.deleted'));
    } catch (error) {
      toast.error(t('services.toast.errorDelete'));
    }
  };

  const updateTranslation = (locale: string, field: 'name' | 'description', value: string) => {
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
            <h1 className="text-3xl font-serif font-bold">{t('services.title')}</h1>
            <p className="text-muted-foreground mt-1">{t('services.subtitle')}</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" />{t('services.new')}</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingService ? t('services.editTitle') : t('services.newTitle')}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="slug">{t('services.form.slug')}</Label>
                    <Input id="slug" value={formData.slug} onChange={e => setFormData(p => ({ ...p, slug: e.target.value }))} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="icon">{t('services.form.icon')}</Label>
                    <Input id="icon" value={formData.icon} onChange={e => setFormData(p => ({ ...p, icon: e.target.value }))} placeholder="hotel" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="image_url">{t('services.form.imageUrl')}</Label>
                  <Input id="image_url" value={formData.image_url} onChange={e => setFormData(p => ({ ...p, image_url: e.target.value }))} />
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
                        <Label>{t('services.form.name')} ({locale.toUpperCase()})</Label>
                        <Input 
                          value={formData.translations.find(tr => tr.locale === locale)?.name || ''} 
                          onChange={e => updateTranslation(locale, 'name', e.target.value)}
                          required={locale === 'fr'}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t('services.form.description')} ({locale.toUpperCase()})</Label>
                        <Textarea 
                          value={formData.translations.find(tr => tr.locale === locale)?.description || ''} 
                          onChange={e => updateTranslation(locale, 'description', e.target.value)}
                          rows={3}
                        />
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>{t('common.cancel')}</Button>
                  <Button type="submit" disabled={createService.isPending || updateService.isPending}>
                    {(createService.isPending || updateService.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {editingService ? t('common.update') : t('common.create')}
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
                  <TableHead>{t('services.table.name')}</TableHead>
                  <TableHead>{t('common.slug')}</TableHead>
                  <TableHead>{t('common.status')}</TableHead>
                  <TableHead className="text-right">{t('common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></TableCell></TableRow>
                ) : services?.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">{t('services.noItems')}</TableCell></TableRow>
                ) : (
                  services?.map(service => (
                    <TableRow key={service.id}>
                      <TableCell className="font-medium">
                        {service.translations?.find(tr => tr.locale === 'fr')?.name || service.slug}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{service.slug}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${service.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {service.is_active ? t('common.active') : t('common.inactive')}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(service)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(service.id)}>
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

export default ServicesManager;
