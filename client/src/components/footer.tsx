import { Link } from "wouter";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="border-t border-border bg-card/50 mt-auto">
      <div className="container mx-auto px-4 py-6 text-center">
        <Link 
          href="/user-stories"
          className="text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer"
          data-testid="link-copyright"
        >
          © {currentYear} Muddiest Point. All rights reserved.
        </Link>
      </div>
    </footer>
  );
}