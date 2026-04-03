import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Features from './components/Features';
import About from './components/About';
import Pricing from './components/Pricing';
import Testimonial from './components/Testimonial';
import CTA from './components/CTA';
import Footer from './components/Footer';
import { useEffect } from 'react';
import { useLandingContent, DEFAULT_CONTENT } from '../../hooks/useLandingContent';

export default function HomePage() {
  const { content, liveStats, approvedTestimonials, loading } = useLandingContent();

  const c = {
    hero_title: content?.hero_title || DEFAULT_CONTENT.hero_title,
    hero_subtitle: content?.hero_subtitle || DEFAULT_CONTENT.hero_subtitle,
    hero_image_url: content?.hero_image_url || '',
    pricing_basic: content?.pricing_basic || DEFAULT_CONTENT.pricing_basic,
    pricing_pro: content?.pricing_pro || DEFAULT_CONTENT.pricing_pro,
    pricing_enterprise: content?.pricing_enterprise || DEFAULT_CONTENT.pricing_enterprise,
    features: (content?.features && content.features.length > 0) ? content.features : DEFAULT_CONTENT.features,
    testimonials: (content?.testimonials && content.testimonials.length > 0) ? content.testimonials : DEFAULT_CONTENT.testimonials,
  };

  useEffect(() => {
    document.title = 'Go Smart M.I.S - School Management Platform | Rwanda';
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <Hero
        heroTitle={c.hero_title}
        heroSubtitle={c.hero_subtitle}
        heroImageUrl={c.hero_image_url}
        loading={loading}
        liveStats={liveStats}
      />
      <Features features={c.features} loading={loading} />
      <About content={content} liveStats={liveStats} loading={loading} />
      <Pricing
        pricingBasic={c.pricing_basic}
        pricingPro={c.pricing_pro}
        pricingEnterprise={c.pricing_enterprise}
        loading={loading}
      />
      <Testimonial testimonials={c.testimonials} approvedTestimonials={approvedTestimonials} loading={loading} />
      <CTA />
      <Footer />
    </div>
  );
}
