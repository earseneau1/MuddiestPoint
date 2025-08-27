import Navigation from "@/components/navigation";
import StudentSubmissionForm from "@/components/student-submission-form";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, KeyRound, Lock, Heart } from "lucide-react";

export default function Submit() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Hero Section */}
        <section className="text-center mb-12">
          <h2 className="text-4xl font-serif font-bold text-foreground mb-4">
            Share Your Learning Challenges{" "}
            <span className="text-accent">Anonymously</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Help your professors understand what concepts are causing confusion. Your feedback is completely anonymous and helps improve teaching for everyone.
          </p>
          
          {/* Privacy Indicators */}
          <div className="flex flex-wrap justify-center gap-4 mt-6">
            <div className="flex items-center space-x-2 bg-card px-4 py-2 rounded-lg" data-testid="privacy-indicator-anonymous">
              <KeyRound className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">100% Anonymous</span>
            </div>
            <div className="flex items-center space-x-2 bg-card px-4 py-2 rounded-lg" data-testid="privacy-indicator-no-data">
              <Lock className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">No Personal Data</span>
            </div>
            <div className="flex items-center space-x-2 bg-card px-4 py-2 rounded-lg" data-testid="privacy-indicator-safe">
              <Heart className="h-4 w-4 text-accent" />
              <span className="text-sm font-medium">Safe Space</span>
            </div>
          </div>
        </section>

        {/* Submission Form */}
        <section className="max-w-2xl mx-auto">
          <StudentSubmissionForm />
        </section>

        {/* Privacy Footer */}
        <footer className="mt-16 text-center">
          <Card>
            <CardContent className="p-8">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <Shield className="h-8 w-8 text-primary" />
                <h3 className="text-xl font-serif font-semibold">Privacy-First Learning</h3>
              </div>
              <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Muddiest Point is designed with student privacy at its core. We never collect personal information, 
                and all submissions are completely anonymous. Your feedback helps create better learning experiences 
                while keeping your identity safe.
              </p>
              <div className="flex flex-wrap justify-center gap-6 mt-6 text-sm text-muted-foreground">
                <a href="#" className="hover:text-primary transition-colors" data-testid="link-privacy">Privacy Policy</a>
                <a href="#" className="hover:text-primary transition-colors" data-testid="link-how-it-works">How it Works</a>
                <a href="#" className="hover:text-primary transition-colors" data-testid="link-support">Support</a>
                <a href="#" className="hover:text-primary transition-colors" data-testid="link-about">About</a>
              </div>
            </CardContent>
          </Card>
        </footer>
      </main>
    </div>
  );
}