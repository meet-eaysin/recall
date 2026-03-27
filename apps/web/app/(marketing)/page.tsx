import HeroSection from '../../features/marketing/components/herosection';
import FAQ from '../../features/marketing/components/faq';
import CtaSection from '../../features/marketing/components/ctasection';
import FeaturesBlock from '../../features/marketing/components/features/features-block';

const LandingPage = () => {
  return (
    <>
      <HeroSection />
      <FeaturesBlock />
      <FAQ />
      <CtaSection />
    </>
  );
};

export default LandingPage;
