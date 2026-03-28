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
import { useQuotes, useQuoteMutations, useClients } from '@/hooks/useAdminData';
import { Plus, Pencil, Trash2, Loader2, X, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { getDateFnsLocale } from '@/lib/i18n-utils';
import type { Quote, QuoteStatus } from '@/types/admin';

const STATUS_LABELS_CLASSES: Record<QuoteStatus, string> = {
  draft: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  sent: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  accepted: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  expired: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  converted: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
};

interface QuoteItemForm {
  description: string;
  quantity: string;
  unit_price: string;
}

const QuotesManager = () => {
  const { i18n, t } = useTranslation();
  const dateLocale = getDateFnsLocale(i18n.resolvedLanguage || i18n.language);

  const STATUS_LABELS: Record<QuoteStatus, { label: string; className: string }> = {
    draft: { label: t('quotes.status.draft'), className: STATUS_LABELS_CLASSES.draft },
    sent: { label: t('quotes.status.sent'), className: STATUS_LABELS_CLASSES.sent },
    accepted: { label: t('quotes.status.accepted'), className: STATUS_LABELS_CLASSES.accepted },
    rejected: { label: t('quotes.status.rejected'), className: STATUS_LABELS_CLASSES.rejected },
    expired: { label: t('quotes.status.expired'), className: STATUS_LABELS_CLASSES.expired },
    converted: { label: t('quotes.status.converted'), className: STATUS_LABELS_CLASSES.converted },
  };

  const { data: quotes, isLoading } = useQuotes();
  const { data: clients } = useClients();
  const { createQuote, updateQuote, deleteQuote, convertToInvoice } = useQuoteMutations();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [formData, setFormData] = useState({
    quote_number: '',
    client_id: '',
    status: 'draft' as QuoteStatus,
    issue_date: new Date().toISOString().split('T')[0],
    valid_until: '',
    tax_rate: '20',
    notes: '',
  });
  const [items, setItems] = useState<QuoteItemForm[]>([{ description: '', quantity: '1', unit_price: '' }]);

  const resetForm = () => {
    setFormData({
      quote_number: `DEV-${Date.now()}`,
      client_id: '',
      status: 'draft',
      issue_date: new Date().toISOString().split('T')[0],
      valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      tax_rate: '20',
      notes: '',
    });
    setItems([{ description: '', quantity: '1', unit_price: '' }]);
    setEditingQuote(null);
  };

  const openEditDialog = (quote: Quote) => {
    setEditingQuote(quote);
    setFormData({
      quote_number: quote.quote_number,
      client_id: quote.client_id || '',
      status: quote.status,
      issue_date: quote.issue_date,
      valid_until: quote.valid_until,
      tax_rate: quote.tax_rate.toString(),
      notes: quote.notes || '',
    });
    setItems(quote.items?.map(i => ({
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
      const quoteItems = items
        .filter(i => i.description && i.unit_price)
        .map(i => ({
          description: i.description,
          quantity: parseFloat(i.quantity) || 1,
          unit_price: parseFloat(i.unit_price) || 0,
          total: (parseFloat(i.quantity) || 1) * (parseFloat(i.unit_price) || 0),
        }));

      const data = {
        quote_number: formData.quote_number,
        client_id: formData.client_id || undefined,
        status: formData.status,
        issue_date: formData.issue_date,
        valid_until: formData.valid_until,
        subtotal,
        tax_rate: parseFloat(formData.tax_rate) || 20,
        tax_amount: taxAmount,
        total,
        notes: formData.notes || undefined,
        items: quoteItems,
      };

      if (editingQuote) {
        await updateQuote.mutateAsync({ id: editingQuote.id, ...data, items: quoteItems as any });
        toast.success(t('quotes.toast.updated'));
      } else {
        await createQuote.mutateAsync(data);
        toast.success(t('quotes.toast.created'));
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast.error(t('quotes.toast.errorSave'));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('quotes.confirmDelete'))) return;
    try {
      await deleteQuote.mutateAsync(id);
      toast.success(t('quotes.toast.deleted'));
    } catch (error) {
      toast.error(t('quotes.toast.errorDelete'));
    }
  };

  const handleConvert = async (id: string) => {
    if (!confirm(t('quotes.confirmConvert'))) return;
    try {
      await convertToInvoice.mutateAsync(id);
      toast.success(t('quotes.toast.converted'));
    } catch (error) {
      toast.error(t('quotes.toast.errorConvert'));
    }
  };

  const addItem = () => setItems([...items, { description: '', quantity: '1', unit_price: '' }]);
  const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index));
  const updateItem = (index: number, field: keyof QuoteItemForm, value: string) => {
    setItems(items.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const totals = calculateTotals();

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-serif font-bold">{t('quotes.title')}</h1>
            <p className="text-muted-foreground mt-1">{t('quotes.subtitle')}</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}><Plus className="w-4 h-4 mr-2" />{t('quotes.new')}</Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingQuote ? t('quotes.editTitle') : t('quotes.newTitle')}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quote_number">{t('quotes.form.number')}</Label>
                    <Input id="quote_number" value={formData.quote_number} onChange={e => setFormData(p => ({ ...p, quote_number: e.target.value }))} required />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('quotes.form.client')}</Label>
                    <Select value={formData.client_id} onValueChange={v => setFormData(p => ({ ...p, client_id: v }))}>
                      <SelectTrigger><SelectValue placeholder={t('quotes.form.clientPlaceholder')} /></SelectTrigger>
                      <SelectContent>
                        {clients?.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.first_name} {c.last_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t('quotes.form.status')}</Label>
                    <Select value={formData.status} onValueChange={v => setFormData(p => ({ ...p, status: v as QuoteStatus }))}>
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
                    <Label htmlFor="issue_date">{t('quotes.form.issueDate')}</Label>
                    <Input id="issue_date" type="date" value={formData.issue_date} onChange={e => setFormData(p => ({ ...p, issue_date: e.target.value }))} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="valid_until">{t('quotes.form.validUntil')}</Label>
                    <Input id="valid_until" type="date" value={formData.valid_until} onChange={e => setFormData(p => ({ ...p, valid_until: e.target.value }))} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tax_rate">{t('quotes.form.taxRate')}</Label>
                    <Input id="tax_rate" type="number" step="0.01" value={formData.tax_rate} onChange={e => setFormData(p => ({ ...p, tax_rate: e.target.value }))} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{t('quotes.form.lines')}</Label>
                  <div className="space-y-2">
                    {items.map((item, index) => (
                      <div key={index} className="flex gap-2 items-start">
                        <Input placeholder={t('quotes.form.descriptionPlaceholder')} value={item.description} onChange={e => updateItem(index, 'description', e.target.value)} className="flex-1" />
                        <Input placeholder={t('quotes.form.qtyPlaceholder')} type="number" value={item.quantity} onChange={e => updateItem(index, 'quantity', e.target.value)} className="w-20" />
                        <Input placeholder={t('quotes.form.pricePlaceholder')} type="number" step="0.01" value={item.unit_price} onChange={e => updateItem(index, 'unit_price', e.target.value)} className="w-28" />
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
                    <Plus className="w-4 h-4 mr-1" />{t('quotes.form.addLine')}
                  </Button>
                </div>

                <div className="border-t pt-4 space-y-1 text-right">
                  <div className="text-sm">{t('quotes.form.subtotal')}: <span className="font-medium">{totals.subtotal.toFixed(2)} €</span></div>
                  <div className="text-sm">{t('quotes.form.tax', { rate: formData.tax_rate })}: <span className="font-medium">{totals.taxAmount.toFixed(2)} €</span></div>
                  <div className="text-lg font-bold">{t('quotes.form.totalTTC')}: {totals.total.toFixed(2)} €</div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">{t('quotes.form.notes')}</Label>
                  <Textarea id="notes" value={formData.notes} onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))} rows={2} />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>{t('common.cancel')}</Button>
                  <Button type="submit" disabled={createQuote.isPending || updateQuote.isPending}>
                    {(createQuote.isPending || updateQuote.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {editingQuote ? t('common.update') : t('common.create')}
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
                  <TableHead>{t('quotes.table.number')}</TableHead>
                  <TableHead>{t('quotes.table.client')}</TableHead>
                  <TableHead>{t('quotes.table.date')}</TableHead>
                  <TableHead>{t('quotes.table.validUntil')}</TableHead>
                  <TableHead>{t('quotes.table.total')}</TableHead>
                  <TableHead>{t('quotes.table.status')}</TableHead>
                  <TableHead className="text-right">{t('quotes.table.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></TableCell></TableRow>
                ) : quotes?.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">{t('quotes.noItems')}</TableCell></TableRow>
                ) : (
                  quotes?.map(quote => {
                    const status = STATUS_LABELS[quote.status];
                    const canConvert = quote.status === 'accepted' && !quote.converted_invoice_id;
                    return (
                      <TableRow key={quote.id}>
                        <TableCell className="font-medium">{quote.quote_number}</TableCell>
                        <TableCell>
                          {quote.client ? `${quote.client.first_name} ${quote.client.last_name}` : '-'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(quote.issue_date), 'dd/MM/yyyy', { locale: dateLocale })}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(quote.valid_until), 'dd/MM/yyyy', { locale: dateLocale })}
                        </TableCell>
                        <TableCell className="font-medium">{quote.total.toFixed(2)} €</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${status.className}`}>
                            {status.label}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          {canConvert && (
                            <Button variant="ghost" size="icon" onClick={() => handleConvert(quote.id)} title="Convertir en facture">
                              <FileText className="w-4 h-4 text-accent" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(quote)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(quote.id)}>
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

export default QuotesManager;
