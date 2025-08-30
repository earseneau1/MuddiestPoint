import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Search, BookOpen, ArrowRight, Clock, Users, MessageCircle } from "lucide-react";
import type { Course } from "@shared/schema";

export default function CourseSearch() {
  const [courseCode, setCourseCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<Course[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleCourseCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseCode.trim()) return;

    setIsLoading(true);
    setHasSearched(true);
    try {
      const response = await fetch(`/api/courses?code=${encodeURIComponent(courseCode.trim())}`);
      if (!response.ok) {
        throw new Error('Failed to fetch courses');
      }
      const courses = await response.json();
      setSearchResults(courses);
      
      if (courses.length === 0) {
        toast({
          title: "Course not found",
          description: `No course found with code "${courseCode.trim()}". Please check the course code and try again.`,
          variant: "destructive",
        });
      }
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

  const handleCourseSelect = (course: Course) => {
    // Navigate to course timeline/summary page
    setLocation(`/courses/${course.id}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Header */}
      <section className="container mx-auto px-4 py-16 text-center max-w-4xl">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-6 leading-tight">
            Find Your Course
          </h1>
          <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
            Enter your exact course code to access the course feedback system and view previous submissions.
          </p>
        </div>
      </section>

      {/* Course Search */}
      <section className="container mx-auto px-4 pb-16 max-w-4xl">
        <div className="max-w-2xl mx-auto">
          <Card className="bg-card/50 border shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-serif flex items-center gap-2">
                <Search className="h-6 w-6 text-primary" />
                Course Code Search
              </CardTitle>
              <CardDescription>
                Enter the exact course code provided by your professor (e.g., COSC 1337, MATH 2413)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCourseCodeSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="courseCode" className="text-sm font-medium">Course Code</Label>
                  <Input
                    id="courseCode"
                    type="text"
                    placeholder="e.g., COSC 1337"
                    value={courseCode}
                    onChange={(e) => setCourseCode(e.target.value)}
                    disabled={isLoading}
                    className="text-base"
                    data-testid="input-course-code"
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={isLoading || !courseCode.trim()} 
                  className="w-full"
                  size="lg"
                  data-testid="button-search-course"
                >
                  {isLoading ? (
                    <>Searching...</>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Search for Course
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Search Results */}
          {hasSearched && (
            <div className="mt-8">
              {searchResults.length > 0 ? (
                <div className="space-y-4">
                  <h2 className="text-xl font-serif font-semibold text-center">Course Found</h2>
                  {searchResults.map((course) => (
                    <Card key={course.id} className="border-primary/20 hover:border-primary/40 transition-colors">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-start space-x-4">
                            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                              <BookOpen className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                              <h3 className="text-lg font-serif font-semibold">{course.code}</h3>
                              <p className="text-muted-foreground">{course.name}</p>
                              <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                                <div className="flex items-center space-x-1">
                                  <Clock className="h-4 w-4" />
                                  <span>Active Course</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Users className="h-4 w-4" />
                                  <span>Anonymous Feedback</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <Button 
                            onClick={() => handleCourseSelect(course)}
                            className="flex items-center gap-2"
                            data-testid={`button-select-course-${course.id}`}
                          >
                            <MessageCircle className="h-4 w-4" />
                            View Course
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="border-destructive/20">
                  <CardContent className="p-6 text-center">
                    <h3 className="text-lg font-serif font-semibold mb-2">Course Not Found</h3>
                    <p className="text-muted-foreground mb-4">
                      No course found with code "{courseCode}". Please check:
                    </p>
                    <ul className="text-left text-sm text-muted-foreground space-y-1 max-w-md mx-auto">
                      <li>• The course code is spelled correctly</li>
                      <li>• You're using the exact format provided by your professor</li>
                      <li>• The course is currently active for feedback</li>
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Help Section */}
      <section className="bg-card/30 py-16">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h2 className="text-2xl font-serif font-bold mb-4">Need Help Finding Your Course?</h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Course codes are typically provided by your professor and follow a specific format. 
            If you're having trouble, contact your instructor for the correct course code.
          </p>
          <Link href="/">
            <Button variant="outline" size="lg">
              Back to Home
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}