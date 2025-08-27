import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { MessageCircle, Send, Shield, Wand2 } from "lucide-react";
import type { Course, InsertSubmission } from "@shared/schema";

const submissionSchema = z.object({
  courseId: z.string().min(1, "Please select a course"),
  topic: z.string().min(1, "Please enter a topic").max(255, "Topic is too long"),
  confusion: z.string().min(10, "Please describe your confusion in more detail").max(2000, "Description is too long"),
  difficultyLevel: z.enum(["slightly", "very", "completely"], {
    required_error: "Please select how confused you are",
  }),
  createMagicLink: z.boolean().default(false),
});

type SubmissionData = z.infer<typeof submissionSchema>;

interface StudentSubmissionFormProps {
  preselectedCourseId?: string | null;
}

export default function StudentSubmissionForm({ preselectedCourseId }: StudentSubmissionFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: courses = [], isLoading: coursesLoading } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  const form = useForm<SubmissionData>({
    resolver: zodResolver(submissionSchema),
    defaultValues: {
      courseId: "",
      topic: "",
      confusion: "",
      difficultyLevel: undefined,
      createMagicLink: false,
    },
  });

  // Pre-select course if courseId is provided via URL
  useEffect(() => {
    if (preselectedCourseId && courses.length > 0) {
      const courseExists = courses.find(course => course.id === preselectedCourseId);
      if (courseExists) {
        form.setValue('courseId', preselectedCourseId);
      }
    }
  }, [preselectedCourseId, courses, form]);

  const submitMutation = useMutation({
    mutationFn: async (data: SubmissionData) => {
      let magicLinkId: string | undefined;
      
      // Create magic link if requested
      if (data.createMagicLink) {
        const magicLinkResponse = await apiRequest("POST", "/api/magic-links", {
          token: "", // Will be generated on server
        });
        const magicLinkData = await magicLinkResponse.json();
        magicLinkId = magicLinkData.id;
        
        // Show magic link to user
        toast({
          title: "Magic Link Created",
          description: "Check your browser for your tracking link (in a real app, this would be emailed to you)",
          duration: 10000,
        });
      }

      // Create submission
      const submissionData: InsertSubmission = {
        courseId: data.courseId,
        topic: data.topic,
        confusion: data.confusion,
        difficultyLevel: data.difficultyLevel,
        magicLinkId,
      };

      return await apiRequest("POST", "/api/submissions", submissionData);
    },
    onSuccess: () => {
      toast({
        title: "Submission Sent!",
        description: "Thank you for your feedback. Your submission has been sent anonymously.",
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/submissions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
    },
    onError: (error) => {
      toast({
        title: "Submission Failed",
        description: "Please try again. If the problem persists, contact support.",
        variant: "destructive",
      });
      console.error("Submission error:", error);
    },
  });

  return (
    <Card>
      <CardContent className="p-8">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <MessageCircle className="text-primary h-5 w-5" />
          </div>
          <div>
            <h3 className="text-xl font-serif font-semibold">Submit Your Muddiest Point</h3>
            <p className="text-sm text-muted-foreground">What's confusing you right now?</p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => submitMutation.mutate(data))} className="space-y-6">
            {/* Course Selection */}
            <FormField
              control={form.control}
              name="courseId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Course</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} data-testid="select-course">
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your course..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {coursesLoading ? (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">Loading courses...</div>
                      ) : courses.length === 0 ? (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">No courses available</div>
                      ) : (
                        courses.map((course) => (
                          <SelectItem key={course.id} value={course.id}>
                            {course.code} - {course.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Topic/Chapter */}
            <FormField
              control={form.control}
              name="topic"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Topic or Chapter</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g., Loops, Integration by Parts, Newton's Laws..."
                      className="font-mono"
                      data-testid="input-topic"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Confusion Description */}
            <FormField
              control={form.control}
              name="confusion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>What's confusing you?</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={5}
                      placeholder="Describe what you're struggling with. Be as specific as possible - this helps your professor understand exactly where you need help."
                      className="font-mono resize-none"
                      data-testid="textarea-confusion"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Difficulty Level */}
            <FormField
              control={form.control}
              name="difficultyLevel"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>How confused are you?</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="flex flex-col space-y-2"
                      data-testid="radio-difficulty"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="slightly" id="slightly" />
                        <Label htmlFor="slightly">Slightly confused</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="very" id="very" />
                        <Label htmlFor="very">Very confused</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="completely" id="completely" />
                        <Label htmlFor="completely">Completely lost</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Optional Magic Link */}
            <div className="bg-muted rounded-lg p-4 border-l-4 border-accent">
              <div className="flex items-start space-x-3">
                <Wand2 className="text-accent mt-1 h-4 w-4" />
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-foreground mb-1">Optional: Track Your Submissions</h4>
                  <p className="text-xs text-muted-foreground mb-3">
                    Get a magic link to privately view your submission history. No signup required.
                  </p>
                  <FormField
                    control={form.control}
                    name="createMagicLink"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="checkbox-magic-link"
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-normal">
                          Send me a tracking link
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={submitMutation.isPending}
              data-testid="button-submit"
            >
              {submitMutation.isPending ? (
                "Submitting..."
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit Anonymously
                </>
              )}
            </Button>
          </form>
        </Form>

        {/* Privacy Reminder */}
        <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
          <div className="flex items-center space-x-2 text-sm text-primary">
            <Shield className="h-4 w-4" />
            <span className="font-medium">Privacy Guarantee:</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Your submission is completely anonymous. We don't collect names, student IDs, or any identifying information.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
