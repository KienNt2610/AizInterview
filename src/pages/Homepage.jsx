import HeroSection from '../components/homepage/HeroSection';
import PricingSection from '../components/homepage/PricingSection';
import ValueSection from '../components/homepage/ValueSection';

const Homepage = () => {
  return (
    <div className="w-full">
      <HeroSection />
      <PricingSection />
      <ValueSection />
    </div>
  );
};

export default Homepage;
