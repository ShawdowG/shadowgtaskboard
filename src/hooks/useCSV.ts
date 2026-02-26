import type { WorkItem } from "./useBoard";

export function useCSV() {
  function exportToCSV(items: WorkItem[], projectName: string) {
    const header = ["id", "title", "status", "assignee", "depth", "parent_id", "description"];
    const rows = items.map((i) =>
      [
        i.id,
        `"${(i.title ?? "").replace(/"/g, '""')}"`,
        i.status,
        i.assignee ?? "",
        i.depth,
        i.parent_id ?? "",
        `"${(i.description ?? "").replace(/"/g, '""')}"`,
      ].join(","),
    );
    const csv = [header.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${projectName.replace(/\s+/g, "-").toLowerCase()}-board.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function importFromCSV(
    file: File,
    projectId: string,
    onDone: () => void,
  ) {
    const text = await file.text();
    const [headerLine, ...lines] = text.trim().split("\n");
    const headers = headerLine.split(",").map((h) => h.trim());

    const validLines = lines.filter(Boolean);
    for (const line of validLines) {
      // Simple CSV parse — handles quoted fields
      const values: string[] = [];
      let current = "";
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"' && line[i + 1] === '"') { current += '"'; i++; }
        else if (ch === '"') { inQuotes = !inQuotes; }
        else if (ch === "," && !inQuotes) { values.push(current); current = ""; }
        else { current += ch; }
      }
      values.push(current);

      const row: Record<string, string> = {};
      headers.forEach((h, i) => { row[h] = values[i]?.trim() ?? ""; });

      await fetch("/api/v1/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: projectId,
          title: row.title || "Untitled",
          status: row.status || "backlog",
          assignee: row.assignee || null,
          depth: Number(row.depth) || 0,
          parent_id: row.parent_id || null,
          description: row.description || null,
        }),
      });
    }
    onDone();
  }

  return { exportToCSV, importFromCSV };
}
