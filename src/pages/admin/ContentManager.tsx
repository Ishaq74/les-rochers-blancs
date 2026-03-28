import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Save, Download } from 'lucide-react';
import i18n from '@/i18n';
import { SUPPORTED_LOCALES } from '@/lib/i18n-utils';

interface CmsContent {
  id: string;
  section_key: string;
  locale: string;
  field_key: string;
  content: string;
}

const LOCALES = SUPPORTED_LOCALES;
const LOCALE_NAMES: Record<string, string> = {
  fr: 'Français',
  en: 'English',
  ar: 'العربية',
  zh: '中文',
};

const SECTIONS_KEYS = [
  { key: 'hero', fields: ['location', 'title', 'subtitle', 'tagline', 'cta', 'book'] },
  { key: 'openings', fields: [
    'sectionLabel', 'title', 'openingLabel', 'statusOpen', 'statusClosed',
    'summer.title', 'summer.restaurantLabel', 'summer.restaurantDates', 'summer.hotelLabel', 'summer.hotelDates', 'summer.closedDays',
    'winter.title', 'winter.restaurantLabel', 'winter.restaurantDates', 'winter.hotelLabel', 'winter.hotelDates', 'winter.closedDays',
  ] },
  { key: 'hotel', fields: [
    'sectionLabel', 'title', 'subtitle', 'description', 'description2', 'groupNote', 'closingNote', 'pricingTitle',
    'rooms.single.name', 'rooms.single.price', 'rooms.double1.name', 'rooms.double1.price',
    'rooms.double2.name', 'rooms.double2.price', 'rooms.triple.name', 'rooms.triple.price',
    'rooms.quad.name', 'rooms.quad.price', 'rooms.five.name', 'rooms.five.price',
    'extras.breakfast', 'extras.halfBoard', 'extras.halfBoardChild',
    'extras.fullBoard', 'extras.singleSupplement', 'extras.fullBoardChild', 'extras.taxAndDog',
  ] },
  { key: 'restaurant', fields: [
    'sectionLabel', 'title', 'subtitle', 'description', 'menu', 'reserve', 'pricingTitle',
    'pricing.dailySpecial', 'pricing.specialty', 'pricing.menu', 'pricing.childMenu',
    'groupTitle', 'groupDescription', 'contactUs',
  ] },
  { key: 'about', fields: [
    'sectionLabel', 'title', 'subtitle', 'description',
    'values.tradition.title', 'values.tradition.description',
    'values.nature.title', 'values.nature.description',
    'values.excellence.title', 'values.excellence.description',
  ] },
  { key: 'access', fields: [
    'sectionLabel', 'title', 'subtitle',
    'bus.title', 'bus.description', 'car.title', 'car.description',
    'gps.title', 'gps.description', 'partners.title', 'partners.description',
  ] },
  { key: 'contact', fields: [
    'sectionLabel', 'title', 'subtitle',
    'addressLabel', 'addressValue', 'phoneLabel', 'phoneValue',
    'emailLabel', 'emailValue', 'hoursLabel', 'hoursValue',
    'formLabel', 'form.name', 'form.email', 'form.message', 'form.send',
  ] },
  { key: 'nav', fields: ['home', 'hotel', 'rooms', 'restaurant', 'about', 'access', 'contact', 'book'] },
  { key: 'footer', fields: [
    'brandName', 'rights', 'legal', 'privacy', 'quickLinksLabel', 'instagramUrl', 'facebookUrl',
  ] },
];

const ContentManager = () => {
  const { toast } = useToast();
  const { t } = useTranslation();

  const SECTIONS = SECTIONS_KEYS.map(s => ({
    ...s,
    name: t(`contentManager.sections.${s.key}`),
  }));

  const [contents, setContents] = useState<CmsContent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeLocale, setActiveLocale] = useState('fr');
  const [formData, setFormData] = useState<Record<string, Record<string, string>>>({});

  useEffect(() => {
    fetchContents();
  }, []);

  const fetchContents = async () => {
    try {
      const { data, error } = await supabase
        .from('cms_content')
        .select('*')
        .order('section_key');

      if (error) throw error;

      setContents(data || []);

      // Build form data from contents
      const formDataMap: Record<string, Record<string, string>> = {};
      (data || []).forEach((item) => {
        const key = `${item.section_key}.${item.field_key}`;
        if (!formDataMap[item.locale]) {
          formDataMap[item.locale] = {};
        }
        formDataMap[item.locale][key] = item.content;
      });
      setFormData(formDataMap);
    } catch (error) {
      console.error('Error fetching contents:', error);
      toast({
        title: t('common.error'),
        description: t('contentManager.toast.errorLoad'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrefill = () => {
    const newFormData: Record<string, Record<string, string>> = { ...formData };
    
    LOCALES.forEach((locale) => {
      if (!newFormData[locale]) newFormData[locale] = {};
      
      SECTIONS.forEach((section) => {
        section.fields.forEach((field) => {
          const key = `${section.key}.${field}`;
          // Only fill if empty
          if (!newFormData[locale][key]) {
            // Get value from i18n JSON resources
            const i18nKey = `${section.key}.${field}`;
            const value = i18n.getResource(locale, 'translation', i18nKey);
            if (typeof value === 'string') {
              newFormData[locale][key] = value;
            }
          }
        });
      });
    });
    
    setFormData({ ...newFormData });
    toast({
      title: t('contentManager.toast.prefillTitle'),
      description: t('contentManager.toast.prefillDescription'),
    });
  };

  const handleChange = (locale: string, sectionKey: string, fieldKey: string, value: string) => {
    const key = `${sectionKey}.${fieldKey}`;
    setFormData((prev) => ({
      ...prev,
      [locale]: {
        ...(prev[locale] || {}),
        [key]: value,
      },
    }));
  };

  const getValue = (locale: string, sectionKey: string, fieldKey: string): string => {
    const key = `${sectionKey}.${fieldKey}`;
    return formData[locale]?.[key] || '';
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      const upserts: Array<{
        section_key: string;
        locale: string;
        field_key: string;
        content: string;
      }> = [];

      LOCALES.forEach((locale) => {
        SECTIONS.forEach((section) => {
          section.fields.forEach((field) => {
            const content = getValue(locale, section.key, field);
            if (content) {
              upserts.push({
                section_key: section.key,
                locale,
                field_key: field,
                content,
              });
            }
          });
        });
      });

      for (const item of upserts) {
        const { error } = await supabase
          .from('cms_content')
          .upsert(item, {
            onConflict: 'section_key,locale,field_key',
          });

        if (error) throw error;
      }

      toast({
        title: t('common.success'),
        description: t('contentManager.toast.saved'),
      });

      await fetchContents();
    } catch (error) {
      console.error('Error saving contents:', error);
      toast({
        title: t('common.error'),
        description: t('contentManager.toast.errorSave'),
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-serif font-bold text-foreground">{t('contentManager.title')}</h1>
            <p className="text-muted-foreground mt-2">
              {t('contentManager.subtitle')}
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={handlePrefill}
              variant="outline"
            >
              <Download className="w-4 h-4 mr-2" />
              {t('contentManager.prefill')}
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={isSaving}
              className="bg-accent text-accent-foreground hover:bg-gold-light"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? t('common.saving') : t('contentManager.saveAll')}
            </Button>
          </div>
        </div>

        <Tabs value={activeLocale} onValueChange={setActiveLocale}>
          <TabsList className="grid grid-cols-4 w-full max-w-md">
            {LOCALES.map((locale) => (
              <TabsTrigger key={locale} value={locale}>
                {LOCALE_NAMES[locale]}
              </TabsTrigger>
            ))}
          </TabsList>

          {LOCALES.map((locale) => (
            <TabsContent key={locale} value={locale} className="space-y-6 mt-6">
              {SECTIONS.map((section) => (
                <Card key={section.key} className="border-border/50">
                  <CardHeader>
                    <CardTitle>{section.name}</CardTitle>
                    <CardDescription>
                      {t('contentManager.sectionLabel')}: {section.key}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {section.fields.map((field) => (
                      <div key={field} className="space-y-2">
                        <Label htmlFor={`${locale}-${section.key}-${field}`}>
                          {field}
                        </Label>
                        {field.includes('description') || field.includes('Description') || field.includes('groupNote') || field.includes('closingNote') || field.includes('tagline') ? (
                          <Textarea
                            id={`${locale}-${section.key}-${field}`}
                            value={getValue(locale, section.key, field)}
                            onChange={(e) => handleChange(locale, section.key, field, e.target.value)}
                            placeholder={`${section.key}.${field}`}
                            rows={3}
                            dir={locale === 'ar' ? 'rtl' : 'ltr'}
                          />
                        ) : (
                          <Input
                            id={`${locale}-${section.key}-${field}`}
                            value={getValue(locale, section.key, field)}
                            onChange={(e) => handleChange(locale, section.key, field, e.target.value)}
                            placeholder={`${section.key}.${field}`}
                            dir={locale === 'ar' ? 'rtl' : 'ltr'}
                          />
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default ContentManager;
