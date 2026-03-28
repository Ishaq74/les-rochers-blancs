import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Users, Info, Check } from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import roomImage from '@/assets/room-suite.jpg';
import summerImage from '@/assets/season-summer.jpg';
import winterImage from '@/assets/season-winter.jpg';

const roomKeys = ['single', 'double1', 'double2', 'triple', 'quad', 'five'] as const;

const extraKeys = [
  'breakfast',
  'halfBoard',
  'halfBoardChild',
  'fullBoard',
  'singleSupplement',
  'fullBoardChild',
  'taxAndDog',
] as const;

export const RoomsSection = () => {
  const { t } = useTranslation();

  return (
    <section id="rooms" className="section-padding bg-background">
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
            {t('hotel.title')}
          </h2>
          <p className="font-serif text-xl text-muted-foreground italic">
            {t('hotel.subtitle')}
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
                      src={roomImage}
                      alt={t('hotel.title')}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                </CarouselItem>
                <CarouselItem className="basis-full pl-2 md:pl-4">
                  <div className="relative w-full aspect-[3/4] overflow-hidden rounded-xl shadow-elegant">
                    <img
                      src={summerImage}
                      alt={t('hotel.title')}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                </CarouselItem>
                <CarouselItem className="basis-full pl-2 md:pl-4">
                  <div className="relative w-full aspect-[3/4] overflow-hidden rounded-xl shadow-elegant">
                    <img
                      src={winterImage}
                      alt={t('hotel.title')}
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
              <p className="text-muted-foreground leading-relaxed mb-4 text-base">
                {t('hotel.description')}
              </p>
              <p className="text-muted-foreground leading-relaxed mb-6 text-base">
                {t('hotel.description2')}
              </p>
              <div className="bg-accent/10 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    {t('hotel.groupNote')}
                  </p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground italic">
                {t('hotel.closingNote')}
              </p>
            </div>

            {/* Rooms Pricing - 2 Column Grid */}
            <div>
              <h3 className="heading-subsection mb-6">
                {t('hotel.pricingTitle')}
              </h3>
              <div className="grid grid-cols-2 gap-item">
                {roomKeys.map((key, index) => (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.08 }}
                    className="p-4 bg-card rounded-lg border border-border/50 hover:border-accent/50 hover:bg-accent/5 transition-all"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                        <Users className="h-4 w-4 text-accent" />
                      </div>
                    </div>
                    <p className="text-sm font-medium text-foreground mb-2">
                      {t(`hotel.rooms.${key}.name`)}
                    </p>
                    <p className="text-lg font-bold text-accent font-serif">
                      {t(`hotel.rooms.${key}.price`)}€
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Extras */}
        <motion.div
        initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.15 }}
        className="my-section"
        >
          <div className="bg-secondary rounded-xl p-8">
            <h3 className="heading-subsection mb-6 flex items-center gap-2">
              <Check className="h-5 w-5 text-accent" />
              Inclus et tarifs supplémentaires
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-item">
              {extraKeys.map((key) => (
              <p key={key} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-accent mt-1.5 flex-shrink-0">•</span>
                  {t(`hotel.extras.${key}`)}
                </p>
            ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
