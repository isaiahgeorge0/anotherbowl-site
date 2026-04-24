import NavBar from '../components/NavBar';
import MenuSection from '../components/MenuSection';
import Footer from '../components/Footer';

export default function MenuPage() {
  return (
    <div className="min-h-screen scroll-smooth bg-gradient-to-br from-light via-white to-light">
      <NavBar />
      <MenuSection />
      <Footer />
    </div>
  );
}
