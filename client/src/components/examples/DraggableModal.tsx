import { useState } from "react";
import DraggableModal from "../DraggableModal";
import { Button } from "@/components/ui/button";

export default function DraggableModalExample() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="p-6">
      <Button onClick={() => setIsOpen(true)} data-testid="button-open-modal">
        Open Modal
      </Button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm">
          <DraggableModal onClose={() => setIsOpen(false)}>
            <img
              src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4"
              alt="Sample"
              className="max-h-[75vh] max-w-full mx-auto rounded"
              draggable={false}
            />
          </DraggableModal>
        </div>
      )}
    </div>
  );
}
