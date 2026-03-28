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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useReservations, useReservationMutations, useClients } from '@/hooks/useAdminData';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { getDateFnsLocale } from '@/lib/i18n-utils';
import type { Reservation, ReservationStatus, ReservationType } from '@/types/admin';

const STATUS_LABELS_CLASSES: Record<ReservationStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  confirmed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
};

const ReservationsManager = () => {
  const { i18n, t } = useTranslation();
  const dateLocale = getDateFnsLocale(i18n.resolvedLanguage || i18n.language);

  const STATUS_LABELS: Record<ReservationStatus, { label: string; className: string }> = {
    pending: { label: t('reservations.status.pending'), className: STATUS_LABELS_CLASSES.pending },
    confirmed: { label: t('reservations.status.confirmed'), className: STATUS_LABELS_CLASSES.confirmed },
    cancelled: { label: t('reservations.status.cancelled'), className: STATUS_LABELS_CLASSES.cancelled },
    completed: { label: t('reservations.status.completed'), className: STATUS_LABELS_CLASSES.completed },
  };

  const TYPE_LABELS: Record<ReservationType, string> = {
    room: t('reservations.type.room'),
    restaurant: t('reservations.type.restaurant'),
    service: t('reservations.type.service'),
    formation: t('reservations.type.formation'),
  };
  const { data: reservations, isLoading } = useReservations();
  const { data: clients } = useClients();
  const { createReservation, updateReservation, deleteReservation } = useReservationMutations();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);
  const [formData, setFormData] = useState({
    client_id: '',
    type: 'room' as ReservationType,
    status: 'pending' as ReservationStatus,
    start_date: '',
    end_date: '',
    guests_count: '1',
    special_requests: '',
    total_amount: '',
    notes: '',
  });

  const resetForm = () => {
    setFormData({
      client_id: '',
      type: 'room',
      status: 'pending',
      start_date: '',
      end_date: '',
      guests_count: '1',
      special_requests: '',
      total_amount: '',
      notes: '',
    });
    setEditingReservation(null);
  };

  const openEditDialog = (reservation: Reservation) => {
    setEditingReservation(reservation);
    setFormData({
      client_id: reservation.client_id || '',
      type: reservation.type,
      status: reservation.status,
      start_date: reservation.start_date.split('T')[0],
      end_date: reservation.end_date?.split('T')[0] || '',
      guests_count: reservation.guests_count?.toString() || '1',
      special_requests: reservation.special_requests || '',
      total_amount: reservation.total_amount?.toString() || '',
      notes: reservation.notes || '',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        client_id: formData.client_id || undefined,
        type: formData.type,
        status: formData.status,
        start_date: new Date(formData.start_date).toISOString(),
        end_date: formData.end_date ? new Date(formData.end_date).toISOString() : undefined,
        guests_count: parseInt(formData.guests_count) || undefined,
        special_requests: formData.special_requests || undefined,
        total_amount: formData.total_amount ? parseFloat(formData.total_amount) : undefined,
        notes: formData.notes || undefined,
      };
      if (editingReservation) {
        await updateReservation.mutateAsync({ id: editingReservation.id, ...data });
        toast.success(t('reservations.toast.updated'));
      } else {
        await createReservation.mutateAsync(data);
        toast.success(t('reservations.toast.created'));
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast.error(t('reservations.toast.errorSave'));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('reservations.confirmDelete'))) return;
    try {
      await deleteReservation.mutateAsync(id);
      toast.success(t('reservations.toast.deleted'));
    } catch (error) {
      toast.error(t('reservations.toast.errorDelete'));
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-serif font-bold">{t('reservations.title')}</h1>
            <p className="text-muted-foreground mt-1">{t('reservations.subtitle')}</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" />{t('reservations.new')}</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingReservation ? t('reservations.editTitle') : t('reservations.newTitle')}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t('reservations.form.client')}</Label>
                    <Select value={formData.client_id} onValueChange={v => setFormData(p => ({ ...p, client_id: v }))}>
                      <SelectTrigger><SelectValue placeholder={t('reservations.form.clientPlaceholder')} /></SelectTrigger>
                      <SelectContent>
                        {clients?.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.first_name} {c.last_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t('reservations.form.type')}</Label>
                    <Select value={formData.type} onValueChange={v => setFormData(p => ({ ...p, type: v as ReservationType }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(TYPE_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_date">{t('reservations.form.startDate')}</Label>
                    <Input id="start_date" type="date" value={formData.start_date} onChange={e => setFormData(p => ({ ...p, start_date: e.target.value }))} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_date">{t('reservations.form.endDate')}</Label>
                    <Input id="end_date" type="date" value={formData.end_date} onChange={e => setFormData(p => ({ ...p, end_date: e.target.value }))} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>{t('reservations.form.status')}</Label>
                    <Select value={formData.status} onValueChange={v => setFormData(p => ({ ...p, status: v as ReservationStatus }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(STATUS_LABELS).map(([value, { label }]) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="guests_count">{t('reservations.form.guests')}</Label>
                    <Input id="guests_count" type="number" min="1" value={formData.guests_count} onChange={e => setFormData(p => ({ ...p, guests_count: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="total_amount">{t('reservations.form.amount')}</Label>
                    <Input id="total_amount" type="number" step="0.01" value={formData.total_amount} onChange={e => setFormData(p => ({ ...p, total_amount: e.target.value }))} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="special_requests">{t('reservations.form.specialRequests')}</Label>
                  <Textarea id="special_requests" value={formData.special_requests} onChange={e => setFormData(p => ({ ...p, special_requests: e.target.value }))} rows={2} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">{t('reservations.form.notes')}</Label>
                  <Textarea id="notes" value={formData.notes} onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))} rows={2} />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>{t('common.cancel')}</Button>
                  <Button type="submit" disabled={createReservation.isPending || updateReservation.isPending}>
                    {(createReservation.isPending || updateReservation.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {editingReservation ? t('common.update') : t('common.create')}
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
                  <TableHead>{t('reservations.table.client')}</TableHead>
                  <TableHead>{t('reservations.table.type')}</TableHead>
                  <TableHead>{t('reservations.table.dates')}</TableHead>
                  <TableHead>{t('reservations.table.guests')}</TableHead>
                  <TableHead>{t('reservations.table.amount')}</TableHead>
                  <TableHead>{t('reservations.table.status')}</TableHead>
                  <TableHead className="text-right">{t('reservations.table.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></TableCell></TableRow>
                ) : reservations?.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">{t('reservations.noItems')}</TableCell></TableRow>
                ) : (
                  reservations?.map(reservation => {
                    const status = STATUS_LABELS[reservation.status];
                    return (
                      <TableRow key={reservation.id}>
                        <TableCell className="font-medium">
                          {reservation.client 
                            ? `${reservation.client.first_name} ${reservation.client.last_name}` 
                            : '-'}
                        </TableCell>
                        <TableCell>{TYPE_LABELS[reservation.type]}</TableCell>
                        <TableCell className="text-sm">
                          <div>{format(new Date(reservation.start_date), 'dd/MM/yyyy', { locale: dateLocale })}</div>
                          {reservation.end_date && (
                            <div className="text-muted-foreground">→ {format(new Date(reservation.end_date), 'dd/MM/yyyy', { locale: dateLocale })}</div>
                          )}
                        </TableCell>
                        <TableCell>{reservation.guests_count || '-'}</TableCell>
                        <TableCell>{reservation.total_amount ? `${reservation.total_amount} €` : '-'}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${status.className}`}>
                            {status.label}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(reservation)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(reservation.id)}>
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

export default ReservationsManager;
