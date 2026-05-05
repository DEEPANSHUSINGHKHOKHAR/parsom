import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
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
const HOME_INTRO_LAST_SEEN_KEY = 'parsom-home-intro-last-seen';
const HOME_INTRO_COOLDOWN_MS = 5 * 60 * 1000;
const introFrames = [
  { key: 'namaste', text: 'नमस्ते', className: 'font-display text-[clamp(4rem,12vw,9rem)] leading-none text-[#f7ead7]' },
  { key: 'hello', text: 'Hello', className: 'font-display text-[clamp(4rem,12vw,9rem)] leading-none text-[#f7ead7]' },
  { key: 'welcome', text: 'Welcome to Parsom Attire', className: 'text-display-3 text-foreground-primary sm:text-display-2' },
];

export default function HomePage() {
  const token = useAuthStore((state) => state.token);
  const [isIntroVisible, setIsIntroVisible] = useState(() => {
    const lastSeen = Number(window.localStorage.getItem(HOME_INTRO_LAST_SEEN_KEY) || 0);
    return Date.now() - lastSeen > HOME_INTRO_COOLDOWN_MS;
  });
  const [introFrame, setIntroFrame] = useState(0);
  const [isLoginPromptOpen, setIsLoginPromptOpen] = useState(false);

  useEffect(() => {
    if (!isIntroVisible) return undefined;

    window.localStorage.setItem(HOME_INTRO_LAST_SEEN_KEY, String(Date.now()));

    const frameTimers = introFrames.slice(1).map((_, index) => (
      window.setTimeout(() => {
        setIntroFrame(index + 1);
      }, 900 * (index + 1))
    ));
    const closeTimer = window.setTimeout(() => {
      setIsIntroVisible(false);
    }, 3100);

    return () => {
      frameTimers.forEach((timer) => window.clearTimeout(timer));
      window.clearTimeout(closeTimer);
    };
  }, [isIntroVisible]);

  useEffect(() => {
    if (token || isIntroVisible) return;

    const wasDismissed = window.sessionStorage.getItem(LOGIN_PROMPT_DISMISS_KEY);
    if (wasDismissed) return;

    const timer = window.setTimeout(() => {
      setIsLoginPromptOpen(true);
    }, 1600);

    return () => window.clearTimeout(timer);
  }, [token, isIntroVisible]);

  const handleCloseLoginPrompt = () => {
    window.sessionStorage.setItem(LOGIN_PROMPT_DISMISS_KEY, '1');
    setIsLoginPromptOpen(false);
  };

  return (
    <div className="bg-background-base text-foreground-primary">
      <AnimatePresence>
        {isIntroVisible ? (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.55, ease: 'easeInOut' }}
            className="fixed inset-0 z-[100] grid place-items-center overflow-hidden bg-[#0c0b09]"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(183,127,74,0.34),transparent_34%),linear-gradient(135deg,rgba(255,246,232,0.12),transparent_42%)]" />
            <motion.div
              initial={{ opacity: 0, y: 22, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="relative mx-6 grid min-h-[180px] max-w-4xl place-items-center text-center"
            >
              <AnimatePresence mode="wait">
                <motion.p
                  key={introFrames[introFrame].key}
                  initial={{ opacity: 0, y: 18, filter: 'blur(10px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -18, filter: 'blur(10px)' }}
                  transition={{ duration: 0.45, ease: 'easeInOut' }}
                  className={introFrames[introFrame].className}
                >
                  {introFrames[introFrame].text}
                </motion.p>
              </AnimatePresence>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
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
