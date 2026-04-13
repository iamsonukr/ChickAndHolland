import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminLoaderScreenProps {
  title?: string;
  description?: string;
  className?: string;
}

const AdminLoaderScreen = ({
  title = "Loading admin workspace",
  description = "Please wait while we prepare the latest data for you.",
  className,
}: AdminLoaderScreenProps) => {
  return (
    <div
      className={cn(
        "flex min-h-[400px] w-full items-center justify-center bg-background p-6",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-4 text-center">
        {/* Simple Spinner Circle */}
        <div className="relative flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary/60" />
        </div>

        <div className="space-y-1">
          <h2 className="text-lg font-medium text-foreground">
            {title}
          </h2>
          {description && (
            <p className="text-sm text-muted-foreground max-w-[280px]">
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminLoaderScreen;