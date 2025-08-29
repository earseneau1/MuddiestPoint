import { Link, useLocation } from "wouter";
import { HelpCircle, Menu, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function Navigation() {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-card border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3" data-testid="link-home">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <HelpCircle className="text-primary-foreground text-lg" />
            </div>
            <h1 className="text-xl font-serif font-semibold text-foreground">Muddiest Point</h1>
          </Link>
          
          <nav className="hidden md:flex items-center space-x-6">
            <Link 
              href="/" 
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                location === "/" ? "text-primary font-semibold" : "text-foreground hover:text-primary"
              }`}
              data-testid="nav-home"
            >
              Home
            </Link>
            <Link 
              href="/submit" 
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                location === "/submit" ? "text-primary font-semibold" : "text-foreground hover:text-primary"
              }`}
              data-testid="nav-submit"
            >
              Submit Feedback
            </Link>
            <Link 
              href="/professor" 
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                location === "/professor" ? "text-primary font-semibold" : "text-foreground hover:text-primary"
              }`}
              data-testid="nav-professor-dashboard"
            >
              Professor Dashboard
            </Link>
            
            
          </nav>

          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="button-mobile-menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-border pt-4">
            <div className="flex flex-col space-y-2">
              <Link 
                href="/" 
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  location === "/" ? "text-primary font-semibold" : "text-foreground hover:text-primary"
                }`}
                onClick={() => setMobileMenuOpen(false)}
                data-testid="mobile-nav-home"
              >
                Home
              </Link>
              <Link 
                href="/submit" 
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  location === "/submit" ? "text-primary font-semibold" : "text-foreground hover:text-primary"
                }`}
                onClick={() => setMobileMenuOpen(false)}
                data-testid="mobile-nav-submit"
              >
                Submit Feedback
              </Link>
              <Link 
                href="/professor" 
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  location === "/professor" ? "text-primary font-semibold" : "text-foreground hover:text-primary"
                }`}
                onClick={() => setMobileMenuOpen(false)}
                data-testid="mobile-nav-professor-dashboard"
              >
                Professor Dashboard
              </Link>
              
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
