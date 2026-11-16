import Header from "./sections/Header";
import Hero from "./sections/Hero";
import ProblemSolution from "./sections/ProblemSolution";
import HowItWorks from "./sections/HowItWorks";
import AIRecommendation from "./sections/AIRecommendation";
import Features from "./sections/Features";
import TryIt from "./sections/TryIt";
import Assistant from "./sections/Assistant";
import Tour from "./sections/Tour";
import Stories from "./sections/Stories";
import Faq from "./sections/Faq";
import CTA from "./sections/CTA";
import Footer from "./sections/Footer";

export function Welcome() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <ProblemSolution />
        <HowItWorks />
        <AIRecommendation />
        <Features />
        <TryIt />
        <Assistant />
        <Tour />
        <Stories />
        <Faq />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
