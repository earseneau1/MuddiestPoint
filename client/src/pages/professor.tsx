import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertCourseSchema } from "@shared/schema";
import type { Course, ClassSession } from "@shared/schema";
import { Plus, Copy, QrCode, Calendar, Clock, Trash2, Edit3, BookOpen, Link as LinkIcon } from "lucide-react";
import { z } from "zod";
import QRCode from "qrcode";

const courseFormSchema = insertCourseSchema;
type CourseFormData = z.infer<typeof courseFormSchema>;

export default function ProfessorDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [showQrCode, setShowQrCode] = useState(false);

  const { data: courses = [], isLoading: coursesLoading } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  const form = useForm<CourseFormData>({
    resolver: zodResolver(courseFormSchema),
    defaultValues: {
      name: "",
      code: "",
    },
  });

  const createCourseMutation = useMutation({
    mutationFn: async (data: CourseFormData) => {
      return await apiRequest(`/api/courses`, "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      form.reset();
      toast({
        title: "Success",
        description: "Course created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create course",
        variant: "destructive",
      });
    },
  });

  const updateCourseMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CourseFormData> }) => {
      return await apiRequest(`/api/courses/${id}`, "PUT", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      setEditingCourse(null);
      form.reset();
      toast({
        title: "Success",
        description: "Course updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update course",
        variant: "destructive",
      });
    },
  });

  const deleteCourseMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/courses/${id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      toast({
        title: "Success",
        description: "Course deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete course",
        variant: "destructive",
      });
    },
  });

  const createSessionMutation = useMutation({
    mutationFn: async (courseId: string): Promise<ClassSession> => {
      return await apiRequest(`/api/courses/${courseId}/sessions`, "POST", {});
    },
    onSuccess: (session: ClassSession) => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      toast({
        title: "Success",
        description: "Today's class link created successfully",
      });
      
      // Generate QR code
      const classUrl = `${window.location.origin}/class/${session.accessToken}`;
      generateQrCode(classUrl);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create class session",
        variant: "destructive",
      });
    },
  });

  const generateQrCode = async (url: string) => {
    try {
      const qrCode = await QRCode.toDataURL(url, {
        width: 300,
        margin: 2,
      });
      setQrDataUrl(qrCode);
      setShowQrCode(true);
    } catch (error) {
      console.error("Failed to generate QR code:", error);
    }
  };

  const onSubmit = async (data: CourseFormData) => {
    if (editingCourse) {
      updateCourseMutation.mutate({ id: editingCourse.id, data });
    } else {
      createCourseMutation.mutate(data);
    }
  };

  const startEditing = (course: Course) => {
    setEditingCourse(course);
    form.setValue("name", course.name);
    form.setValue("code", course.code);
  };

  const cancelEditing = () => {
    setEditingCourse(null);
    form.reset();
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: "Link copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString();
  };

  const isToday = (date: string) => {
    const today = new Date().toDateString();
    return new Date(date).toDateString() === today;
  };

  if (coursesLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-[#2d5a3d]">Professor Dashboard</h1>
        <p className="text-lg text-gray-600">Manage your courses and create daily feedback links</p>
      </div>

      {/* Course Creation/Editing Form */}
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            {editingCourse ? "Edit Course" : "Create New Course"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., Introduction to Computer Science" 
                        data-testid="input-course-name"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course Code</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., CS101" 
                        data-testid="input-course-code"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex gap-2">
                <Button 
                  type="submit" 
                  className="bg-[#2d5a3d] hover:bg-[#1f3f2a]"
                  disabled={createCourseMutation.isPending || updateCourseMutation.isPending}
                  data-testid="button-save-course"
                >
                  {editingCourse ? (
                    <>
                      <Edit3 className="h-4 w-4 mr-2" />
                      Update Course
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Course
                    </>
                  )}
                </Button>
                {editingCourse && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={cancelEditing}
                    data-testid="button-cancel-edit"
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Courses List */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-[#2d5a3d]">Your Courses</h2>
        {courses.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <BookOpen className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">No courses yet. Create your first course above!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                onEdit={startEditing}
                onDelete={(id) => deleteCourseMutation.mutate(id)}
                onCreateSession={() => createSessionMutation.mutate(course.id)}
                onCopyLink={copyToClipboard}
                isCreatingSession={createSessionMutation.isPending}
              />
            ))}
          </div>
        )}
      </div>

      {/* QR Code Modal */}
      {showQrCode && qrDataUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="max-w-md mx-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                Class QR Code
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <img src={qrDataUrl} alt="QR Code" className="mx-auto" />
              <p className="text-sm text-gray-600">
                Students can scan this QR code to quickly submit feedback for today's class
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={() => setShowQrCode(false)}
                  variant="outline"
                  className="flex-1"
                  data-testid="button-close-qr"
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    const link = document.createElement('a');
                    link.download = 'class-qr-code.png';
                    link.href = qrDataUrl;
                    link.click();
                  }}
                  className="flex-1 bg-[#2d5a3d] hover:bg-[#1f3f2a]"
                  data-testid="button-download-qr"
                >
                  Download
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

interface CourseCardProps {
  course: Course;
  onEdit: (course: Course) => void;
  onDelete: (id: string) => void;
  onCreateSession: () => void;
  onCopyLink: (link: string) => void;
  isCreatingSession: boolean;
}

function CourseCard({ course, onEdit, onDelete, onCreateSession, onCopyLink, isCreatingSession }: CourseCardProps) {
  const { data: activeSession } = useQuery<ClassSession | null>({
    queryKey: ["/api/courses", course.id, "active-session"],
  });

  const isToday = (date: string) => {
    const today = new Date().toDateString();
    return new Date(date).toDateString() === today;
  };

  const todaySessionLink = activeSession && isToday(activeSession.sessionDate.toString()) 
    ? `${window.location.origin}/class/${activeSession.accessToken}`
    : null;

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{course.name}</CardTitle>
            <Badge variant="secondary" className="mt-1">{course.code}</Badge>
          </div>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onEdit(course)}
              data-testid={`button-edit-${course.id}`}
            >
              <Edit3 className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDelete(course.id)}
              data-testid={`button-delete-${course.id}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Today's Session Status */}
        {activeSession && isToday(activeSession.sessionDate.toString()) ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-green-600">
              <Calendar className="h-4 w-4" />
              <span className="text-sm font-medium">Today's session active</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              <span>Expires at {formatTime(activeSession.expiresAt.toString())}</span>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => todaySessionLink && onCopyLink(todaySessionLink)}
                className="flex-1"
                data-testid={`button-copy-link-${course.id}`}
              >
                <Copy className="h-4 w-4 mr-1" />
                Copy Link
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (todaySessionLink) {
                    import("qrcode").then(QRCode => {
                      QRCode.toDataURL(todaySessionLink).then(dataUrl => {
                        const link = document.createElement('a');
                        link.download = `${course.code}-qr-code.png`;
                        link.href = dataUrl;
                        link.click();
                      });
                    });
                  }
                }}
                className="flex-1"
                data-testid={`button-qr-${course.id}`}
              >
                <QrCode className="h-4 w-4 mr-1" />
                QR Code
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-gray-600">No active session for today</p>
            <Button
              onClick={onCreateSession}
              disabled={isCreatingSession}
              className="w-full bg-[#2d5a3d] hover:bg-[#1f3f2a]"
              data-testid={`button-create-session-${course.id}`}
            >
              <LinkIcon className="h-4 w-4 mr-2" />
              Create Today's Link
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}