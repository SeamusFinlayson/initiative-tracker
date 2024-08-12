import { useEffect, useState } from "react";

import OBR, { Metadata } from "@owlbear-rodeo/sdk";
import { InitiativeHeader } from "../InitiativeHeader";
import { InitiativeTracker } from "./InitiativeTracker";
import {
  readBooleanFromMetadata,
  ZIPPER_INITIATIVE_ENABLED_METADATA_ID,
} from "../metadataHelpers";
import { ZipperInitiative } from "../zipperInitiative/ZipperInitiative";
import { getPluginId } from "../getPluginId";

const addIcon = new URL("../assets/add.svg#icon", import.meta.url).toString();
const removeIcon = new URL(
  "../assets/remove.svg#icon",
  import.meta.url
).toString();

export function App() {
  const [sceneReady, setSceneReady] = useState(false);
  const [zipperInitiativeEnabled, setZipperInitiativeEnabled] = useState(false);
  useEffect(() => {
    OBR.scene.isReady().then(setSceneReady);
    return OBR.scene.onReadyChange(setSceneReady);
  }, []);

  useEffect(() => {
    const handleRoomMetadataChange = (roomMetadata: Metadata) => {
      setZipperInitiativeEnabled(
        readBooleanFromMetadata(
          roomMetadata,
          ZIPPER_INITIATIVE_ENABLED_METADATA_ID,
          zipperInitiativeEnabled
        )
      );
    };
    OBR.room.getMetadata().then(handleRoomMetadataChange);
    return OBR.room.onMetadataChange(handleRoomMetadataChange);
  }, []);

  useEffect(() => {
    OBR.onReady(() => {
      OBR.contextMenu.create({
        icons: [
          {
            icon: addIcon,
            label: "Add to Initiative",
            filter: {
              every: [
                { key: "layer", value: "CHARACTER", coordinator: "||" },
                { key: "layer", value: "MOUNT" },
                { key: "type", value: "IMAGE" },
                {
                  key: ["metadata", getPluginId("metadata")],
                  value: undefined,
                },
              ],
              permissions: ["UPDATE"],
            },
          },
          {
            icon: removeIcon,
            label: "Remove from Initiative",
            filter: {
              every: [
                { key: "layer", value: "CHARACTER", coordinator: "||" },
                { key: "layer", value: "MOUNT" },
                { key: "type", value: "IMAGE" },
              ],
              permissions: ["UPDATE"],
            },
          },
        ],
        id: getPluginId("menu/toggle"),
        onClick(context) {
          OBR.scene.items.updateItems(context.items, items => {
            // Check whether to add the items to initiative or remove them
            const addToInitiative = items.every(
              item => item.metadata[getPluginId("metadata")] === undefined
            );
            let count = 0;
            for (const item of items) {
              if (addToInitiative) {
                item.metadata[getPluginId("metadata")] = {
                  count: `${count}`,
                  active: false,
                };
                count += 1;
              } else {
                delete item.metadata[getPluginId("metadata")];
              }
            }
          });
        },
      });
    });
  }, []);

  // Show a basic header when the scene isn't ready
  if (!sceneReady) {
    return (
      <InitiativeHeader subtitle="Open a scene to use the initiative tracker" />
    );
  }

  if (zipperInitiativeEnabled) return <ZipperInitiative />;

  return <InitiativeTracker />;
}
