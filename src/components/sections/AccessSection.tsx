import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Bus, Car, MapPin } from 'lucide-react';

const accessItems = [
  { key: 'bus', icon: Bus },
  { key: 'car', icon: Car },
  { key: 'gps', icon: MapPin },
] as const;

export const AccessSection = () => {
  const { t } = useTranslation();

  return (
    <section id="access" className="section-padding bg-secondary">
      <div className="container-wide mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-section"
        >
          <h2 className="heading-section mb-3">
            {t('access.title')}
          </h2>
          <p className="section-subtitle">
            {t('access.subtitle')}
          </p>
        </motion.div>

        {/* Access content: left list + right map */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-section items-start">
          <div className="space-y-4">
            {accessItems.map((item, index) => (
              <motion.div
                key={item.key}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.12 }}
                className="bg-card rounded-xl p-6 border border-border/50 shadow-soft"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                    <item.icon className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="heading-card mb-2">
                      {t(`access.${item.key}.title`)}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {t(`access.${item.key}.description`)}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-card rounded-xl border border-border/50 shadow-soft overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-border/50 bg-background/50 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-accent" />
              <span className="text-sm font-medium text-foreground">{t('access.gps.title')}</span>
            </div>
            <div className="aspect-[4/3] w-full">
              <iframe
                title="Carte - Les Rochers Blancs"
                src="https://www.google.com/maps?q=Les%20Rochers%20Blancs%20Semnoz&output=embed"
                className="w-full h-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
