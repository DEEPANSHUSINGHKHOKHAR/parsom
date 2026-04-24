import Navbar from '../components/layout/navbar';
import Footer from '../components/layout/footer';
import HomeHero from '../components/sections/home-hero';
import VelocityBanner from '../components/sections/velocity-banner';
import TopCollection from '../components/sections/top-collection';
import SocialProof from '../components/sections/social-proof';
import InstagramCarousel from '../components/sections/instagram-carousel';

export default function HomePage() {
  return (
    <div className="bg-background-base text-foreground-primary">
      <Navbar />
      <HomeHero />
      <VelocityBanner />
      <TopCollection />
      <InstagramCarousel />
      <SocialProof />
      <Footer />
    </div>
  );
}
