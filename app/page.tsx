import AIBanner from "@/components/home/AIBanner";
import CategoriesSection from "@/components/home/CategoriesSection";
import HeroSection from "@/components/home/HeroSection";
import NewsLetterSection from "@/components/home/NewsletterSection";

export default function Home() {
  return (
    <>
      <HeroSection />
      <CategoriesSection />
      <AIBanner />
      <NewsLetterSection />
    </>
  );
}