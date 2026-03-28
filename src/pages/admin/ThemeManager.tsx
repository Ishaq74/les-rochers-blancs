import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useThemeSettings, useThemeSettingMutations } from '@/hooks/useAdminData';
import { Loader2, Palette, Type, Save } from 'lucide-react';
import { toast } from 'sonner';

const ThemeManager = () => {
  const { t } = useTranslation();

  const DEFAULT_COLORS = [
    { key: 'primary', label: t('theme.colors.primary'), default: '25 95% 53%' },
    { key: 'accent', label: t('theme.colors.accent'), default: '26 92% 48%' },
    { key: 'background', label: t('theme.colors.background'), default: '30 20% 98%' },
    { key: 'foreground', label: t('theme.colors.foreground'), default: '25 25% 15%' },
    { key: 'muted', label: t('theme.colors.muted'), default: '30 15% 90%' },
    { key: 'secondary', label: t('theme.colors.secondary'), default: '30 10% 94%' },
  ];

  const DEFAULT_FONTS = [
    { key: 'font-heading', label: t('theme.typography.heading'), default: 'Playfair Display' },
    { key: 'font-body', label: t('theme.typography.body'), default: 'Inter' },
  ];

  const { data: settings, isLoading } = useThemeSettings();
  const { upsertThemeSetting } = useThemeSettingMutations();
  const [colors, setColors] = useState<Record<string, string>>({});
  const [fonts, setFonts] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      const colorMap: Record<string, string> = {};
      const fontMap: Record<string, string> = {};
      
      settings.forEach(s => {
        if (s.setting_type === 'color') {
          colorMap[s.setting_key] = s.setting_value;
        } else if (s.setting_type === 'font') {
          fontMap[s.setting_key] = s.setting_value;
        }
      });

      DEFAULT_COLORS.forEach(c => {
        if (!colorMap[c.key]) colorMap[c.key] = c.default;
      });
      DEFAULT_FONTS.forEach(f => {
        if (!fontMap[f.key]) fontMap[f.key] = f.default;
      });

      setColors(colorMap);
      setFonts(fontMap);
    }
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const promises = [
        ...Object.entries(colors).map(([key, value]) => 
          upsertThemeSetting.mutateAsync({ 
            setting_key: key, 
            setting_value: value, 
            setting_type: 'color',
            category: 'colors'
          })
        ),
        ...Object.entries(fonts).map(([key, value]) => 
          upsertThemeSetting.mutateAsync({ 
            setting_key: key, 
            setting_value: value, 
            setting_type: 'font',
            category: 'typography'
          })
        ),
      ];
      await Promise.all(promises);
      toast.success(t('theme.toast.saved'));
    } catch (error) {
      toast.error(t('theme.toast.errorSave'));
    } finally {
      setSaving(false);
    }
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

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-serif font-bold">{t('theme.title')}</h1>
            <p className="text-muted-foreground mt-1">{t('theme.subtitle')}</p>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            {t('common.save')}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                {t('theme.colors.title')}
              </CardTitle>
              <CardDescription>
                {t('theme.colors.description')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {DEFAULT_COLORS.map(color => (
                <div key={color.key} className="space-y-2">
                  <Label htmlFor={color.key}>{color.label}</Label>
                  <div className="flex gap-2">
                    <div 
                      className="w-10 h-10 rounded border flex-shrink-0"
                      style={{ backgroundColor: `hsl(${colors[color.key] || color.default})` }}
                    />
                    <Input 
                      id={color.key}
                      value={colors[color.key] || ''}
                      onChange={e => setColors(p => ({ ...p, [color.key]: e.target.value }))}
                      placeholder={color.default}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Type className="w-5 h-5" />
                {t('theme.typography.title')}
              </CardTitle>
              <CardDescription>
                {t('theme.typography.description')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {DEFAULT_FONTS.map(font => (
                <div key={font.key} className="space-y-2">
                  <Label htmlFor={font.key}>{font.label}</Label>
                  <Input 
                    id={font.key}
                    value={fonts[font.key] || ''}
                    onChange={e => setFonts(p => ({ ...p, [font.key]: e.target.value }))}
                    placeholder={font.default}
                  />
                  <p 
                    className="text-sm text-muted-foreground"
                    style={{ fontFamily: fonts[font.key] || font.default }}
                  >
                    Aperçu: Les Rochers Blancs
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('theme.preview.title')}</CardTitle>
            <CardDescription>{t('theme.preview.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div 
              className="p-6 rounded-lg border"
              style={{ backgroundColor: `hsl(${colors['background'] || '30 20% 98%'})` }}
            >
              <h3 
                className="text-2xl font-bold mb-2"
                style={{ 
                  color: `hsl(${colors['foreground'] || '25 25% 15%'})`,
                  fontFamily: fonts['font-heading'] || 'Playfair Display'
                }}
              >
                Les Rochers Blancs
              </h3>
              <p 
                className="mb-4"
                style={{ 
                  color: `hsl(${colors['foreground'] || '25 25% 15%'})`,
                  fontFamily: fonts['font-body'] || 'Inter'
                }}
              >
                {t('theme.preview.text')}
              </p>
              <div className="flex gap-2">
                <button 
                  className="px-4 py-2 rounded text-white"
                  style={{ backgroundColor: `hsl(${colors['primary'] || '25 95% 53%'})` }}
                >
                  {t('theme.preview.primaryButton')}
                </button>
                <button 
                  className="px-4 py-2 rounded text-white"
                  style={{ backgroundColor: `hsl(${colors['accent'] || '26 92% 48%'})` }}
                >
                  {t('theme.preview.accentButton')}
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default ThemeManager;
