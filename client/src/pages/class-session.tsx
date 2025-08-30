import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertSubmissionSchema } from "@shared/schema";
import type { Course } from "@shared/schema";
import { 
  MessageCircle, 
  Send, 
  Shield, 
  Wand2, 
  Lightbulb, 
  RefreshCw, 
  Sparkles,
  BookOpen,
  Clock,
  Users,
  Edit3,
  RotateCcw
} from "lucide-react";
import { z } from "zod";

type SubmissionData = z.infer<typeof insertSubmissionSchema>;

export default function ClassSession() {
  const [location] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const [isImprovingText, setIsImprovingText] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<string>("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentSubmissionId, setCurrentSubmissionId] = useState<string | null>(null);

  // Get courseId and sessionId from URL params
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const finalCourseId = urlParams.get('courseId');
  const sessionId = urlParams.get('sessionId');

  const { data: courses = [], isLoading: coursesLoading } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  // Query for existing submission when in edit mode
  const { data: existingSubmission, isLoading: submissionLoading } = useQuery({
    queryKey: ["/api/submissions", currentSubmissionId],
    queryFn: async () => {
      if (!currentSubmissionId) return null;
      return await apiRequest(`/api/submissions/${currentSubmissionId}`, 'GET');
    },
    enabled: !!currentSubmissionId,
  });

  const selectedCourse = courses.find(course => course.id === finalCourseId);

  const form = useForm<SubmissionData>({
    resolver: zodResolver(insertSubmissionSchema),
    defaultValues: {
      courseId: "",
      sessionId: "",
      topic: "",
      confusion: "",
      difficultyLevel: undefined,
    },
  });

  // Pre-select course and session if provided, and check for existing submission
  useEffect(() => {
    if (finalCourseId && courses.length > 0) {
      const courseExists = courses.find(course => course.id === finalCourseId);
      if (courseExists) {
        form.setValue('courseId', finalCourseId);
      }
    }
    if (sessionId) {
      form.setValue('sessionId', sessionId);
      
      // Check if there's an existing submission for this session
      const storageKey = `submission_${sessionId}`;
      const existingSubmissionId = sessionStorage.getItem(storageKey);
      if (existingSubmissionId) {
        setCurrentSubmissionId(existingSubmissionId);
        // We'll load the submission data in a separate effect
      }
    }
  }, [finalCourseId, sessionId, courses, form]);

  // Load existing submission data into form when available
  useEffect(() => {
    if (existingSubmission && !submissionLoading) {
      form.setValue('topic', existingSubmission.topic);
      form.setValue('confusion', existingSubmission.confusion);
      form.setValue('difficultyLevel', existingSubmission.difficultyLevel);
      setIsEditMode(true);
    }
  }, [existingSubmission, submissionLoading, form]);

  const generateSuggestionsMutation = useMutation({
    mutationFn: async ({ topic, difficultyLevel }: { topic: string; difficultyLevel: string }): Promise<{ suggestions: string[] }> => {
      return await apiRequest('/api/ai/feedback-suggestions', 'POST', {
        topic,
        confusionLevel: difficultyLevel,
      });
    },
    onSuccess: (data) => {
      setAiSuggestions(data.suggestions || []);
      setIsGeneratingSuggestions(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate AI suggestions",
        variant: "destructive",
      });
      setIsGeneratingSuggestions(false);
    },
  });

  const improveFeedbackMutation = useMutation({
    mutationFn: async ({ text, topic }: { text: string; topic: string }): Promise<{ improvedText: string }> => {
      return await apiRequest('/api/ai/improve-feedback', 'POST', {
        text,
        topic,
      });
    },
    onSuccess: (data) => {
      form.setValue('confusion', data.improvedText || '');
      setIsImprovingText(false);
      toast({
        title: "Feedback Improved!",
        description: "AI has enhanced your feedback to be more helpful",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to improve feedback",
        variant: "destructive",
      });
      setIsImprovingText(false);
    },
  });

  // Update mutation for editing existing submissions
  const updateMutation = useMutation({
    mutationFn: async (data: Partial<Pick<SubmissionData, 'topic' | 'confusion' | 'difficultyLevel'>>) => {
      if (!currentSubmissionId) {
        throw new Error("No submission ID for update");
      }
      return await apiRequest(`/api/submissions/${currentSubmissionId}`, 'PUT', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/submissions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/submissions", currentSubmissionId] });
      setAiSuggestions([]);
      setSelectedSuggestion("");
      toast({
        title: "Updated!",
        description: "Your feedback has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to update feedback",
        variant: "destructive",
      });
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: SubmissionData) => {
      // Validate that sessionId is present
      if (!data.sessionId) {
        throw new Error("Session ID is required for submission");
      }
      
      if (isEditMode && currentSubmissionId) {
        // Update existing submission
        return await updateMutation.mutateAsync({
          topic: data.topic,
          confusion: data.confusion,
          difficultyLevel: data.difficultyLevel,
        });
      } else {
        // Create new submission
        return await apiRequest('/api/submissions', 'POST', data);
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/submissions"] });
      
      if (!isEditMode) {
        // Store submission ID in sessionStorage for editing capability (only for new submissions)
        if (data?.id && sessionId) {
          const storageKey = `submission_${sessionId}`;
          sessionStorage.setItem(storageKey, data.id);
          setCurrentSubmissionId(data.id);
          setIsEditMode(true);
        }
        
        toast({
          title: "Success!",
          description: "Your feedback has been submitted! You can edit it anytime while you stay on this page.",
        });
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit feedback",
        variant: "destructive",
      });
    },
  });

  const handleGenerateSuggestions = () => {
    const topic = form.getValues('topic');
    const difficultyLevel = form.getValues('difficultyLevel');
    
    if (!topic || !difficultyLevel) {
      toast({
        title: "Missing Information",
        description: "Please fill in the topic and difficulty level first",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingSuggestions(true);
    generateSuggestionsMutation.mutate({ topic, difficultyLevel });
  };

  const handleUseSuggestion = (suggestion: string) => {
    form.setValue('confusion', suggestion);
    setSelectedSuggestion(suggestion);
  };

  const handleImproveText = () => {
    const currentText = form.getValues('confusion');
    const topic = form.getValues('topic');
    
    if (!currentText || !topic) {
      toast({
        title: "Missing Information",
        description: "Please write some feedback and specify a topic first",
        variant: "destructive",
      });
      return;
    }

    setIsImprovingText(true);
    improveFeedbackMutation.mutate({ text: currentText, topic });
  };

  const onSubmit = async (data: SubmissionData) => {
    submitMutation.mutate(data);
  };

  const handleClearSubmission = () => {
    if (sessionId) {
      const storageKey = `submission_${sessionId}`;
      sessionStorage.removeItem(storageKey);
    }
    setCurrentSubmissionId(null);
    setIsEditMode(false);
    form.reset({
      courseId: finalCourseId || undefined,
      sessionId: sessionId || undefined,
      topic: "",
      confusion: "",
      difficultyLevel: undefined,
    });
    setAiSuggestions([]);
    setSelectedSuggestion("");
    toast({
      title: "Cleared",
      description: "Starting fresh with a new feedback submission.",
    });
  };

  if (coursesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f8faf9] to-[#e8f0ea] flex items-center justify-center">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="h-64 bg-gray-200 rounded w-96"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8faf9] to-[#e8f0ea]">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[#2d5a3d] mb-4">
            Class Feedback Session
          </h1>
          {selectedCourse && (
            <div className="flex items-center justify-center gap-4 mb-4">
              <Badge variant="secondary" className="text-lg px-4 py-2">
                <BookOpen className="h-4 w-4 mr-2" />
                {selectedCourse.code}
              </Badge>
              <span className="text-lg text-gray-700">{selectedCourse.name}</span>
            </div>
          )}
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Share what's confusing you with AI-powered assistance to help craft better feedback
          </p>
        </div>

        <div className="max-w-4xl mx-auto grid gap-8 lg:grid-cols-3">
          {/* Main Feedback Form */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg border-0">
              <CardHeader className="bg-[#2d5a3d] text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  {isEditMode ? "Edit Your Feedback" : "Submit Your Feedback"}
                </CardTitle>
              </CardHeader>
              
              {isEditMode && (
                <div className="p-4 border-b">
                  <Alert className="border-blue-200 bg-blue-50">
                    <Edit3 className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                      <div className="flex items-center justify-between">
                        <span>You're editing your existing feedback submission.</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleClearSubmission}
                          className="ml-2 h-7 px-2 text-xs border-blue-300 text-blue-700 hover:bg-blue-100"
                        >
                          <RotateCcw className="h-3 w-3 mr-1" />
                          Start Fresh
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                </div>
              )}
              
              <CardContent className="p-6">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {!finalCourseId && (
                      <FormField
                        control={form.control}
                        name="courseId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Course</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-course">
                                  <SelectValue placeholder="Select your course" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {courses.map((course) => (
                                  <SelectItem key={course.id} value={course.id}>
                                    {course.code} - {course.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <FormField
                      control={form.control}
                      name="topic"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>What topic or concept is confusing?</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g., Binary Search Trees, Photosynthesis, Linear Algebra..."
                              data-testid="input-topic"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

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
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="slightly" id="slightly" data-testid="radio-slightly" />
                                <Label htmlFor="slightly">Slightly confused - I get most of it</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="very" id="very" data-testid="radio-very" />
                                <Label htmlFor="very">Very confused - I understand some parts</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="completely" id="completely" data-testid="radio-completely" />
                                <Label htmlFor="completely">Completely lost - I don't understand at all</Label>
                              </div>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* AI Suggestions */}
                    {form.watch('topic') && form.watch('difficultyLevel') && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleGenerateSuggestions}
                            disabled={isGeneratingSuggestions}
                            className="flex items-center gap-2"
                            data-testid="button-ai-suggestions"
                          >
                            {isGeneratingSuggestions ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <Lightbulb className="h-4 w-4" />
                            )}
                            Get AI Suggestions
                          </Button>
                          {aiSuggestions.length > 0 && (
                            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                              <Sparkles className="h-3 w-3 mr-1" />
                              {aiSuggestions.length} suggestions
                            </Badge>
                          )}
                        </div>

                        {aiSuggestions.length > 0 && (
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">AI-Generated Feedback Suggestions:</Label>
                            {aiSuggestions.map((suggestion, index) => (
                              <Card key={index} className="cursor-pointer hover:bg-blue-50 transition-colors border-blue-200">
                                <CardContent className="p-3">
                                  <div className="flex items-start justify-between gap-2">
                                    <p className="text-sm text-gray-700 flex-1">{suggestion}</p>
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleUseSuggestion(suggestion)}
                                      className="text-xs"
                                      data-testid={`button-use-suggestion-${index}`}
                                    >
                                      Use This
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <FormField
                      control={form.control}
                      name="confusion"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center justify-between">
                            <FormLabel>Describe what's confusing you</FormLabel>
                            {field.value && form.watch('topic') && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleImproveText}
                                disabled={isImprovingText}
                                className="flex items-center gap-1"
                                data-testid="button-improve-feedback"
                              >
                                {isImprovingText ? (
                                  <RefreshCw className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Wand2 className="h-3 w-3" />
                                )}
                                Improve with AI
                              </Button>
                            )}
                          </div>
                          <FormControl>
                            <Textarea
                              placeholder="Explain what's confusing about this topic. The more specific you are, the better your professor can help..."
                              className="min-h-[120px]"
                              data-testid="textarea-confusion"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />


                    <Button 
                      type="submit" 
                      className="w-full bg-[#2d5a3d] hover:bg-[#1f3f2a] text-lg py-6"
                      disabled={submitMutation.isPending}
                      data-testid="button-submit-feedback"
                    >
                      {submitMutation.isPending ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4 mr-2" />
                      )}
                      {isEditMode ? "Update Feedback" : "Submit Anonymous Feedback"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Privacy Notice */}
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-green-800 mb-2">Privacy First</h3>
                    <p className="text-sm text-green-700">
                      Your feedback is completely anonymous. We don't collect any personal information or track who submitted what.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Assistant Info */}
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-blue-800 mb-2">AI-Powered Assistance</h3>
                    <p className="text-sm text-blue-700 mb-3">
                      Get help crafting better feedback that's more helpful to your professor.
                    </p>
                    <ul className="text-xs text-blue-600 space-y-1">
                      <li>• Generate suggestion based on your confusion level</li>
                      <li>• Improve your feedback to be more specific</li>
                      <li>• Make your feedback more constructive</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tips */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Tips for Better Feedback
                </h3>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Be specific about what part confuses you</li>
                  <li>• Mention what you already understand</li>
                  <li>• Suggest alternative explanations</li>
                  <li>• Ask for specific examples or practice</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}