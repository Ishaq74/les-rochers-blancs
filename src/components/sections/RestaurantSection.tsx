import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { UtensilsCrossed, Users } from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import restaurantImage from '@/assets/restaurant.jpg';
import summerImage from '@/assets/season-summer.jpg';
import heroImage from '@/assets/hero-mountain.jpg';

const pricingKeys = ['dailySpecial', 'specialty', 'menu', 'childMenu'] as const;

export const RestaurantSection = () => {
  const { t } = useTranslation();

  return (
    <section id="restaurant" className="section-padding bg-secondary">
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
            {t('restaurant.title')}
          </h2>
          <p className="font-serif text-xl text-muted-foreground italic">
            {t('restaurant.subtitle')}
          </p>
        </motion.div>

        {/* Main Grid: Carousel Left + Content Right */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-section items-stretch">
          {/* Carousel Left */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex items-center"
          >
            <Carousel className="w-full group">
              <CarouselContent className="-ml-2 md:-ml-4">
                <CarouselItem className="basis-full pl-2 md:pl-4">
                  <div className="relative w-full aspect-[3/4] overflow-hidden rounded-xl shadow-elegant">
                    <img
                      src={restaurantImage}
                      alt={t('restaurant.title')}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                </CarouselItem>
                <CarouselItem className="basis-full pl-2 md:pl-4">
                  <div className="relative w-full aspect-[3/4] overflow-hidden rounded-xl shadow-elegant">
                    <img
                      src={summerImage}
                      alt={t('restaurant.title')}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                </CarouselItem>
                <CarouselItem className="basis-full pl-2 md:pl-4">
                  <div className="relative w-full aspect-[3/4] overflow-hidden rounded-xl shadow-elegant">
                    <img
                      src={heroImage}
                      alt={t('restaurant.title')}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                </CarouselItem>
              </CarouselContent>
              <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 bg-black/40 hover:bg-black/60 border-white/30 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 bg-black/40 hover:bg-black/60 border-white/30 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </Carousel>
          </motion.div>

          {/* Content Right */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col justify-between"
          >
            {/* Description */}
            <div className="mb-8">
              <p className="text-muted-foreground leading-relaxed mb-6 text-base">
                {t('restaurant.description')}
              </p>

              {/* Group / Seminars */}
              <div className="bg-accent/10 rounded-lg p-5">
                <h3 className="heading-card mb-2 flex items-center gap-2">
                  <Users className="h-4 w-4 text-accent" />
                  {t('restaurant.groupTitle')}
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {t('restaurant.groupDescription')}
                </p>
                <Button asChild variant="outline" size="sm" className="font-semibold">
                  <a href="#contact">{t('restaurant.contactUs')}</a>
                </Button>
              </div>
            </div>

            {/* Pricing - 2 Column Grid */}
            <div>
              <h3 className="heading-subsection mb-6 flex items-center gap-2">
                <UtensilsCrossed className="h-5 w-5 text-accent" />
                {t('restaurant.pricingTitle')}
              </h3>
              <div className="grid grid-cols-2 gap-item mb-6">
                {pricingKeys.map((key, index) => (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.08 }}
                    className="p-4 bg-card rounded-lg border border-border/50 hover:border-accent/50 hover:bg-accent/5 transition-all"
                  >
                    <p className="text-xs text-muted-foreground leading-snug">
                      {t(`restaurant.pricing.${key}`)}
                    </p>
                  </motion.div>
                ))}
              </div>

            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
