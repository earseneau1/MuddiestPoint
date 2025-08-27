import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle, BookOpen, AlertTriangle, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface StatsData {
  totalSubmissions: number;
  activeCourses: number;
  recentSubmissions: number;
}

export default function ProfessorStats() {
  const { data: stats, isLoading } = useQuery<StatsData>({
    queryKey: ["/api/analytics/stats"],
  });

  if (isLoading) {
    return (
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-8 w-12" />
                </div>
                <Skeleton className="h-12 w-12 rounded-lg" />
              </div>
              <Skeleton className="h-3 w-16 mt-3" />
            </CardContent>
          </Card>
        ))}
      </section>
    );
  }

  if (!stats) {
    return (
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground">
              <p>Unable to load statistics</p>
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }

  const statCards = [
    {
      title: "Total Submissions",
      value: stats.totalSubmissions,
      change: `+${stats.recentSubmissions}`,
      changeLabel: "from last week",
      icon: MessageCircle,
      bgColor: "bg-primary/10",
      iconColor: "text-primary",
      changeColor: "text-primary",
      testId: "stat-total-submissions"
    },
    {
      title: "Active Courses",
      value: stats.activeCourses,
      change: "",
      changeLabel: stats.activeCourses > 0 ? "All courses active" : "No active courses",
      icon: BookOpen,
      bgColor: "bg-accent/10",
      iconColor: "text-accent",
      changeColor: "text-muted-foreground",
      testId: "stat-active-courses"
    },
    {
      title: "Recent Activity",
      value: stats.recentSubmissions,
      change: "",
      changeLabel: "submissions this week",
      icon: Clock,
      bgColor: "bg-chart-2/10",
      iconColor: "text-chart-2",
      changeColor: "text-chart-2",
      testId: "stat-recent-activity"
    },
    {
      title: "Response Needed",
      value: Math.ceil(stats.totalSubmissions * 0.8), // Estimate of unaddressed submissions
      change: "",
      changeLabel: "pending review",
      icon: AlertTriangle,
      bgColor: "bg-destructive/10",
      iconColor: "text-destructive",
      changeColor: "text-destructive",
      testId: "stat-response-needed"
    },
  ];

  return (
    <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statCards.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold text-foreground" data-testid={stat.testId}>
                    {stat.value}
                  </p>
                </div>
                <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                  <Icon className={`${stat.iconColor} text-lg h-5 w-5`} />
                </div>
              </div>
              <div className="mt-3 text-xs text-muted-foreground">
                {stat.change && <span className={stat.changeColor}>{stat.change}</span>} {stat.changeLabel}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}
