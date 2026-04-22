import { SearchX } from "lucide-react";

interface EmptyStateProps {
  message?: string;
  description?: string;
}

export function EmptyState({ 
  message = "No data found", 
  description = "Try adjusting your search or filters to find what you're looking for." 
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center animate-fade-in">
      <div className="h-16 w-16 rounded-2xl bg-surface-100 text-surface-400 flex items-center justify-center mb-4">
        <SearchX size={32} />
      </div>
      <h3 className="text-lg font-bold text-surface-900 mb-1">{message}</h3>
      <p className="text-sm text-surface-500 max-w-xs mx-auto">
        {description}
      </p>
    </div>
  );
}
