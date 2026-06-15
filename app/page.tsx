import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import Templates from "@/components/Templates";
import Testimonials from "@/components/Testimonials";
import PurchaseCTA from "@/components/PurchaseCTA";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main id="main">
        <Hero />
        <HowItWorks />
        <Templates />
        <Testimonials />
        <PurchaseCTA />
      </main>
      <Footer />
    </>
  );
}
