import { useTranslation } from 'react-i18next';
import { MapPin, Phone, Mail, Instagram, Facebook } from 'lucide-react';

export const Footer = () => {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();
  const instagramUrl = t('footer.instagramUrl');
  const facebookUrl = t('footer.facebookUrl');
  const isValidExternalUrl = (url: string) => /^https?:\/\//i.test(url);

  return (
    <footer className="bg-primary text-primary-foreground" role="contentinfo">
      <div className="container-wide mx-auto section-padding">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <h3 className="font-serif text-2xl font-bold mb-4">{t('footer.brandName')}</h3>
            <p className="text-primary-foreground/80 max-w-md mb-6">
              {t('hero.tagline')}
            </p>
            {(isValidExternalUrl(instagramUrl) || isValidExternalUrl(facebookUrl)) && (
              <div className="flex gap-4">
                {isValidExternalUrl(instagramUrl) && (
                  <a
                    href={instagramUrl}
                    className="w-10 h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center hover:bg-accent hover:text-accent-foreground transition-colors"
                    aria-label="Instagram"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Instagram className="h-5 w-5" aria-hidden="true" />
                  </a>
                )}
                {isValidExternalUrl(facebookUrl) && (
                  <a
                    href={facebookUrl}
                    className="w-10 h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center hover:bg-accent hover:text-accent-foreground transition-colors"
                    aria-label="Facebook"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Facebook className="h-5 w-5" aria-hidden="true" />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-serif text-lg font-semibold mb-4">{t('contact.title')}</h4>
            <address className="not-italic space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 mt-0.5 text-accent" aria-hidden="true" />
                <span className="text-primary-foreground/80">{t('contact.addressValue')}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-accent" aria-hidden="true" />
                <span className="text-primary-foreground/80">{t('contact.phoneValue')}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-accent" aria-hidden="true" />
                <span className="text-primary-foreground/80">{t('contact.emailValue')}</span>
              </div>
            </address>
          </div>

          {/* Quick Links */}
          <nav aria-label={t('footer.quickLinksLabel')}>
            <h4 className="font-serif text-lg font-semibold mb-4">{t('footer.quickLinksLabel')}</h4>
            <ul className="space-y-2">
              <li>
                <a href="#rooms" className="text-primary-foreground/80 hover:text-accent transition-colors">
                  {t('nav.rooms')}
                </a>
              </li>
              <li>
                <a href="#restaurant" className="text-primary-foreground/80 hover:text-accent transition-colors">
                  {t('nav.restaurant')}
                </a>
              </li>
              <li>
                <a href="#menu" className="text-primary-foreground/80 hover:text-accent transition-colors">
                  {t('nav.menu')}
                </a>
              </li>
              <li>
                <a href="#contact" className="text-primary-foreground/80 hover:text-accent transition-colors">
                  {t('nav.contact')}
                </a>
              </li>
            </ul>
          </nav>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-primary-foreground/20 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-primary-foreground/60 text-sm">
            © {currentYear} {t('footer.brandName')}. {t('footer.rights')}.
          </p>
          <div className="flex gap-6 text-sm">
            <a href="#contact" className="text-primary-foreground/60 hover:text-accent transition-colors">
              {t('footer.legal')}
            </a>
            <a href="#contact" className="text-primary-foreground/60 hover:text-accent transition-colors">
              {t('footer.privacy')}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
