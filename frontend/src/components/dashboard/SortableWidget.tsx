import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface SortableWidgetProps {
  id: string;
  children: React.ReactNode;
}

export default function SortableWidget({ id, children }: SortableWidgetProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : "auto",
    opacity: isDragging ? 0.5 : 1,
    position: "relative" as const,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      {/* Handle de drag (optionnel, ici on rend tout l'élément draggable via listeners sur le wrapper ou une partie spécifique) */}
      {/* Pour l'instant on applique les listeners sur tout le composant, mais on pourrait ajouter une poignée spécifique */}
      <div
        {...listeners}
        className="cursor-grab active:cursor-grabbing touch-manipulation"
      >
        {children}
      </div>
    </div>
  );
}
