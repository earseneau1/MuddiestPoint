import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { LogIn, LogOut, Shield, Home } from "lucide-react";
import { Link } from "wouter";

export default function Admin() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    // Check if the authenticated user is an app owner
    if (isAuthenticated && user) {
      // You can check based on specific user IDs or emails
      // For now, we'll allow any authenticated TCU user to be an owner
      setIsOwner(true);
    }
  }, [isAuthenticated, user]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors">
            <Home className="h-5 w-5" />
            <span>Back to Home</span>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-primary" />
              <div>
                <CardTitle className="text-3xl">Admin Panel</CardTitle>
                <CardDescription>
                  App owner authentication and management
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading...</p>
              </div>
            ) : isAuthenticated ? (
              <div className="space-y-6">
                <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                    Authenticated as Admin
                  </h3>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Welcome, {user?.firstName || user?.email || 'Admin'}
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    User ID: {user?.id}
                  </p>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold">Admin Actions</h4>
                  <div className="grid gap-3">
                    <Link href="/professor">
                      <Button className="w-full justify-start" variant="outline">
                        <Shield className="h-4 w-4 mr-2" />
                        Professor Dashboard
                      </Button>
                    </Link>
                    <Link href="/user-stories">
                      <Button className="w-full justify-start" variant="outline">
                        <Shield className="h-4 w-4 mr-2" />
                        User Stories Management
                      </Button>
                    </Link>
                  </div>
                </div>

                <Button
                  variant="destructive"
                  onClick={() => window.location.href = '/api/logout'}
                  className="w-full"
                  data-testid="button-admin-sign-out"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                    Admin Authentication Required
                  </h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Sign in with your TCU email to access admin features
                  </p>
                  <ul className="text-xs text-blue-600 dark:text-blue-400 mt-2 space-y-1">
                    <li>• View professor dashboard</li>
                    <li>• Manage user stories</li>
                    <li>• Access analytics</li>
                  </ul>
                </div>

                <Button
                  variant="default"
                  size="lg"
                  onClick={() => window.location.href = '/api/login'}
                  className="w-full"
                  data-testid="button-admin-sign-in"
                >
                  <LogIn className="h-5 w-5 mr-2" />
                  Sign In as Admin
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  Only @tcu.edu email addresses are allowed
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}