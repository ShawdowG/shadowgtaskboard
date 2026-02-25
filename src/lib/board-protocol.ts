export type BoardEntity = "work_item" | "comment" | "board";

export type BoardAction = "created" | "updated" | "deleted" | "moved" | "imported" | "commented";

export type BoardActor = {
  type: "user" | "system";
  id: string;
};

export type BoardEvent<TPayload extends object = Record<string, unknown>> = {
  version: "1.0";
  eventId: string;
  entity: BoardEntity;
  action: BoardAction;
  actor: BoardActor;
  occurredAt: string;
  payload: TPayload;
};

export const createBoardEvent = <TPayload extends object>(
  input: Omit<BoardEvent<TPayload>, "version" | "eventId" | "occurredAt">,
): BoardEvent<TPayload> => ({
  version: "1.0",
  eventId: crypto.randomUUID(),
  occurredAt: new Date().toISOString(),
  ...input,
});
