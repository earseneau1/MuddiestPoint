import Navigation from "@/components/navigation";
import ProfessorStats from "@/components/professor-stats";
import RecentSubmissions from "@/components/recent-submissions";
import ConfusionPatterns from "@/components/confusion-patterns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Course } from "@shared/schema";

export default function ProfessorDashboard() {
  const { data: courses = [] } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log("Exporting data...");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <section className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-3xl font-serif font-bold text-foreground mb-2">Professor Dashboard</h2>
              <p className="text-muted-foreground">Track student confusion patterns and improve your teaching effectiveness</p>
            </div>
            
            {/* Course Filter and Export */}
            <div className="flex items-center space-x-3">
              <Select>
                <SelectTrigger className="w-48" data-testid="select-course-filter">
                  <SelectValue placeholder="All Courses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courses</SelectItem>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.code} - {course.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleExport} data-testid="button-export">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </section>

        {/* Stats Overview */}
        <ProfessorStats />

        {/* Recent Submissions and Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <RecentSubmissions />
          <ConfusionPatterns />
        </div>
      </main>
    </div>
  );
}
