import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Link } from "wouter";
import { 
  Plus, 
  ChevronUp, 
  List, 
  LayoutGrid, 
  User, 
  Target, 
  Gauge, 
  TrendingUp,
  GitMerge,
  Edit,
  Trash2,
  Clock,
  CheckCircle,
  AlertCircle,
  PlayCircle,
  PauseCircle,
  XCircle,
  HelpCircle,
  LogIn,
  LogOut
} from "lucide-react";
import type { UserStoryWithStats } from "@shared/schema";

type ViewMode = 'list' | 'kanban';
type StoryStatus = 'submitted' | 'in_review' | 'accepted' | 'in_progress' | 'on_hold' | 'done';

const statusConfig: Record<StoryStatus, { label: string; color: string; icon: any }> = {
  submitted: { label: 'Submitted', color: 'bg-gray-500', icon: Clock },
  in_review: { label: 'In Review', color: 'bg-yellow-500', icon: AlertCircle },
  accepted: { label: 'Accepted', color: 'bg-green-500', icon: CheckCircle },
  in_progress: { label: 'In Progress', color: 'bg-blue-500', icon: PlayCircle },
  on_hold: { label: 'On Hold', color: 'bg-orange-500', icon: PauseCircle },
  done: { label: 'Done', color: 'bg-purple-500', icon: XCircle }
};

export default function UserStories() {
  const { toast } = useToast();
  // Anonymous mode - no authentication
  const user = null;
  const isAuthLoading = false;
  const isAuthenticated = false;
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [showForm, setShowForm] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [sessionToken, setSessionToken] = useState<string>('');
  const [selectedStory, setSelectedStory] = useState<UserStoryWithStats | null>(null);
  const [mergeDialog, setMergeDialog] = useState<{ open: boolean; story1?: UserStoryWithStats; story2?: UserStoryWithStats }>({ open: false });
  const [editingStory, setEditingStory] = useState<UserStoryWithStats | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    asA: '',
    iWantTo: '',
    soThat: '',
    submittedBy: '',
    impact: 5,
    confidence: 5,
    ease: 5
  });

  // Initialize session token
  useEffect(() => {
    const stored = localStorage.getItem('userStoriesSessionToken');
    if (stored) {
      setSessionToken(stored);
    }
    
    // Check if user is owner (in real app, this would be from auth)
    const ownerStatus = localStorage.getItem('isAppOwner') === 'true';
    setIsOwner(ownerStatus);
  }, []);

  // Fetch user stories
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/user-stories'],
    queryFn: async () => {
      const response = await fetch('/api/user-stories', {
        headers: sessionToken ? { 'x-session-token': sessionToken } : {}
      });
      if (!response.ok) throw new Error('Failed to fetch user stories');
      const result = await response.json();
      
      // Store session token if new one was created
      if (result.sessionToken && !sessionToken) {
        setSessionToken(result.sessionToken);
        localStorage.setItem('userStoriesSessionToken', result.sessionToken);
      }
      
      return result.stories as UserStoryWithStats[];
    },
    enabled: true
  });

  // Create user story mutation
  const createMutation = useMutation({
    mutationFn: async (data: { title: string; description: string; submittedBy: string; impact: number; confidence: number; ease: number }) => {
      if (!sessionToken) {
        // Generate a new session token if needed
        const newToken = crypto.randomUUID();
        setSessionToken(newToken);
        localStorage.setItem('userStoriesSessionToken', newToken);
      }
      
      const response = await fetch('/api/user-stories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-token': sessionToken || crypto.randomUUID()
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error('Failed to create user story');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user-stories'] });
      toast({
        title: "Success",
        description: "User story submitted successfully!"
      });
      setShowForm(false);
      setFormData({
        asA: '',
        iWantTo: '',
        soThat: '',
        submittedBy: '',
        impact: 5,
        confidence: 5,
        ease: 5
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit user story",
        variant: "destructive"
      });
    }
  });

  // Update user story mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<{ title: string; description: string; submittedBy: string; impact: number; confidence: number; ease: number; status?: StoryStatus }> }) => {
      const response = await fetch(`/api/user-stories/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-app-owner': isOwner ? 'true' : 'false'
        },
        body: JSON.stringify(updates)
      });
      if (!response.ok) throw new Error('Failed to update user story');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user-stories'] });
      toast({
        title: "Success",
        description: "User story updated successfully!"
      });
      setEditingStory(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update user story",
        variant: "destructive"
      });
    }
  });

  // Delete user story mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/user-stories/${id}`, {
        method: 'DELETE',
        headers: {
          'x-app-owner': isOwner ? 'true' : 'false'
        }
      });
      if (!response.ok) throw new Error('Failed to delete user story');
      return response.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user-stories'] });
      toast({
        title: "Success",
        description: "User story deleted successfully!"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete user story",
        variant: "destructive"
      });
    }
  });

  // Upvote mutation
  const upvoteMutation = useMutation({
    mutationFn: async ({ id, remove }: { id: string; remove: boolean }) => {
      const response = await fetch(`/api/user-stories/${id}/upvote`, {
        method: remove ? 'DELETE' : 'POST',
        headers: {
          'x-session-token': sessionToken
        }
      });
      if (!response.ok) throw new Error('Failed to update vote');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user-stories'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update vote",
        variant: "destructive"
      });
    }
  });

  // Merge mutation
  const mergeMutation = useMutation({
    mutationFn: async ({ keepId, mergeId }: { keepId: string; mergeId: string }) => {
      const response = await fetch('/api/user-stories/merge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-app-owner': isOwner ? 'true' : 'false'
        },
        body: JSON.stringify({ keepId, mergeId })
      });
      if (!response.ok) throw new Error('Failed to merge user stories');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user-stories'] });
      toast({
        title: "Success",
        description: "User stories merged successfully!"
      });
      setMergeDialog({ open: false });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to merge user stories",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.asA || !formData.iWantTo || !formData.soThat) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }
    
    // Combine the user story format
    const title = `As a ${formData.asA}, I want to ${formData.iWantTo}`;
    const description = `As a ${formData.asA}, I want to ${formData.iWantTo}, so that ${formData.soThat}.`;
    
    const submitData = {
      title,
      description,
      submittedBy: formData.submittedBy,
      impact: formData.impact,
      confidence: formData.confidence,
      ease: formData.ease
    };
    
    if (editingStory) {
      updateMutation.mutate({
        id: editingStory.id,
        updates: submitData
      });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleUpvote = (story: UserStoryWithStats) => {
    if (!sessionToken) {
      toast({
        title: "Session Required",
        description: "Please submit a user story first to enable voting",
        variant: "destructive"
      });
      return;
    }
    upvoteMutation.mutate({ id: story.id, remove: story.hasUpvoted });
  };

  const handleStatusChange = (story: UserStoryWithStats, newStatus: StoryStatus) => {
    updateMutation.mutate({
      id: story.id,
      updates: { status: newStatus }
    });
  };

  const handleEdit = (story: UserStoryWithStats) => {
    setEditingStory(story);
    
    // Parse the story description back into its components
    // Expected format: "As a [role], I want to [action], so that [benefit]."
    const descriptionMatch = story.description.match(/As a (.+?), I want to (.+?), so that (.+?)\.?$/);
    
    if (descriptionMatch) {
      setFormData({
        asA: descriptionMatch[1].trim(),
        iWantTo: descriptionMatch[2].trim(),
        soThat: descriptionMatch[3].trim(),
        submittedBy: story.submittedBy || '',
        impact: story.impact,
        confidence: story.confidence,
        ease: story.ease
      });
    } else {
      // Fallback if the format doesn't match
      setFormData({
        asA: '',
        iWantTo: '',
        soThat: '',
        submittedBy: story.submittedBy || '',
        impact: story.impact,
        confidence: story.confidence,
        ease: story.ease
      });
    }
    setShowForm(true);
  };

  const handleMerge = (story1: UserStoryWithStats, story2: UserStoryWithStats) => {
    setMergeDialog({ open: true, story1, story2 });
  };

  const confirmMerge = (keepId: string, mergeId: string) => {
    mergeMutation.mutate({ keepId, mergeId });
  };

  const groupByStatus = (stories: UserStoryWithStats[]) => {
    return stories.reduce((acc, story) => {
      const status = story.status as StoryStatus;
      if (!acc[status]) acc[status] = [];
      acc[status].push(story);
      return acc;
    }, {} as Record<StoryStatus, UserStoryWithStats[]>);
  };

  const sortedStories = data ? [...data].sort((a, b) => b.iceScore - a.iceScore) : [];
  const groupedStories: Record<StoryStatus, UserStoryWithStats[]> = data ? groupByStatus(data) : {} as Record<StoryStatus, UserStoryWithStats[]>;

  return (
    <>
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-3" data-testid="link-home">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <HelpCircle className="text-primary-foreground text-lg" />
              </div>
              <h1 className="text-xl font-serif font-semibold text-foreground">Muddiest Point</h1>
            </Link>
          </div>
        </div>
      </header>

      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4">
        <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-3xl">User Stories</CardTitle>
                <CardDescription>
                  Suggest and vote on features using the ICE framework
                </CardDescription>
              </div>
              <div className="flex gap-2">
                {isOwner && (
                  <Button
                    data-testid="button-toggle-owner"
                    variant={isOwner ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setIsOwner(!isOwner);
                      localStorage.setItem('isAppOwner', (!isOwner).toString());
                    }}
                  >
                    {isOwner ? "Owner Mode" : "User Mode"}
                  </Button>
                )}
                {isAuthLoading ? (
                  <div className="text-sm text-muted-foreground">Loading...</div>
                ) : isAuthenticated ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.href = '/api/logout'}
                    data-testid="button-sign-out"
                    className="flex items-center space-x-2"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                  </Button>
                ) : (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => window.location.href = '/api/login'}
                    data-testid="button-sign-in"
                    className="flex items-center space-x-2"
                  >
                    <LogIn className="h-4 w-4" />
                    <span>Sign In</span>
                  </Button>
                )}
                <Button 
                  data-testid="button-new-story"
                  onClick={() => setShowForm(!showForm)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  New Story
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Submission Form */}
        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle>{editingStory ? 'Edit User Story' : 'Submit User Story'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-4 border-b border-border pb-6">
                  <h4 className="font-medium text-lg">User Story Format</h4>
                  
                  <div>
                    <Label htmlFor="asA">As a...</Label>
                    <Select
                      value={formData.asA}
                      onValueChange={(value) => setFormData({ ...formData, asA: value })}
                    >
                      <SelectTrigger data-testid="select-as-a">
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="teaching assistant">Teaching Assistant</SelectItem>
                        <SelectItem value="professor">Professor</SelectItem>
                        <SelectItem value="department chair">Department Chair</SelectItem>
                        <SelectItem value="college admin">College Admin</SelectItem>
                        <SelectItem value="app administrator/owner">App Administrator/Owner</SelectItem>
                        <SelectItem value="partner">Partner</SelectItem>
                        <SelectItem value="stakeholder">Stakeholder</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="iWantTo">I want to...</Label>
                    <Input
                      id="iWantTo"
                      data-testid="input-i-want-to"
                      value={formData.iWantTo}
                      onChange={(e) => setFormData({ ...formData, iWantTo: e.target.value })}
                      placeholder="describe what you want to do or achieve"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="soThat">So that...</Label>
                    <Input
                      id="soThat"
                      data-testid="input-so-that"
                      value={formData.soThat}
                      onChange={(e) => setFormData({ ...formData, soThat: e.target.value })}
                      placeholder="explain the benefit or value"
                      required
                    />
                  </div>

                  {formData.asA && formData.iWantTo && formData.soThat && (
                    <div className="bg-muted p-4 rounded-lg">
                      <Label className="text-sm font-medium">Preview:</Label>
                      <p className="text-sm mt-1">
                        As a <strong>{formData.asA}</strong>, I want to <strong>{formData.iWantTo}</strong>, so that <strong>{formData.soThat}</strong>.
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="submittedBy">Your Name (Optional)</Label>
                  <Input
                    id="submittedBy"
                    data-testid="input-submitted-by"
                    value={formData.submittedBy}
                    onChange={(e) => setFormData({ ...formData, submittedBy: e.target.value })}
                    placeholder="Leave blank to remain anonymous"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Impact: {formData.impact}
                    </Label>
                    <Slider
                      data-testid="slider-impact"
                      value={[formData.impact]}
                      onValueChange={(v) => setFormData({ ...formData, impact: v[0] })}
                      min={1}
                      max={10}
                      step={1}
                      className="mt-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      How much will this move the needle?
                    </p>
                  </div>

                  <div>
                    <Label className="flex items-center gap-2">
                      <Gauge className="h-4 w-4" />
                      Confidence: {formData.confidence}
                    </Label>
                    <Slider
                      data-testid="slider-confidence"
                      value={[formData.confidence]}
                      onValueChange={(v) => setFormData({ ...formData, confidence: v[0] })}
                      min={1}
                      max={10}
                      step={1}
                      className="mt-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      How confident are we it will work?
                    </p>
                  </div>

                  <div>
                    <Label className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Ease: {formData.ease}
                    </Label>
                    <Slider
                      data-testid="slider-ease"
                      value={[formData.ease]}
                      onValueChange={(v) => setFormData({ ...formData, ease: v[0] })}
                      min={1}
                      max={10}
                      step={1}
                      className="mt-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      How easy is it to implement?
                    </p>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    ICE Score: <span className="font-bold text-lg">{formData.impact + formData.confidence + formData.ease}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => {
                        setShowForm(false);
                        setEditingStory(null);
                        setFormData({
                          asA: '',
                          iWantTo: '',
                          soThat: '',
                          submittedBy: '',
                          impact: 5,
                          confidence: 5,
                          ease: 5
                        });
                      }}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      data-testid="button-submit-story"
                      disabled={createMutation.isPending || updateMutation.isPending}
                    >
                      {editingStory ? 'Update Story' : 'Submit Story'}
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* View Toggle */}
        <div className="flex justify-end">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
            <TabsList>
              <TabsTrigger value="list" data-testid="tab-list">
                <List className="mr-2 h-4 w-4" />
                List
              </TabsTrigger>
              <TabsTrigger value="kanban" data-testid="tab-kanban">
                <LayoutGrid className="mr-2 h-4 w-4" />
                Kanban
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Content */}
        {isLoading ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Loading user stories...</p>
            </CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-destructive">Failed to load user stories</p>
            </CardContent>
          </Card>
        ) : viewMode === 'list' ? (
          <Card>
            <CardContent className="p-0">
              <ScrollArea className="h-[600px]">
                <div className="p-6 space-y-4">
                  {sortedStories.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No user stories yet. Be the first to submit one!
                    </p>
                  ) : (
                    sortedStories.map((story) => (
                      <Card key={story.id} data-testid={`card-story-${story.id}`}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex-1">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h3 className="font-semibold text-lg">{story.title}</h3>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {story.description}
                                  </p>
                                  {story.submittedBy && (
                                    <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                                      <User className="h-3 w-3" />
                                      {story.submittedBy}
                                    </p>
                                  )}
                                </div>
                                <Badge variant="secondary" className={`ml-2 ${statusConfig[story.status as StoryStatus].color} text-white`}>
                                  {statusConfig[story.status as StoryStatus].label}
                                </Badge>
                              </div>

                              <div className="flex items-center gap-4 mt-4">
                                <div className="flex items-center gap-2">
                                  <Button
                                    size="sm"
                                    variant={story.hasUpvoted ? "default" : "outline"}
                                    onClick={() => handleUpvote(story)}
                                    data-testid={`button-upvote-${story.id}`}
                                  >
                                    <ChevronUp className="h-4 w-4" />
                                    {story.upvoteCount}
                                  </Button>
                                </div>

                                <div className="flex items-center gap-2 text-sm">
                                  <Badge variant="outline">
                                    <Target className="h-3 w-3 mr-1" />
                                    {story.impact}
                                  </Badge>
                                  <Badge variant="outline">
                                    <Gauge className="h-3 w-3 mr-1" />
                                    {story.confidence}
                                  </Badge>
                                  <Badge variant="outline">
                                    <TrendingUp className="h-3 w-3 mr-1" />
                                    {story.ease}
                                  </Badge>
                                  <Badge>
                                    ICE: {story.iceScore}
                                  </Badge>
                                </div>

                                {isOwner && (
                                  <div className="flex items-center gap-2 ml-auto">
                                    <Select
                                      value={story.status}
                                      onValueChange={(value) => handleStatusChange(story, value as StoryStatus)}
                                    >
                                      <SelectTrigger className="w-32" data-testid={`select-status-${story.id}`}>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {Object.keys(statusConfig).map((status) => (
                                          <SelectItem key={status} value={status}>
                                            {statusConfig[status as StoryStatus].label}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      onClick={() => handleEdit(story)}
                                      data-testid={`button-edit-${story.id}`}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      onClick={() => setSelectedStory(story)}
                                      data-testid={`button-merge-${story.id}`}
                                    >
                                      <GitMerge className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      onClick={() => deleteMutation.mutate(story.id)}
                                      data-testid={`button-delete-${story.id}`}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {Object.keys(statusConfig).map((status) => (
              <Card key={status}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    {React.createElement(statusConfig[status as StoryStatus].icon, { className: "h-4 w-4" })}
                    {statusConfig[status as StoryStatus].label}
                    <Badge variant="secondary" className="ml-auto">
                      {groupedStories[status as StoryStatus]?.length || 0}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2">
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-2">
                      {groupedStories[status as StoryStatus]?.map((story: UserStoryWithStats) => (
                        <Card key={story.id} className="cursor-pointer hover:shadow-md transition-shadow">
                          <CardContent className="p-3">
                            <h4 className="font-medium text-sm line-clamp-2">{story.title}</h4>
                            <div className="flex items-center justify-between mt-2">
                              <div className="flex items-center gap-1">
                                <Button
                                  size="sm"
                                  variant={story.hasUpvoted ? "default" : "ghost"}
                                  className="h-6 px-2"
                                  onClick={() => handleUpvote(story)}
                                >
                                  <ChevronUp className="h-3 w-3" />
                                  {story.upvoteCount}
                                </Button>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {story.iceScore}
                              </Badge>
                            </div>
                            {isOwner && (
                              <div className="flex gap-1 mt-2">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-6 w-6"
                                  onClick={() => handleEdit(story)}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-6 w-6"
                                  onClick={() => deleteMutation.mutate(story.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Merge Dialog */}
        {selectedStory && (
          <Dialog open={!!selectedStory} onOpenChange={() => setSelectedStory(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Select Story to Merge With</DialogTitle>
                <DialogDescription>
                  Choose which story to merge with "{selectedStory.title}"
                </DialogDescription>
              </DialogHeader>
              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {sortedStories
                    .filter(s => s.id !== selectedStory.id)
                    .map((story) => (
                      <Card 
                        key={story.id} 
                        className="cursor-pointer hover:bg-muted"
                        onClick={() => handleMerge(selectedStory, story)}
                      >
                        <CardContent className="p-3">
                          <p className="font-medium text-sm">{story.title}</p>
                          <div className="flex items-center gap-2 mt-2 text-xs">
                            <span>{story.upvoteCount} votes</span>
                            <span>ICE: {story.iceScore}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>
        )}

        {/* Merge Confirmation Dialog */}
        <Dialog open={mergeDialog.open} onOpenChange={(open) => setMergeDialog({ open })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Merge User Stories</DialogTitle>
              <DialogDescription>
                Which story should be kept as the primary one? The other will be marked as merged.
              </DialogDescription>
            </DialogHeader>
            {mergeDialog.story1 && mergeDialog.story2 && (
              <div className="space-y-4">
                <Card 
                  className="cursor-pointer hover:bg-muted"
                  onClick={() => confirmMerge(mergeDialog.story1!.id, mergeDialog.story2!.id)}
                >
                  <CardContent className="p-4">
                    <p className="font-medium">{mergeDialog.story1.title}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {mergeDialog.story1.upvoteCount} votes • ICE: {mergeDialog.story1.iceScore}
                    </p>
                  </CardContent>
                </Card>
                <Card 
                  className="cursor-pointer hover:bg-muted"
                  onClick={() => confirmMerge(mergeDialog.story2!.id, mergeDialog.story1!.id)}
                >
                  <CardContent className="p-4">
                    <p className="font-medium">{mergeDialog.story2.title}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {mergeDialog.story2.upvoteCount} votes • ICE: {mergeDialog.story2.iceScore}
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
    </>
  );
}