import { useState } from "react";
import { Link } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ChevronLeft, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { User } from "@shared/schema";

export default function Profile() {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/auth/user"],
  });

  const updateMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch("/api/auth/user/update", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        throw new Error("Failed to update profile");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
      setUploading(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
      setUploading(false);
    },
  });

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("avatar", file);
    setUploading(true);
    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-lg text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-lg text-muted-foreground">Not authenticated</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border backdrop-blur-md bg-background/90">
        <div className="max-w-2xl mx-auto px-6 h-16 flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Profile</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="space-y-8">
          {/* Avatar Section */}
          <div className="flex flex-col items-center gap-6">
            <div className="relative">
              <Avatar className="h-32 w-32">
                <AvatarImage src={user.profileImageUrl || undefined} alt={user.firstName || "User"} />
                <AvatarFallback className="text-3xl">
                  {(user.firstName?.[0] || "U").toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <label htmlFor="avatar-upload" className="absolute bottom-0 right-0">
                <Button
                  size="icon"
                  className="rounded-full shadow-lg"
                  asChild
                  disabled={uploading}
                  data-testid="button-upload-avatar"
                >
                  <span>
                    <Upload className="w-4 h-4" />
                  </span>
                </Button>
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
                data-testid="input-avatar"
              />
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Click the upload button to change your avatar</p>
            </div>
          </div>

          {/* User Info */}
          <div className="border-t border-border pt-8 space-y-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Email</label>
              <p className="text-base text-muted-foreground" data-testid="text-email">
                {user.email || "No email set"}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Name</label>
              <p className="text-base text-muted-foreground" data-testid="text-name">
                {user.firstName && user.lastName
                  ? `${user.firstName} ${user.lastName}`
                  : user.firstName || "No name set"}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Member Since</label>
              <p className="text-base text-muted-foreground" data-testid="text-joined">
                {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Unknown"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
