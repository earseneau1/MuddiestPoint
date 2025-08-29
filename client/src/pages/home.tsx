import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import Navigation from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
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
  Lightbulb,
  Search,
  Mail,
  Key
} from "lucide-react";

export default function Home() {
  const [courseCode, setCourseCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [anonymousEmail, setAnonymousEmail] = useState("");
  const [isAnonymousVerified, setIsAnonymousVerified] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // Check if user has an anonymous session
  useEffect(() => {
    const token = localStorage.getItem('anonymousToken');
    if (token) {
      setIsAnonymousVerified(true);
    }
  }, []);

  const handleAnonymousVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!anonymousEmail.trim()) return;

    setIsVerifying(true);
    try {
      const response = await fetch('/api/auth/anonymous', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: anonymousEmail }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to verify');
      }

      const data = await response.json();
      
      // Store the anonymous token in localStorage
      localStorage.setItem('anonymousToken', data.token);
      setIsAnonymousVerified(true);
      
      toast({
        title: "Verification Successful",
        description: "You can now submit feedback anonymously. Your identity is protected.",
        className: "bg-green-50 dark:bg-green-950",
      });
      
      setAnonymousEmail("");
    } catch (error: any) {
      toast({
        title: "Verification Failed",
        description: error.message || "Only @tcu.edu email addresses are allowed.",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCourseCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseCode.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/courses?code=${encodeURIComponent(courseCode.trim())}`);
      if (!response.ok) {
        throw new Error('Failed to fetch courses');
      }
      const courses = await response.json();
      
      if (courses.length === 0) {
        toast({
          title: "Course not found",
          description: `No course found with code "${courseCode.trim()}". Please check the course code and try again.`,
          variant: "destructive",
        });
        return;
      }
      
      // Navigate to submit page with the course ID
      setLocation(`/submit?courseId=${courses[0].id}`);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to find course. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center max-w-6xl">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-serif font-bold text-foreground mb-6 leading-tight">
            Bridge the Gap Between{" "}
            <span className="text-primary">Teaching</span> and{" "}
            <span className="text-accent">Learning</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 leading-relaxed max-w-3xl mx-auto">
            Muddiest Point empowers students to share confusion anonymously while giving professors 
            real-time insights to improve teaching effectiveness throughout the semester.
          </p>
          
          {/* Anonymous Verification & Quick Course Access */}
          <div className="grid md:grid-cols-2 gap-4 mb-8 max-w-4xl mx-auto">
            {/* Anonymous Verification */}
            <Card className="bg-card/50 border">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-serif flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Student Verification
                </CardTitle>
                <CardDescription className="text-sm">
                  {isAnonymousVerified 
                    ? "You're verified! Your identity remains anonymous."
                    : "Optional: Verify with TCU email for enhanced features"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isAnonymousVerified ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                      <CheckCircle className="h-5 w-5" />
                      <span className="text-sm font-medium">Anonymously Verified</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Your submissions are completely anonymous. No one can see your identity.
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => {
                        localStorage.removeItem('anonymousToken');
                        setIsAnonymousVerified(false);
                        toast({
                          title: "Session Cleared",
                          description: "Your anonymous session has been removed.",
                        });
                      }}
                    >
                      Clear Session
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleAnonymousVerification} className="space-y-3">
                    <div className="space-y-1">
                      <Label htmlFor="email" className="text-sm">TCU Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="name@tcu.edu"
                        value={anonymousEmail}
                        onChange={(e) => setAnonymousEmail(e.target.value)}
                        disabled={isVerifying}
                        className="text-sm"
                        data-testid="input-anonymous-email"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      disabled={isVerifying || !anonymousEmail.trim()} 
                      className="w-full"
                      size="sm"
                      data-testid="button-verify-anonymous"
                    >
                      {isVerifying ? (
                        <>Verifying...</>
                      ) : (
                        <>
                          <Key className="h-4 w-4 mr-2" />
                          Verify Anonymously
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Your email is hashed immediately. We never store your identity.
                    </p>
                  </form>
                )}
              </CardContent>
            </Card>

            {/* Quick Course Access */}
            <Card className="bg-card/50 border">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-serif flex items-center gap-2">
                  <Search className="h-5 w-5 text-primary" />
                  Quick Course Access
                </CardTitle>
                <CardDescription className="text-sm">
                  Enter your course code to jump directly to feedback submission
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCourseCodeSubmit} className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="e.g., CS101, MATH200"
                    value={courseCode}
                    onChange={(e) => setCourseCode(e.target.value)}
                    className="flex-1"
                    data-testid="input-course-code"
                  />
                  <Button type="submit" disabled={isLoading || !courseCode.trim()} data-testid="button-course-lookup">
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Link href="/submit">
              <Button size="lg" className="px-8 py-6 text-lg font-medium" data-testid="button-student-submit">
                <MessageCircle className="h-5 w-5 mr-2" />
                Submit Feedback as Student
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
            <Link href="/submit">
              <Button size="lg" className="px-8 py-6" data-testid="button-get-started-student">
                Get Started as Student
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
