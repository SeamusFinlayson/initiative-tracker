import { isPlainObject } from "./isPlainObject";

export interface InitiativeItem {
  id: string;
  name: string;
  url: string;
  visible: boolean;
  active: boolean;
  count: string;
  ready: boolean;
}

/** Check that the item metadata is in the correct format */
export function isMetadata(
  metadata: unknown
): metadata is { count: string; active: boolean; ready: boolean | undefined } {
  return (
    isPlainObject(metadata) &&
    typeof metadata.count === "string" &&
    typeof metadata.active === "boolean"
  );
}
