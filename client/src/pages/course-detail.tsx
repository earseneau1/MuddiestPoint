import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import Navigation from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { 
  BookOpen, 
  MessageCircle, 
  Clock, 
  Calendar,
  TrendingUp,
  Users,
  ArrowRight,
  Plus,
  BarChart3
} from "lucide-react";
import type { Course, SubmissionWithCourse } from "@shared/schema";

export default function CourseDetail() {
  const { id } = useParams<{ id: string }>();

  // Fetch course details
  const { data: course, isLoading: courseLoading } = useQuery<Course>({
    queryKey: ["/api/courses", id],
    queryFn: async () => {
      const response = await fetch(`/api/courses/${id}`);
      if (!response.ok) throw new Error('Course not found');
      return response.json();
    },
    enabled: !!id,
  });

  // Fetch course submissions for timeline
  const { data: submissions = [], isLoading: submissionsLoading } = useQuery<SubmissionWithCourse[]>({
    queryKey: ["/api/submissions", id],
    queryFn: async () => {
      const response = await fetch(`/api/submissions?courseId=${id}`);
      if (!response.ok) throw new Error('Failed to fetch submissions');
      return response.json();
    },
    enabled: !!id,
  });

  // Check if student can submit feedback today
  const canSubmitToday = (() => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    
    // Basic logic: Most classes are Monday-Friday (1-5)
    // Weekend days (Saturday=6, Sunday=0) typically don't have classes
    return dayOfWeek >= 1 && dayOfWeek <= 5;
  })();

  if (courseLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading course details...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Course Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The course you're looking for doesn't exist or may have been removed.
          </p>
          <Link href="/course-search">
            <Button>Search for Another Course</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Course Header */}
      <section className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-start space-x-4">
            <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center">
              <BookOpen className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-serif font-bold mb-2">{course.code}</h1>
              <p className="text-xl text-muted-foreground mb-4">{course.name}</p>
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Users className="h-4 w-4" />
                  <span>{submissions.length} total submissions</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>Active course</span>
                </div>
              </div>
            </div>
          </div>
          
          {canSubmitToday ? (
            <Link href={`/class-session?courseId=${course.id}&sessionId=${new Date().toISOString().split('T')[0]}`}>
              <Button size="lg" className="flex items-center gap-2" data-testid="button-submit-feedback">
                <Plus className="h-4 w-4" />
                Submit Feedback Today
              </Button>
            </Link>
          ) : (
            <Button size="lg" disabled className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              No Class Today
            </Button>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Course Statistics */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Course Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Feedback</span>
                  <Badge variant="secondary">{submissions.length}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Recent Activity</span>
                  <Badge variant="outline">
                    {submissions.filter((s: SubmissionWithCourse) => {
                      const submissionDate = new Date(s.createdAt);
                      const weekAgo = new Date();
                      weekAgo.setDate(weekAgo.getDate() - 7);
                      return submissionDate > weekAgo;
                    }).length} this week
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Course Status</span>
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Today's Feedback</CardTitle>
              </CardHeader>
              <CardContent>
                {canSubmitToday ? (
                  <div className="text-center">
                    <MessageCircle className="h-8 w-8 text-primary mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground mb-4">
                      Class is scheduled today. Share any confusion or questions anonymously.
                    </p>
                    <Link href={`/class-session?courseId=${course.id}&sessionId=${new Date().toISOString().split('T')[0]}`}>
                      <Button className="w-full">
                        Submit Anonymous Feedback
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="text-center">
                    <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">
                      No class scheduled today. Check back on your next class day to submit feedback.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Submissions Timeline */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Recent Feedback Timeline
                  </div>
                  {submissions.length > 0 && (
                    <Badge variant="outline">{submissions.length} submissions</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {submissionsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-sm text-muted-foreground">Loading submissions...</p>
                  </div>
                ) : submissions.length > 0 ? (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {submissions
                      .sort((a: SubmissionWithCourse, b: SubmissionWithCourse) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .map((submission: SubmissionWithCourse, index: number) => (
                        <div key={submission.id} className="border rounded-lg p-4 bg-card/50">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline" className="text-xs">
                                {submission.difficultyLevel}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {new Date(submission.createdAt).toLocaleDateString()} at{' '}
                                {new Date(submission.createdAt).toLocaleTimeString([], { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </span>
                            </div>
                          </div>
                          <h4 className="font-medium text-sm mb-1">{submission.topic}</h4>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {submission.confusion}
                          </p>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Feedback Yet</h3>
                    <p className="text-muted-foreground text-sm mb-4">
                      Be the first to submit anonymous feedback for this course.
                    </p>
                    {canSubmitToday && (
                      <Link href={`/class-session?courseId=${course.id}&sessionId=${new Date().toISOString().split('T')[0]}`}>
                        <Button>
                          Submit First Feedback
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </Link>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}