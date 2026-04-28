import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';
import { Camera, ExternalLink, Images, Play } from 'lucide-react';
import 'swiper/css';
import { siteConfig } from '../../config/site-config';

const feedItems = [
  {
    type: 'post',
    label: 'Editorial post',
    shortcode: 'DXmpHf1AcKq',
    url: 'https://www.instagram.com/p/DXmpHf1AcKq/',
  },
  {
    type: 'reel',
    label: 'Drop reel',
    shortcode: 'DXlANbGgVuW',
    url: 'https://www.instagram.com/reel/DXlANbGgVuW/',
  },
  {
    type: 'post',
    label: 'Campaign post',
    shortcode: 'DXejjAtAZJx',
    url: 'https://www.instagram.com/p/DXejjAtAZJx/',
  },
  {
    type: 'reel',
    label: 'Fit check',
    shortcode: 'DXbDWmpgQOp',
    url: 'https://www.instagram.com/reel/DXbDWmpgQOp/',
  },
  {
    type: 'post',
    label: 'Community post',
    shortcode: 'DXYUbK1jCmg',
    url: 'https://www.instagram.com/p/DXYUbK1jCmg/',
  },
];

const carouselPosts = [...feedItems, ...feedItems];

function getEmbedUrl(item) {
  const typePath = item.type === 'reel' ? 'reel' : 'p';
  return `https://www.instagram.com/${typePath}/${item.shortcode}/embed`;
}

export default function InstagramCarousel() {
  const instagramUrl = siteConfig.socialLinks.instagram;

  return (
    <section className="bg-background-base py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="mb-4 flex items-center gap-2 text-label text-accent-primary">
              <Camera size={16} />
              Instagram Feed
            </span>
            <h2 className="text-display-3 text-foreground-primary">Posts & Reels</h2>
            <p className="mt-3 text-body-sm text-foreground-secondary">
              Follow the archive moodboard at @parsomattire.
            </p>
          </div>
          <a
            href={instagramUrl}
            target="_blank"
            rel="noreferrer"
            className="text-label text-accent-primary hover:text-foreground-primary"
          >
            View Instagram
          </a>
        </div>

        <Swiper
          modules={[Autoplay]}
          spaceBetween={14}
          slidesPerView={1.08}
          loop
          speed={900}
          autoplay={{
            delay: 2400,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          }}
          breakpoints={{
            640: { slidesPerView: 1.6, spaceBetween: 18 },
            1024: { slidesPerView: 2.8, spaceBetween: 22 },
            1280: { slidesPerView: 3.6, spaceBetween: 24 },
          }}
        >
          {carouselPosts.map((item, index) => (
            <SwiperSlide key={`${item.shortcode}-${index}`}>
              <article className="relative overflow-hidden rounded-[14px] border border-white/10 bg-background-elevated shadow-[0_14px_34px_rgba(0,0,0,0.22)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_48px_rgba(0,0,0,0.26)]">
                <div className="flex items-center justify-between border-b border-white/10 bg-[#111214] px-3 py-2">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-white/8 px-2.5 py-1 text-[0.58rem] font-semibold uppercase tracking-[0.14em] text-foreground-primary">
                    {item.type === 'reel' ? <Play size={10} fill="currentColor" /> : <Images size={10} />}
                    {item.type}
                  </div>
                  <a
                    href={item.url || instagramUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-foreground-muted transition hover:text-accent-primary"
                    aria-label={`Open ${item.label} on Instagram`}
                  >
                    <ExternalLink size={14} />
                  </a>
                </div>

                <iframe
                  src={getEmbedUrl(item)}
                  title={`${item.label} from @parsomattire`}
                  loading="lazy"
                  className="h-[470px] w-full bg-background-base sm:h-[520px]"
                  frameBorder="0"
                  scrolling="no"
                  allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                />
              </article>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}
