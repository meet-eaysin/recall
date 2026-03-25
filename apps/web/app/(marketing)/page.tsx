import HeroSection from './_components/herosection';
import FAQ from './_components/faq';
import CtaSection from './_components/ctasection';
import FeaturesBlock from './_components/features/features-block';

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
