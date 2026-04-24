import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';
import 'swiper/css';

const posts = [
  'https://images.unsplash.com/photo-1771919383240-d0a30993fc38?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
  'https://images.unsplash.com/photo-1735480222193-3fe22ffd70b6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
  'https://images.unsplash.com/photo-1757439402190-99b73ac8e807?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
  'https://images.unsplash.com/photo-1770062422860-92c107ef02cc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&q=80',
];

export default function InstagramCarousel() {
  return (
    <section className="bg-background-base py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-display-3 text-foreground-primary">Captured on Parsom</h2>
            <p className="mt-3 text-body-sm text-foreground-secondary">
              Follow the archive moodboard at `@parsomattire`
            </p>
          </div>
          <a
            href="https://instagram.com/parsomattire"
            target="_blank"
            rel="noreferrer"
            className="text-label text-accent-primary hover:text-foreground-primary"
          >
            View Instagram
          </a>
        </div>

        <Swiper
          modules={[Autoplay]}
          spaceBetween={24}
          slidesPerView={1.2}
          loop
          speed={900}
          autoplay={{
            delay: 2400,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          }}
          breakpoints={{
            640: { slidesPerView: 2.2 },
            1024: { slidesPerView: 3.2 },
            1280: { slidesPerView: 4.2 },
          }}
        >
          {posts.map((post, index) => (
            <SwiperSlide key={index}>
              <div className="group aspect-square overflow-hidden bg-background-elevated">
                <img
                  src={post}
                  alt={`Instagram slide ${index + 1}`}
                  className="h-full w-full object-cover grayscale transition duration-500 group-hover:scale-105 group-hover:grayscale-0"
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}
