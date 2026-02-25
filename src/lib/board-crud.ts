export type CrudMutation<T extends { id: string }> =
  | { type: "create"; item: T; atStart?: boolean }
  | { type: "update"; id: string; patch: Partial<T> }
  | { type: "delete"; id: string };

export const applyCrudMutation = <T extends { id: string }>(
  items: T[],
  mutation: CrudMutation<T>,
): T[] => {
  switch (mutation.type) {
    case "create":
      return mutation.atStart ? [mutation.item, ...items] : [...items, mutation.item];

    case "update":
      return items.map((item) =>
        item.id === mutation.id ? ({ ...item, ...mutation.patch } satisfies T) : item,
      );

    case "delete":
      return items.filter((item) => item.id !== mutation.id);

    default:
      return items;
  }
};
