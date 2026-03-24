import HeroSection from './_components/herosection';
import FAQ from './_components/faq';
import Navbar from './_components/navbar-shrink';
import Footer from './_components/footer';
import CtaSection from './_components/ctasection';
import FeaturesBlock from './_components/features/features-block';

const LandingPage = () => {
  return (
    <div className="bg-black">
      <Navbar />
      <HeroSection />
      <FeaturesBlock />
      <FAQ />
      <CtaSection />
      <Footer />
    </div>
  );
};

export default LandingPage;
