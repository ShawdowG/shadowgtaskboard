import { BoardProvider } from "@/components/board/BoardContext";
import { BoardShell } from "@/components/board/BoardShell";

// /v2 entry point – mirrors the main board UI but gives us a stable
// URL for v2-specific iterations (ENG-1100 and follow-ups).
export default function V2Page() {
  return (
    <BoardProvider>
      <BoardShell />
    </BoardProvider>
  );
}
