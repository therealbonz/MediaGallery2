import { useParams } from "wouter";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import MediaGrid from "@/components/MediaGrid";
import type { User, Media } from "@shared/schema";

export default function UserPage() {
  const { userId } = useParams<{ userId: string }>();

  const { data: user, isLoading: userLoading } = useQuery<User>({
    queryKey: [`/api/auth/user`],
    enabled: false,
  });

  // Get all users to find this one
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const currentUser = users.find(u => u.id === userId);

  const { data: mediaList = [] } = useQuery<Media[]>({
    queryKey: [`/api/users/${userId}/media`],
  });

  const isLoading = userLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-lg text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-lg text-muted-foreground">User not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border backdrop-blur-md bg-background/90">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center gap-4">
          <Link href="/users">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Gallery</h1>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* User Info */}
        <div className="flex items-center gap-4 mb-8">
          <Avatar className="h-16 w-16">
            <AvatarImage src={currentUser.profileImageUrl || undefined} alt={currentUser.firstName || "User"} />
            <AvatarFallback className="text-lg">
              {(currentUser.firstName?.[0] || "U").toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-2xl font-bold text-foreground" data-testid={`text-user-name-${currentUser.id}`}>
              {currentUser.firstName && currentUser.lastName
                ? `${currentUser.firstName} ${currentUser.lastName}`
                : currentUser.firstName || "Unknown User"}
            </p>
            <p className="text-muted-foreground">{currentUser.email}</p>
            <p className="text-sm text-muted-foreground">
              {mediaList.length} photo{mediaList.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Media Grid */}
        {mediaList.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            No photos uploaded yet
          </div>
        ) : (
          <MediaGrid media={mediaList} hideUpload={true} />
        )}
      </div>
    </div>
  );
}
