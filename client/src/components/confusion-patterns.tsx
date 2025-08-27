import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Lightbulb } from "lucide-react";
import { useState } from "react";
import type { ConfusionPattern } from "@shared/schema";

export default function ConfusionPatterns() {
  const [timeRange, setTimeRange] = useState("7");
  
  const { data: patterns = [], isLoading } = useQuery<ConfusionPattern[]>({
    queryKey: ["/api/analytics/confusion-patterns", timeRange],
    queryFn: () => fetch(`/api/analytics/confusion-patterns?days=${timeRange}`).then(res => res.json()),
  });

  const getCountColor = (count: number, maxCount: number) => {
    const ratio = count / maxCount;
    if (ratio > 0.7) return "text-destructive";
    if (ratio > 0.4) return "text-primary";
    if (ratio > 0.2) return "text-accent";
    return "text-chart-3";
  };

  const maxCount = Math.max(...patterns.map(p => p.count), 1);

  if (isLoading) {
    return (
      <section>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-8 w-32" />
            </div>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-background rounded-lg">
                  <div>
                    <Skeleton className="h-4 w-40 mb-1" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <div className="text-right">
                    <Skeleton className="h-4 w-8 mb-1" />
                    <Skeleton className="h-3 w-16" />
                  </div>
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
            <h3 className="text-lg font-serif font-semibold">Top Confusion Patterns</h3>
            <Select value={timeRange} onValueChange={setTimeRange} data-testid="select-time-range">
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">This Week</SelectItem>
                <SelectItem value="30">This Month</SelectItem>
                <SelectItem value="90">This Semester</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {patterns.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No confusion patterns yet</p>
              <p className="text-sm mt-1">Patterns will emerge as more students submit feedback.</p>
            </div>
          ) : (
            <>
              <div className="space-y-4 mb-6">
                {patterns.map((pattern, index) => (
                  <div
                    key={`${pattern.topic}-${pattern.course}`}
                    className="flex items-center justify-between p-3 bg-background rounded-lg"
                    data-testid={`pattern-${index}`}
                  >
                    <div>
                      <div className="font-medium text-sm text-foreground">
                        {pattern.topic} ({pattern.course})
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {Object.entries(pattern.difficultyDistribution)
                          .filter(([_, count]) => count > 0)
                          .map(([level, count]) => `${count} ${level}`)
                          .join(", ")}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-bold ${getCountColor(pattern.count, maxCount)}`}>
                        {pattern.count}
                      </div>
                      <div className="text-xs text-muted-foreground">submissions</div>
                    </div>
                  </div>
                ))}
              </div>

              {patterns.length > 0 && (
                <div className="p-4 bg-primary/5 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Lightbulb className="text-primary h-4 w-4" />
                    <span className="text-sm font-medium text-foreground">Teaching Suggestion</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {patterns[0] ? 
                      `Consider spending extra time on "${patterns[0].topic}". This topic has the highest confusion rate with ${patterns[0].count} submissions.` :
                      "Keep up the great work! Monitor these patterns to identify areas that need additional attention."
                    }
                  </p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
