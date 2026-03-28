import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSiteSettings, useSiteSettingMutations } from '@/hooks/useAdminData';
import { Loader2, Settings, Globe, Mail, Database, Save, Download, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const SITE_SETTINGS_KEYS = [
  { key: 'site_name', category: 'general', type: 'text' },
  { key: 'site_description', category: 'general', type: 'textarea' },
  { key: 'contact_email', category: 'contact', type: 'email' },
  { key: 'contact_phone', category: 'contact', type: 'tel' },
  { key: 'contact_address', category: 'contact', type: 'textarea' },
  { key: 'social_facebook', category: 'social', type: 'url' },
  { key: 'social_instagram', category: 'social', type: 'url' },
  { key: 'social_twitter', category: 'social', type: 'url' },
  { key: 'meta_title', category: 'seo', type: 'text' },
  { key: 'meta_description', category: 'seo', type: 'textarea' },
  { key: 'meta_keywords', category: 'seo', type: 'text' },
];

const SettingsManager = () => {
  const { t } = useTranslation();

  const SITE_SETTINGS = SITE_SETTINGS_KEYS.map(s => ({
    ...s,
    label: t(`settings.fields.${s.key}`),
  }));

  const { data: settings, isLoading } = useSiteSettings();
  const { upsertSiteSetting } = useSiteSettingMutations();
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      const map: Record<string, string> = {};
      settings.forEach(s => {
        map[s.setting_key] = s.setting_value;
      });
      setFormData(map);
    }
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const promises = Object.entries(formData).map(([key, value]) => {
        const setting = SITE_SETTINGS.find(s => s.key === key);
        return upsertSiteSetting.mutateAsync({ 
          setting_key: key, 
          setting_value: value,
          setting_type: setting?.type || 'text',
          category: setting?.category || 'general'
        });
      });
      await Promise.all(promises);
      toast.success(t('settings.toast.saved'));
    } catch (error) {
      toast.error(t('settings.toast.errorSave'));
    } finally {
      setSaving(false);
    }
  };

  const handleBackup = async () => {
    try {
      const tables = ['cms_content', 'services', 'service_translations', 'formations', 'formation_translations', 
                      'blog_posts', 'blog_post_translations', 'clients', 'site_settings', 'theme_settings'];
      
      const backup: Record<string, any> = { version: 1, date: new Date().toISOString(), tables: {} };
      
      for (const table of tables) {
        const { data } = await supabase.from(table as any).select('*');
        backup.tables[table] = data || [];
      }
      
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast.success(t('settings.toast.backup'));
    } catch (error) {
      toast.error(t('settings.toast.errorBackup'));
    }
  };

  const renderField = (setting: typeof SITE_SETTINGS[0]) => {
    const value = formData[setting.key] || '';
    const onChange = (v: string) => setFormData(p => ({ ...p, [setting.key]: v }));

    if (setting.type === 'textarea') {
      return (
        <Textarea 
          id={setting.key}
          value={value}
          onChange={e => onChange(e.target.value)}
          rows={3}
        />
      );
    }
    
    return (
      <Input 
        id={setting.key}
        type={setting.type}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    );
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  const categories = {
    general: { label: t('settings.categories.general'), icon: Settings },
    contact: { label: t('settings.categories.contact'), icon: Mail },
    social: { label: t('settings.categories.social'), icon: Globe },
    seo: { label: t('settings.categories.seo'), icon: Globe },
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-serif font-bold">{t('settings.title')}</h1>
            <p className="text-muted-foreground mt-1">{t('settings.subtitle')}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleBackup}>
              <Download className="w-4 h-4 mr-2" />{t('settings.backupButton')}
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              {t('common.save')}
            </Button>
          </div>
        </div>

        <Tabs defaultValue="general">
          <TabsList>
            {Object.entries(categories).map(([key, { label }]) => (
              <TabsTrigger key={key} value={key}>{label}</TabsTrigger>
            ))}
          </TabsList>

          {Object.entries(categories).map(([categoryKey, { label, icon: Icon }]) => (
            <TabsContent key={categoryKey} value={categoryKey}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon className="w-5 h-5" />
                    {label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {SITE_SETTINGS.filter(s => s.category === categoryKey).map(setting => (
                    <div key={setting.key} className="space-y-2">
                      <Label htmlFor={setting.key}>{setting.label}</Label>
                      {renderField(setting)}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              {t('settings.backupSection.title')}
            </CardTitle>
            <CardDescription>
              {t('settings.backupSection.description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-4">
            <Button variant="outline" onClick={handleBackup}>
              <Download className="w-4 h-4 mr-2" />
              {t('settings.backupSection.download')}
            </Button>
            <Button variant="outline" disabled>
              <Upload className="w-4 h-4 mr-2" />
              {t('settings.backupSection.restore')}
            </Button>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default SettingsManager;
