import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Trash2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Comment } from "@shared/schema";

interface CommentsData extends Comment {
  user: {
    firstName: string;
    lastName: string;
    profileImageUrl: string | null;
  };
}

export default function CommentsSection({ mediaId, userId }: { mediaId: number; userId?: string }) {
  const [commentText, setCommentText] = useState("");
  
  const { data: comments = [] } = useQuery<CommentsData[]>({
    queryKey: [`/api/media/${mediaId}/comments`],
  });

  const createCommentMutation = useMutation({
    mutationFn: async (text: string) => {
      return await apiRequest("POST", `/api/media/${mediaId}/comments`, { text });
    },
    onSuccess: () => {
      setCommentText("");
      queryClient.invalidateQueries({ queryKey: [`/api/media/${mediaId}/comments`] });
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: number) => {
      return await apiRequest("DELETE", `/api/comments/${commentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/media/${mediaId}/comments`] });
    },
  });

  const handleSubmit = () => {
    if (commentText.trim()) {
      createCommentMutation.mutate(commentText);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-foreground">Comments ({comments.length})</h3>

      {userId && (
        <div className="flex gap-2">
          <Textarea
            placeholder="Add a comment..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            className="min-h-24 resize-none"
            data-testid="textarea-comment"
          />
          <Button
            onClick={handleSubmit}
            disabled={!commentText.trim() || createCommentMutation.isPending}
            size="sm"
            data-testid="button-comment-submit"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      )}

      <div className="space-y-3 max-h-64 overflow-y-auto">
        {comments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No comments yet</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-3 p-3 bg-muted/30 rounded-lg">
              <Avatar className="h-8 w-8">
                <AvatarImage src={comment.user.profileImageUrl || undefined} />
                <AvatarFallback>{(comment.user.firstName?.[0] || "U").toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">
                      {comment.user.firstName && comment.user.lastName
                        ? `${comment.user.firstName} ${comment.user.lastName}`
                        : comment.user.firstName || "Anonymous"}
                    </p>
                    <p className="text-sm text-foreground break-words">{comment.text}</p>
                  </div>
                  {userId === comment.userId && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteCommentMutation.mutate(comment.id)}
                      disabled={deleteCommentMutation.isPending}
                      data-testid="button-delete-comment"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(comment.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
