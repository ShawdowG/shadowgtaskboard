"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { useActivity } from "@/hooks/useBoard";

interface ActivityLogProps {
  itemId: string;
}

export function ActivityLog({ itemId }: ActivityLogProps) {
  const { data: logs = [], isLoading } = useActivity(itemId);

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold">Activity</h4>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-3/4" />
        </div>
      ) : logs.length === 0 ? (
        <p className="text-xs text-muted-foreground">No activity yet.</p>
      ) : (
        <div className="space-y-1">
          {logs.map((log) => (
            <div key={log.id} className="flex items-start gap-2 text-xs text-muted-foreground">
              <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/50" />
              <div>
                <span className="font-medium text-foreground">{log.event_type}</span>
                {log.actor_id && <span> · {log.actor_id}</span>}
                <span className="ml-1">{new Date(log.created_at).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
