import { useQuery } from "@tanstack/react-query";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Media } from "@shared/schema";

export default function DuplicatesSection({ mediaId, onSelectDuplicate }: { mediaId: number; onSelectDuplicate: (media: Media) => void }) {
  const { data } = useQuery<{ duplicates: Media[] }>({
    queryKey: [`/api/media/${mediaId}/duplicates`],
  });

  const duplicates = data?.duplicates || [];

  if (duplicates.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
      <div className="flex items-center gap-2">
        <AlertCircle className="w-4 h-4 text-amber-600" />
        <p className="font-medium text-sm text-amber-600">{duplicates.length} similar image{duplicates.length !== 1 ? 's' : ''} found</p>
      </div>
      <div className="space-y-1">
        {duplicates.map((dup) => (
          <Button
            key={dup.id}
            variant="outline"
            size="sm"
            className="w-full justify-start text-left"
            onClick={() => onSelectDuplicate(dup)}
            data-testid={`button-duplicate-${dup.id}`}
          >
            {dup.filename}
          </Button>
        ))}
      </div>
    </div>
  );
}
