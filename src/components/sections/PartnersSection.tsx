import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Handshake } from 'lucide-react';
import alpesBivouac from '@/assets/partners/alpes_bivouac.webp';
import amtOrganisation from '@/assets/partners/amt-organisation.webp';
import annecyAventure from '@/assets/partners/annecy_aventure.webp';
import annecyTakamaka from '@/assets/partners/Annecy_Takamaka.webp';
import queFaireAnnecy from '@/assets/partners/que-faire-a-annecy.webp';
import semnoz from '@/assets/partners/Semnoz.webp';

const partners = [
  { src: alpesBivouac, alt: 'Alpes Bivouac' },
  { src: amtOrganisation, alt: 'AMT Organisation' },
  { src: annecyAventure, alt: 'Annecy Aventure' },
  { src: annecyTakamaka, alt: 'Annecy Takamaka' },
  { src: queFaireAnnecy, alt: 'Que Faire a Annecy' },
  { src: semnoz, alt: 'Semnoz' },
] as const;

export const PartnersSection = () => {
  const { t } = useTranslation();

  const logoSurfaceStyle = {
    backgroundImage:
      'linear-gradient(135deg, hsl(var(--muted)) 0%, hsl(var(--card)) 100%), repeating-linear-gradient(45deg, hsl(var(--foreground) / 0.04) 0 8px, transparent 8px 16px)',
  } as const;

  return (
    <section id="partners" className="section-padding bg-cream">
      <div className="container-wide mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-section"
        >
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-accent/10 flex items-center justify-center">
            <Handshake className="h-8 w-8 text-accent" />
          </div>
          <h2 className="heading-section mb-3">
            {t('partners.title')}
          </h2>
          <p className="section-subtitle max-w-2xl mx-auto">
            {t('partners.description')}
          </p>
        </motion.div>

        {/* Partner logo grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-item">
          {partners.map((partner, i) => (
            <motion.div
              key={partner.alt}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.07 }}
              className="p-3 bg-card border border-border/50 rounded-xl hover:border-accent/40 hover:shadow-soft transition-all aspect-[3/2]"
            >
              <div
                className="w-full h-full rounded-lg border border-border/40 flex items-center justify-center p-3"
                style={logoSurfaceStyle}
              >
                <img
                  src={partner.src}
                  alt={partner.alt}
                  className="w-full h-full object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.28)] dark:drop-shadow-[0_2px_10px_rgba(255,255,255,0.18)]"
                  loading="lazy"
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
