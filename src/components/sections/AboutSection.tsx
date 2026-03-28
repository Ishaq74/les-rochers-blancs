import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Mountain, Leaf, Star } from 'lucide-react';

const values = [
  { key: 'tradition', icon: Mountain },
  { key: 'nature', icon: Leaf },
  { key: 'excellence', icon: Star },
];

export const AboutSection = () => {
  const { t } = useTranslation();

  return (
    <section id="about" className="section-padding bg-cream">
      <div className="container-wide mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 max-w-3xl mx-auto"
        >
          <span className="text-accent font-medium tracking-[0.2em] uppercase text-sm mb-3 block">
            {t('about.sectionLabel')}
          </span>
          <h2 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-4">
            {t('about.title')}
          </h2>
          <p className="font-serif text-xl text-muted-foreground mb-4 italic">
            {t('about.subtitle')}
          </p>
          <p className="text-muted-foreground leading-relaxed">
            {t('about.description')}
          </p>
        </motion.div>

        {/* Values */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {values.map((value, index) => (
            <motion.div
              key={value.key}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              className="text-center p-8 bg-background rounded-lg shadow-soft"
            >
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-accent/10 flex items-center justify-center">
                <value.icon className="h-8 w-8 text-accent" />
              </div>
              <h3 className="font-serif text-2xl font-semibold text-foreground mb-3">
                {t(`about.values.${value.key}.title`)}
              </h3>
              <p className="text-muted-foreground">
                {t(`about.values.${value.key}.description`)}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
