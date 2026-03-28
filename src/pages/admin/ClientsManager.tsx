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
import { Badge } from '@/components/ui/badge';
import { useClients, useClientMutations } from '@/hooks/useAdminData';
import { Plus, Pencil, Trash2, Loader2, Mail, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { getDateFnsLocale } from '@/lib/i18n-utils';
import type { Client } from '@/types/admin';

const ClientsManager = () => {
  const { i18n, t } = useTranslation();
  const dateLocale = getDateFnsLocale(i18n.resolvedLanguage || i18n.language);
  const { data: clients, isLoading } = useClients();
  const { createClient, updateClient, deleteClient } = useClientMutations();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    company: '',
    address: '',
    city: '',
    postal_code: '',
    country: 'France',
    notes: '',
    tags: '',
  });

  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      company: '',
      address: '',
      city: '',
      postal_code: '',
      country: 'France',
      notes: '',
      tags: '',
    });
    setEditingClient(null);
  };

  const openEditDialog = (client: Client) => {
    setEditingClient(client);
    setFormData({
      first_name: client.first_name,
      last_name: client.last_name,
      email: client.email,
      phone: client.phone || '',
      company: client.company || '',
      address: client.address || '',
      city: client.city || '',
      postal_code: client.postal_code || '',
      country: client.country || 'France',
      notes: client.notes || '',
      tags: client.tags?.join(', ') || '',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone || undefined,
        company: formData.company || undefined,
        address: formData.address || undefined,
        city: formData.city || undefined,
        postal_code: formData.postal_code || undefined,
        country: formData.country || undefined,
        notes: formData.notes || undefined,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(Boolean) : undefined,
      };
      if (editingClient) {
        await updateClient.mutateAsync({ id: editingClient.id, ...data });
        toast.success(t('clients.toast.updated'));
      } else {
        await createClient.mutateAsync(data);
        toast.success(t('clients.toast.created'));
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast.error(t('clients.toast.errorSave'));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('clients.confirmDelete'))) return;
    try {
      await deleteClient.mutateAsync(id);
      toast.success(t('clients.toast.deleted'));
    } catch (error) {
      toast.error(t('clients.toast.errorDelete'));
    }
  };

  const filteredClients = clients?.filter(client => {
    const search = searchTerm.toLowerCase();
    return (
      client.first_name.toLowerCase().includes(search) ||
      client.last_name.toLowerCase().includes(search) ||
      client.email.toLowerCase().includes(search) ||
      client.company?.toLowerCase().includes(search)
    );
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-serif font-bold">{t('clients.title')}</h1>
            <p className="text-muted-foreground mt-1">{t('clients.subtitle')}</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" />{t('clients.new')}</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingClient ? t('clients.editTitle') : t('clients.newTitle')}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">{t('clients.form.firstName')}</Label>
                    <Input id="first_name" value={formData.first_name} onChange={e => setFormData(p => ({ ...p, first_name: e.target.value }))} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">{t('clients.form.lastName')}</Label>
                    <Input id="last_name" value={formData.last_name} onChange={e => setFormData(p => ({ ...p, last_name: e.target.value }))} required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">{t('clients.form.email')}</Label>
                    <Input id="email" type="email" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">{t('clients.form.phone')}</Label>
                    <Input id="phone" value={formData.phone} onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">{t('clients.form.company')}</Label>
                  <Input id="company" value={formData.company} onChange={e => setFormData(p => ({ ...p, company: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">{t('clients.form.address')}</Label>
                  <Input id="address" value={formData.address} onChange={e => setFormData(p => ({ ...p, address: e.target.value }))} />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">{t('clients.form.city')}</Label>
                    <Input id="city" value={formData.city} onChange={e => setFormData(p => ({ ...p, city: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postal_code">{t('clients.form.postalCode')}</Label>
                    <Input id="postal_code" value={formData.postal_code} onChange={e => setFormData(p => ({ ...p, postal_code: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">{t('clients.form.country')}</Label>
                    <Input id="country" value={formData.country} onChange={e => setFormData(p => ({ ...p, country: e.target.value }))} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tags">{t('clients.form.tags')}</Label>
                  <Input id="tags" value={formData.tags} onChange={e => setFormData(p => ({ ...p, tags: e.target.value }))} placeholder={t('clients.form.tagsPlaceholder')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">{t('clients.form.notes')}</Label>
                  <Textarea id="notes" value={formData.notes} onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))} rows={3} />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>{t('common.cancel')}</Button>
                  <Button type="submit" disabled={createClient.isPending || updateClient.isPending}>
                    {(createClient.isPending || updateClient.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {editingClient ? t('common.update') : t('common.create')}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex items-center gap-4">
          <Input 
            placeholder={t('clients.search')} 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          <span className="text-sm text-muted-foreground">{filteredClients?.length || 0} {t('clients.countSuffix')}</span>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('clients.table.client')}</TableHead>
                  <TableHead>{t('clients.table.contact')}</TableHead>
                  <TableHead>{t('clients.table.company')}</TableHead>
                  <TableHead>{t('clients.table.tags')}</TableHead>
                  <TableHead>{t('clients.table.createdAt')}</TableHead>
                  <TableHead className="text-right">{t('clients.table.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></TableCell></TableRow>
                ) : filteredClients?.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">{t('clients.noItems')}</TableCell></TableRow>
                ) : (
                  filteredClients?.map(client => (
                    <TableRow key={client.id}>
                      <TableCell>
                        <div className="font-medium">{client.first_name} {client.last_name}</div>
                        {client.city && <div className="text-xs text-muted-foreground">{client.city}</div>}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <a href={`mailto:${client.email}`} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                            <Mail className="w-3 h-3" />{client.email}
                          </a>
                          {client.phone && (
                            <a href={`tel:${client.phone}`} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                              <Phone className="w-3 h-3" />{client.phone}
                            </a>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{client.company || '-'}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {client.tags?.map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(client.created_at), 'dd/MM/yyyy', { locale: dateLocale })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(client)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(client.id)}>
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

export default ClientsManager;
