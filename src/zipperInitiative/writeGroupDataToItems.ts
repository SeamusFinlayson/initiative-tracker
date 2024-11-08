import OBR from "@owlbear-rodeo/sdk";
import { InitiativeItem } from "../InitiativeItem";
import isMetadata from "./isMetadata";
import { getPluginId } from "../getPluginId";

export default async function writeGroupDataToItems(
  initiativeItems: InitiativeItem[],
) {
  OBR.scene.items.updateItems(
    initiativeItems.map((item) => item.id),
    (items) => {
      for (let i = 0; i < items.length; i++) {
        if (items[i].id !== initiativeItems[i].id) {
          throw "Error: Item mismatch in initiative tracker, could not update items.";
        }

        if (items[i].metadata[getPluginId("metadata")]) {
          const metadata = items[i].metadata[getPluginId("metadata")];
          if (isMetadata(metadata)) {
            metadata.group = initiativeItems[i].group;
            metadata.groupIndex = initiativeItems[i].groupIndex;
            items[i].metadata[getPluginId("metadata")] = metadata;
          }
        }
      }
    },
  );
}
