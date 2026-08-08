"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

const NAV_LINKS = [
  { name: "Inicio", href: "/" },
  { name: "Servicios", href: "/servicios" },
  { name: "Proyectos", href: "/proyectos" },
  { name: "Noticias", href: "/noticias" },
  { name: "Inversión", href: "/inversion" },
  { name: "Nosotros", href: "/nosotros" },
  { name: "Contacto", href: "/contacto" },
];

export function Navbar() {
  const [scrolled, setScrolled] = React.useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isNewsArticle = pathname.startsWith("/noticias/");

  if (pathname.startsWith("/admin")) {
    return null;
  }

  React.useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Determine text colors based on scroll state and background context
  const hasDarkBg = (isHome || isNewsArticle) && !scrolled;
  const isSolidNav = scrolled;
  
  const textColor = isSolidNav ? "text-white" : (hasDarkBg ? "text-white" : "text-secondary");
  const linkColor = isSolidNav ? "text-white/80 hover:text-accent" : (hasDarkBg ? "text-white/80 hover:text-accent" : "text-secondary/70 hover:text-primary");

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-secondary/90 backdrop-blur-md border-b border-primary/20 py-3 shadow-lg"
          : "bg-transparent py-5"
      )}
    >
      <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center relative z-10">
          <Image 
            src={hasDarkBg || isSolidNav ? "/logo_horizontal_fondo_oscuro.png" : "/logo_horizontal_fondo_claro.png"} 
            alt="Voltac Energy Logo" 
            width={180} 
            height={50} 
            className="h-10 w-auto object-contain transition-all duration-300"
            priority
          />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-8 font-medium">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className={cn(
                "relative text-sm tracking-wide transition-colors after:content-[''] after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-[2px] after:bg-primary after:transition-all after:duration-300 hover:after:w-full",
                pathname === link.href ? (scrolled || hasDarkBg ? "text-accent after:bg-accent after:w-full" : "text-primary after:w-full") : linkColor
              )}
            >
              {link.name}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-4">
          <Link href="/cotizar">
            <Button variant="accent" className="shadow-accent/20 text-secondary border-none hover:scale-105 transition-transform">
              Cotiza tu sistema
            </Button>
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button
          className={cn("lg:hidden relative z-10 p-2 transition-colors", textColor)}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 top-0 left-0 w-full h-screen bg-secondary/95 backdrop-blur-xl flex flex-col items-center justify-center gap-8 lg:hidden z-0">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-2xl font-bold text-white hover:text-accent transition-colors"
              >
                {link.name}
              </Link>
            ))}
            <Link href="/cotizar" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="accent" size="lg" className="mt-8 text-secondary">
                Cotiza tu sistema
              </Button>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
