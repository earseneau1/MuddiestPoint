import { Link } from "wouter";
import Navigation from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Shield, 
  MessageCircle, 
  BarChart3, 
  Clock, 
  Users, 
  TrendingUp,
  CheckCircle,
  ArrowRight,
  BookOpen,
  Target,
  Lightbulb
} from "lucide-react";

export default function Home() {

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center max-w-6xl">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-serif font-bold text-foreground mb-6 leading-tight">
            Speak Freely with Your{" "}
            <span className="text-primary">Professor</span>{" "}
            <span className="text-accent">Anonymously</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 leading-relaxed max-w-3xl mx-auto">
            Share your confusion and concerns without fear of judgment. Help your professors understand 
            what's unclear while maintaining complete privacy and anonymity.
          </p>
          
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Link href="/course-search">
              <Button size="lg" className="px-8 py-6 text-lg font-medium" data-testid="button-student-submit">
                <MessageCircle className="h-5 w-5 mr-2" />
                Find My Course & Submit Feedback
              </Button>
            </Link>
            <Link href="/professor">
              <Button variant="outline" size="lg" className="px-8 py-6 text-lg font-medium" data-testid="button-professor-dashboard">
                <BarChart3 className="h-5 w-5 mr-2" />
                View Professor Dashboard
              </Button>
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4 text-primary" />
              <span>100% Anonymous</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-primary" />
              <span>Real-time Insights</span>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-primary" />
              <span>Class-wide Analytics</span>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits for Students */}
      <section className="bg-card/30 py-16">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-serif font-bold mb-4">For Students</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Share your confusion safely and help improve your learning experience
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-serif font-semibold mb-3">Complete Anonymity</h3>
                <p className="text-muted-foreground text-sm">
                  Share your confusion without fear. No names, student IDs, or personal information required.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Target className="h-6 w-6 text-accent" />
                </div>
                <h3 className="text-lg font-serif font-semibold mb-3">Better Learning</h3>
                <p className="text-muted-foreground text-sm">
                  Help professors understand what needs clarification and get the support you need.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-chart-2/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="h-6 w-6 text-chart-2" />
                </div>
                <h3 className="text-lg font-serif font-semibold mb-3">Voice Your Concerns</h3>
                <p className="text-muted-foreground text-sm">
                  Speak up about difficult concepts without the pressure of classroom participation.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits for Professors */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-serif font-bold mb-4">For Professors</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Gain powerful insights to improve teaching effectiveness and student outcomes
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mt-1">
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-serif font-semibold mb-2">Real-time Feedback</h3>
                    <p className="text-muted-foreground text-sm">
                      Receive immediate insights about student confusion throughout the semester, not just at the end.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center mt-1">
                    <BarChart3 className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="text-lg font-serif font-semibold mb-2">Pattern Recognition</h3>
                    <p className="text-muted-foreground text-sm">
                      Identify common confusion points and adjust your teaching approach accordingly.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-chart-3/10 rounded-lg flex items-center justify-center mt-1">
                    <Lightbulb className="h-5 w-5 text-chart-3" />
                  </div>
                  <div>
                    <h3 className="text-lg font-serif font-semibold mb-2">Teaching Insights</h3>
                    <p className="text-muted-foreground text-sm">
                      Get specific suggestions on topics that need more attention or different explanations.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-chart-1/10 rounded-lg flex items-center justify-center mt-1">
                    <BookOpen className="h-5 w-5 text-chart-1" />
                  </div>
                  <div>
                    <h3 className="text-lg font-serif font-semibold mb-2">Course Improvement</h3>
                    <p className="text-muted-foreground text-sm">
                      Continuously improve course content and delivery based on student feedback.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-chart-4/10 rounded-lg flex items-center justify-center mt-1">
                    <Users className="h-5 w-5 text-chart-4" />
                  </div>
                  <div>
                    <h3 className="text-lg font-serif font-semibold mb-2">Student Engagement</h3>
                    <p className="text-muted-foreground text-sm">
                      Encourage more students to participate in feedback without fear of judgment.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-chart-5/10 rounded-lg flex items-center justify-center mt-1">
                    <CheckCircle className="h-5 w-5 text-chart-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-serif font-semibold mb-2">Early Intervention</h3>
                    <p className="text-muted-foreground text-sm">
                      Address learning gaps before they become major obstacles to student success.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-primary/5 py-16">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h2 className="text-3xl font-serif font-bold mb-4">
            Ready to Transform Your Classroom?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join educators and students who are already using Muddiest Point to create 
            more effective and responsive learning environments.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/course-search">
              <Button size="lg" className="px-8 py-6" data-testid="button-get-started-student">
                Find Your Course
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
            <Link href="/professor">
              <Button variant="outline" size="lg" className="px-8 py-6" data-testid="button-get-started-professor">
                Explore Professor Tools
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Privacy Footer */}
      <footer className="border-t bg-card/50 py-12">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <Shield className="h-6 w-6 text-primary" />
              <div>
                <h3 className="font-serif font-semibold">Privacy-First Design</h3>
                <p className="text-sm text-muted-foreground">No personal data collected. Ever.</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-primary transition-colors" data-testid="link-privacy">Privacy Policy</a>
              <a href="#" className="hover:text-primary transition-colors" data-testid="link-how-it-works">How it Works</a>
              <a href="#" className="hover:text-primary transition-colors" data-testid="link-support">Support</a>
              <a href="#" className="hover:text-primary transition-colors" data-testid="link-about">About</a>
              <Link href="/admin" className="hover:text-primary transition-colors flex items-center gap-1" data-testid="link-admin">
                <Shield className="h-3 w-3" />
                Admin
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
