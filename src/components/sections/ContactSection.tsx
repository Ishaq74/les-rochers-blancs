import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export const ContactSection = () => {
  const { t } = useTranslation();

  return (
    <section id="contact" className="section-padding bg-background" aria-labelledby="contact-heading">
      <div className="container-wide mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Info */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 id="contact-heading" className="heading-section mb-3">
              {t('contact.title')}
            </h2>
            <p className="section-subtitle mb-section">
              {t('contact.subtitle')}
            </p>

            <address className="space-y-item not-italic">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <MapPin className="h-5 w-5 text-accent" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-semibold text-foreground mb-1">{t('contact.addressLabel')}</p>
                  <p className="text-muted-foreground">{t('contact.addressValue')}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <Phone className="h-5 w-5 text-accent" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-semibold text-foreground mb-1">{t('contact.phoneLabel')}</p>
                  <p className="text-muted-foreground">{t('contact.phoneValue')}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <Mail className="h-5 w-5 text-accent" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-semibold text-foreground mb-1">{t('contact.emailLabel')}</p>
                  <p className="text-muted-foreground">{t('contact.emailValue')}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <Clock className="h-5 w-5 text-accent" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-semibold text-foreground mb-1">{t('contact.hoursLabel')}</p>
                  <p className="text-muted-foreground">{t('contact.hoursValue')}</p>
                </div>
              </div>
            </address>
          </motion.div>

          {/* Form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-card p-8 lg:p-10 rounded-lg shadow-medium"
          >
            <form className="space-y-6" aria-label={t('contact.formLabel')}>
              <div>
                <Input
                  placeholder={t('contact.form.name')}
                  className="h-12 bg-background border-border"
                  aria-label={t('contact.form.name')}
                />
              </div>
              <div>
                <Input
                  type="email"
                  placeholder={t('contact.form.email')}
                  className="h-12 bg-background border-border"
                  aria-label={t('contact.form.email')}
                />
              </div>
              <div>
                <Textarea
                  placeholder={t('contact.form.message')}
                  className="min-h-[150px] bg-background border-border resize-none"
                  aria-label={t('contact.form.message')}
                />
              </div>
              <Button
                type="submit"
                className="h-12 bg-accent text-accent-foreground hover:bg-gold-light font-semibold px-8"
              >
                {t('contact.form.send')}
              </Button>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
