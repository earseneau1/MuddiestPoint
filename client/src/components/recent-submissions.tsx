import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import type { SubmissionWithCourse } from "@shared/schema";

export default function RecentSubmissions() {
  const { data: submissions = [], isLoading } = useQuery<SubmissionWithCourse[]>({
    queryKey: ["/api/submissions"],
    select: (data) => data?.slice(0, 10) || [], // Limit to 10 most recent
  });

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case "slightly": return "bg-primary/10 text-primary border-primary/20";
      case "very": return "bg-accent/10 text-accent border-accent/20";
      case "completely": return "bg-destructive/10 text-destructive border-destructive/20";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getDifficultyLabel = (level: string) => {
    switch (level) {
      case "slightly": return "Slightly Confused";
      case "very": return "Very Confused";
      case "completely": return "Completely Lost";
      default: return level;
    }
  };

  const getBorderColor = (level: string) => {
    switch (level) {
      case "slightly": return "border-primary";
      case "very": return "border-accent";
      case "completely": return "border-destructive";
      default: return "border-muted";
    }
  };

  if (isLoading) {
    return (
      <section>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-16" />
            </div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="border-l-4 border-muted pl-4 py-3 bg-muted/20 rounded-r-lg">
                  <div className="flex items-center justify-between mb-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-12 w-full mb-2" />
                  <Skeleton className="h-5 w-24" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section>
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-serif font-semibold">Recent Submissions</h3>
            <Button variant="ghost" size="sm" data-testid="button-view-all-submissions">
              View All
            </Button>
          </div>

          {submissions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No submissions yet</p>
              <p className="text-sm mt-1">Submissions will appear here once students start sharing their confusion points.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {submissions.map((submission) => (
                <div
                  key={submission.id}
                  className={`border-l-4 ${getBorderColor(submission.difficultyLevel)} pl-4 py-3 bg-muted/20 rounded-r-lg`}
                  data-testid={`submission-${submission.id}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">
                      {submission.course.code}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(submission.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <div className="text-sm text-foreground mb-2">
                    <span className="font-medium">Topic:</span> {submission.topic}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-2">
                    "{submission.confusion}"
                  </p>
                  <Badge 
                    variant="secondary" 
                    className={getDifficultyColor(submission.difficultyLevel)}
                    data-testid={`badge-difficulty-${submission.difficultyLevel}`}
                  >
                    {getDifficultyLabel(submission.difficultyLevel)}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
