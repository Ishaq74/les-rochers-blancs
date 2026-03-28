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
import { useInvoices, useInvoiceMutations, useClients } from '@/hooks/useAdminData';
import { Plus, Pencil, Trash2, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { getDateFnsLocale } from '@/lib/i18n-utils';
import type { Invoice, InvoiceStatus } from '@/types/admin';

const STATUS_LABELS_CLASSES: Record<InvoiceStatus, string> = {
  draft: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  sent: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  paid: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  overdue: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
};

interface InvoiceItemForm {
  description: string;
  quantity: string;
  unit_price: string;
}

const InvoicesManager = () => {
  const { i18n, t } = useTranslation();
  const dateLocale = getDateFnsLocale(i18n.resolvedLanguage || i18n.language);

  const STATUS_LABELS: Record<InvoiceStatus, { label: string; className: string }> = {
    draft: { label: t('invoices.status.draft'), className: STATUS_LABELS_CLASSES.draft },
    sent: { label: t('invoices.status.sent'), className: STATUS_LABELS_CLASSES.sent },
    paid: { label: t('invoices.status.paid'), className: STATUS_LABELS_CLASSES.paid },
    overdue: { label: t('invoices.status.overdue'), className: STATUS_LABELS_CLASSES.overdue },
    cancelled: { label: t('invoices.status.cancelled'), className: STATUS_LABELS_CLASSES.cancelled },
  };

  const { data: invoices, isLoading } = useInvoices();
  const { data: clients } = useClients();
  const { createInvoice, updateInvoice, deleteInvoice } = useInvoiceMutations();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [formData, setFormData] = useState({
    invoice_number: '',
    client_id: '',
    status: 'draft' as InvoiceStatus,
    issue_date: new Date().toISOString().split('T')[0],
    due_date: '',
    tax_rate: '20',
    notes: '',
  });
  const [items, setItems] = useState<InvoiceItemForm[]>([{ description: '', quantity: '1', unit_price: '' }]);

  const resetForm = () => {
    setFormData({
      invoice_number: `INV-${Date.now()}`,
      client_id: '',
      status: 'draft',
      issue_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      tax_rate: '20',
      notes: '',
    });
    setItems([{ description: '', quantity: '1', unit_price: '' }]);
    setEditingInvoice(null);
  };

  const openEditDialog = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setFormData({
      invoice_number: invoice.invoice_number,
      client_id: invoice.client_id || '',
      status: invoice.status,
      issue_date: invoice.issue_date,
      due_date: invoice.due_date,
      tax_rate: invoice.tax_rate.toString(),
      notes: invoice.notes || '',
    });
    setItems(invoice.items?.map(i => ({
      description: i.description,
      quantity: i.quantity.toString(),
      unit_price: i.unit_price.toString(),
    })) || [{ description: '', quantity: '1', unit_price: '' }]);
    setIsDialogOpen(true);
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => {
      return sum + (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0);
    }, 0);
    const taxRate = parseFloat(formData.tax_rate) || 0;
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount;
    return { subtotal, taxAmount, total };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { subtotal, taxAmount, total } = calculateTotals();
    try {
      const invoiceItems = items
        .filter(i => i.description && i.unit_price)
        .map(i => ({
          description: i.description,
          quantity: parseFloat(i.quantity) || 1,
          unit_price: parseFloat(i.unit_price) || 0,
          total: (parseFloat(i.quantity) || 1) * (parseFloat(i.unit_price) || 0),
        }));

      const data = {
        invoice_number: formData.invoice_number,
        client_id: formData.client_id || undefined,
        status: formData.status,
        issue_date: formData.issue_date,
        due_date: formData.due_date,
        subtotal,
        tax_rate: parseFloat(formData.tax_rate) || 20,
        tax_amount: taxAmount,
        total,
        notes: formData.notes || undefined,
        items: invoiceItems,
      };

      if (editingInvoice) {
        await updateInvoice.mutateAsync({ id: editingInvoice.id, ...data, items: invoiceItems as any });
        toast.success(t('invoices.toast.updated'));
      } else {
        await createInvoice.mutateAsync(data);
        toast.success(t('invoices.toast.created'));
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast.error(t('invoices.toast.errorSave'));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('invoices.confirmDelete'))) return;
    try {
      await deleteInvoice.mutateAsync(id);
      toast.success(t('invoices.toast.deleted'));
    } catch (error) {
      toast.error(t('invoices.toast.errorDelete'));
    }
  };

  const addItem = () => setItems([...items, { description: '', quantity: '1', unit_price: '' }]);
  const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index));
  const updateItem = (index: number, field: keyof InvoiceItemForm, value: string) => {
    setItems(items.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const totals = calculateTotals();

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-serif font-bold">{t('invoices.title')}</h1>
            <p className="text-muted-foreground mt-1">{t('invoices.subtitle')}</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}><Plus className="w-4 h-4 mr-2" />{t('invoices.new')}</Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingInvoice ? t('invoices.editTitle') : t('invoices.newTitle')}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="invoice_number">{t('invoices.form.number')}</Label>
                    <Input id="invoice_number" value={formData.invoice_number} onChange={e => setFormData(p => ({ ...p, invoice_number: e.target.value }))} required />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('invoices.form.client')}</Label>
                    <Select value={formData.client_id} onValueChange={v => setFormData(p => ({ ...p, client_id: v }))}>
                      <SelectTrigger><SelectValue placeholder={t('invoices.form.clientPlaceholder')} /></SelectTrigger>
                      <SelectContent>
                        {clients?.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.first_name} {c.last_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t('invoices.form.status')}</Label>
                    <Select value={formData.status} onValueChange={v => setFormData(p => ({ ...p, status: v as InvoiceStatus }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(STATUS_LABELS).map(([value, { label }]) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="issue_date">{t('invoices.form.issueDate')}</Label>
                    <Input id="issue_date" type="date" value={formData.issue_date} onChange={e => setFormData(p => ({ ...p, issue_date: e.target.value }))} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="due_date">{t('invoices.form.dueDate')}</Label>
                    <Input id="due_date" type="date" value={formData.due_date} onChange={e => setFormData(p => ({ ...p, due_date: e.target.value }))} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tax_rate">{t('invoices.form.taxRate')}</Label>
                    <Input id="tax_rate" type="number" step="0.01" value={formData.tax_rate} onChange={e => setFormData(p => ({ ...p, tax_rate: e.target.value }))} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{t('invoices.form.lines')}</Label>
                  <div className="space-y-2">
                    {items.map((item, index) => (
                      <div key={index} className="flex gap-2 items-start">
                        <Input placeholder={t('invoices.form.descriptionPlaceholder')} value={item.description} onChange={e => updateItem(index, 'description', e.target.value)} className="flex-1" />
                        <Input placeholder={t('invoices.form.qtyPlaceholder')} type="number" value={item.quantity} onChange={e => updateItem(index, 'quantity', e.target.value)} className="w-20" />
                        <Input placeholder={t('invoices.form.pricePlaceholder')} type="number" step="0.01" value={item.unit_price} onChange={e => updateItem(index, 'unit_price', e.target.value)} className="w-28" />
                        <div className="w-24 text-right py-2 text-sm font-medium">
                          {((parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0)).toFixed(2)} €
                        </div>
                        {items.length > 1 && (
                          <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(index)}>
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={addItem}>
                    <Plus className="w-4 h-4 mr-1" />{t('invoices.form.addLine')}
                  </Button>
                </div>

                <div className="border-t pt-4 space-y-1 text-right">
                  <div className="text-sm">{t('invoices.form.subtotal')}: <span className="font-medium">{totals.subtotal.toFixed(2)} €</span></div>
                  <div className="text-sm">{t('invoices.form.tax', { rate: formData.tax_rate })}: <span className="font-medium">{totals.taxAmount.toFixed(2)} €</span></div>
                  <div className="text-lg font-bold">{t('invoices.form.totalTTC')}: {totals.total.toFixed(2)} €</div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">{t('invoices.form.notes')}</Label>
                  <Textarea id="notes" value={formData.notes} onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))} rows={2} />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>{t('common.cancel')}</Button>
                  <Button type="submit" disabled={createInvoice.isPending || updateInvoice.isPending}>
                    {(createInvoice.isPending || updateInvoice.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {editingInvoice ? t('common.update') : t('common.create')}
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
                  <TableHead>{t('invoices.table.number')}</TableHead>
                  <TableHead>{t('invoices.table.client')}</TableHead>
                  <TableHead>{t('invoices.table.date')}</TableHead>
                  <TableHead>{t('invoices.table.dueDate')}</TableHead>
                  <TableHead>{t('invoices.table.total')}</TableHead>
                  <TableHead>{t('invoices.table.status')}</TableHead>
                  <TableHead className="text-right">{t('invoices.table.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></TableCell></TableRow>
                ) : invoices?.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">{t('invoices.noItems')}</TableCell></TableRow>
                ) : (
                  invoices?.map(invoice => {
                    const status = STATUS_LABELS[invoice.status];
                    return (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                        <TableCell>
                          {invoice.client ? `${invoice.client.first_name} ${invoice.client.last_name}` : '-'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(invoice.issue_date), 'dd/MM/yyyy', { locale: dateLocale })}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(invoice.due_date), 'dd/MM/yyyy', { locale: dateLocale })}
                        </TableCell>
                        <TableCell className="font-medium">{invoice.total.toFixed(2)} €</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${status.className}`}>
                            {status.label}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(invoice)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(invoice.id)}>
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

export default InvoicesManager;
