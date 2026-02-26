import { BoardProvider } from "@/components/board/BoardContext";
import { BoardShell } from "@/components/board/BoardShell";

export default function Page() {
  return (
    <BoardProvider>
      <BoardShell />
    </BoardProvider>
  );
}
