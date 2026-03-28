import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { HeroSection } from '@/components/sections/HeroSection';
import { OpeningsSection } from '@/components/sections/OpeningsSection';
import { RoomsSection } from '@/components/sections/RoomsSection';
import { RestaurantSection } from '@/components/sections/RestaurantSection';
import { MenuSection } from '@/components/sections/MenuSection';
import { AccessSection } from '@/components/sections/AccessSection';
import { PartnersSection } from '@/components/sections/PartnersSection';
import { ContactSection } from '@/components/sections/ContactSection';

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <HeroSection />
        <OpeningsSection />
        <RoomsSection />
        <RestaurantSection />
        <MenuSection />
        <PartnersSection />
        <AccessSection />
        <ContactSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
