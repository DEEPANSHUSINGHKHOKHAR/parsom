import { useEffect, useState } from 'react';
import Navbar from '../components/layout/navbar';
import Footer from '../components/layout/footer';
import HomeHero from '../components/sections/home-hero';
import VelocityBanner from '../components/sections/velocity-banner';
import TopCollection from '../components/sections/top-collection';
import SocialProof from '../components/sections/social-proof';
import InstagramCarousel from '../components/sections/instagram-carousel';
import { useAuthStore } from '../features/auth/auth-store';
import LoginPromptModal from '../features/auth/components/login-prompt-modal';

const LOGIN_PROMPT_DISMISS_KEY = 'parsom-login-prompt-dismissed';

export default function HomePage() {
  const token = useAuthStore((state) => state.token);
  const [isLoginPromptOpen, setIsLoginPromptOpen] = useState(false);

  useEffect(() => {
    if (token) return;

    const wasDismissed = window.sessionStorage.getItem(LOGIN_PROMPT_DISMISS_KEY);
    if (wasDismissed) return;

    const timer = window.setTimeout(() => {
      setIsLoginPromptOpen(true);
    }, 1600);

    return () => window.clearTimeout(timer);
  }, [token]);

  const handleCloseLoginPrompt = () => {
    window.sessionStorage.setItem(LOGIN_PROMPT_DISMISS_KEY, '1');
    setIsLoginPromptOpen(false);
  };

  return (
    <div className="bg-background-base text-foreground-primary">
      <Navbar />
      <HomeHero />
      <VelocityBanner />
      <TopCollection />
      <InstagramCarousel />
      <SocialProof />
      <Footer />
      <LoginPromptModal
        open={!token && isLoginPromptOpen}
        onClose={handleCloseLoginPrompt}
      />
    </div>
  );
}
