import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogIn, LogOut, Shield, Home } from "lucide-react";
import { Link } from "wouter";

export default function Admin() {
  // Admin functionality is not available in anonymous mode
  const isAuthenticated = false;
  const isOwner = false;

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
            <div className="space-y-6">
              <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                  Anonymous Mode Active
                </h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  Admin functionality is disabled in anonymous mode.
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
            <div className="space-y-6">
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                  Admin Features Disabled
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Authentication is disabled in anonymous mode
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}