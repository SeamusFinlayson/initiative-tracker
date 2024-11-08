import { isPlainObject } from "../isPlainObject";

/** Check that the item metadata is in the correct format */
export default function isMetadata(metadata: unknown): metadata is {
  count: string;
  active: boolean;
  ready: boolean | undefined;
  group: number | undefined;
  groupIndex: number | undefined;
} {
  return (
    isPlainObject(metadata) &&
    typeof metadata.count === "string" &&
    typeof metadata.active === "boolean"
  );
}
