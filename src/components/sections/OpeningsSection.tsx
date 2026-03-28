import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Sun, Snowflake, UtensilsCrossed, Hotel, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import summerImage from '@/assets/season-summer.jpg';
import winterImage from '@/assets/season-winter.jpg';

/**
 * Parse a date string like "9/5/24" or "21/12/23" (DD/MM/YY) into a Date object.
 * Returns null if unparseable.
 */
function parseDateFromText(text: string): Date | null {
  const match = text.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (!match) return null;
  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10) - 1;
  let year = parseInt(match[3], 10);
  if (year < 100) year += 2000;
  return new Date(year, month, day);
}

/**
 * Extract the first and last date from a date range text.
 * Supports formats like "Du 9/5/24 au 21/10/24" or "From 9/5/24 to 21/10/24"
 * Also handles compound ranges: "Du 21/12/23 au 7/1/24 et du 9/2/24 au 10/3/24"
 */
function extractDateRange(text: string): { start: Date | null; end: Date | null } {
  const dates = text.match(/\d{1,2}\/\d{1,2}\/\d{2,4}/g);
  if (!dates || dates.length === 0) return { start: null, end: null };
  return {
    start: parseDateFromText(dates[0]),
    end: parseDateFromText(dates[dates.length - 1]),
  };
}

function isCurrentlyOpen(dateText: string): boolean | null {
  const { start, end } = extractDateRange(dateText);
  if (!start || !end) return null;
  const now = new Date();
  return now >= start && now <= end;
}

interface SeasonCardProps {
  seasonKey: 'summer' | 'winter';
  variant: 'primary' | 'light';
  icon: typeof Sun;
  image: string;
}

const SeasonCard = ({ seasonKey, variant, icon: Icon, image }: SeasonCardProps) => {
  const { t } = useTranslation();

  const restaurantDates = t(`openings.${seasonKey}.restaurantDates`);
  const hotelDates = t(`openings.${seasonKey}.hotelDates`);

  const restaurantOpen = useMemo(() => isCurrentlyOpen(restaurantDates), [restaurantDates]);
  const hotelOpen = useMemo(() => isCurrentlyOpen(hotelDates), [hotelDates]);
  const isSeasonActive = restaurantOpen === true || hotelOpen === true;

  const isPrimary = variant === 'primary';

  const cardClasses = isPrimary
    ? 'bg-primary text-primary-foreground'
    : 'bg-muted text-foreground border border-border/50';

  const badgeBg = isPrimary ? 'bg-accent text-accent-foreground' : 'bg-primary text-primary-foreground';
  const textMuted = isPrimary ? 'text-primary-foreground/85' : 'text-muted-foreground';
  const alertBg = isPrimary ? 'bg-accent/20' : 'bg-primary/10';
  const alertIcon = isPrimary ? 'text-accent' : 'text-primary';

  return (
    <div
      className={`${cardClasses} rounded-2xl overflow-hidden shadow-lg border-2 ${
        isSeasonActive ? 'ring-2 ring-green-400/50 border-green-400/40' : 'border-border/30'
      }`}
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={image}
          alt={t(`openings.${seasonKey}.title`)}
          className="w-full h-full object-cover"
          loading="lazy"
          width={640}
          height={640}
        />
        <div className={`absolute inset-0 ${isPrimary ? 'bg-primary/30' : 'bg-foreground/10'}`} />
        <div className="absolute bottom-3 left-4 flex items-center gap-2">
          <Icon className={`h-7 w-7 ${isPrimary ? 'text-accent' : 'text-primary'}`} aria-hidden="true" />
          <h3 className={`heading-subsection ${isPrimary ? 'text-primary-foreground' : 'text-foreground'} drop-shadow-md`}>
            {t(`openings.${seasonKey}.title`)}
          </h3>
        </div>
        <div className="absolute top-3 right-3">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
              isSeasonActive
                ? 'bg-green-500/90 text-white'
                : isPrimary
                  ? 'bg-black/30 text-primary-foreground'
                  : 'bg-background/90 text-muted-foreground'
            }`}
          >
            {isSeasonActive ? (
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            {isSeasonActive ? t('openings.statusOpen') : t('openings.statusClosed')}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        <p className={`font-semibold tracking-wider uppercase text-xs ${isPrimary ? 'text-accent' : 'text-primary'}`}>
          {t('openings.openingLabel')}
        </p>

        {/* Restaurant */}
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className={`inline-flex items-center gap-1.5 ${badgeBg} px-2.5 py-0.5 rounded text-xs font-semibold`}>
              <UtensilsCrossed className="h-3.5 w-3.5" aria-hidden="true" />
              {t(`openings.${seasonKey}.restaurantLabel`)}
            </span>
            {restaurantOpen !== null && (
              <StatusBadge isOpen={restaurantOpen} isPrimary={isPrimary} />
            )}
          </div>
          <p className={`${textMuted} text-sm`}>{restaurantDates}</p>
        </div>

        {/* Hotel */}
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className={`inline-flex items-center gap-1.5 ${badgeBg} px-2.5 py-0.5 rounded text-xs font-semibold`}>
              <Hotel className="h-3.5 w-3.5" aria-hidden="true" />
              {t(`openings.${seasonKey}.hotelLabel`)}
            </span>
            {hotelOpen !== null && (
              <StatusBadge isOpen={hotelOpen} isPrimary={isPrimary} />
            )}
          </div>
          <p className={`${textMuted} text-sm`}>{hotelDates}</p>
        </div>

        {/* Closed days warning */}
        <div className={`flex items-start gap-2 ${alertBg} rounded-lg p-3`} role="alert">
          <AlertTriangle className={`h-4 w-4 ${alertIcon} mt-0.5 shrink-0`} aria-hidden="true" />
          <p className={`${textMuted} text-sm font-medium`}>
            {t(`openings.${seasonKey}.closedDays`)}
          </p>
        </div>
      </div>
    </div>
  );
};

const StatusBadge = ({ isOpen, isPrimary }: { isOpen: boolean; isPrimary: boolean }) => {
  const { t } = useTranslation();
  if (isOpen) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-green-400" role="status">
        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
        {t('openings.statusOpen')}
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${isPrimary ? 'text-primary-foreground/50' : 'text-muted-foreground/70'}`} role="status">
      <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
      {t('openings.statusClosed')}
    </span>
  );
};

export const OpeningsSection = () => {
  const { t } = useTranslation();

  return (
    <section id="openings" className="section-padding bg-secondary/30" aria-labelledby="openings-heading">
      <div className="container-wide mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-section"
        >
          <h2 id="openings-heading" className="heading-section">
            {t('openings.title')}
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-section">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <SeasonCard seasonKey="summer" variant="primary" icon={Sun} image={summerImage} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <SeasonCard seasonKey="winter" variant="light" icon={Snowflake} image={winterImage} />
          </motion.div>
        </div>
      </div>
    </section>
  );
};
