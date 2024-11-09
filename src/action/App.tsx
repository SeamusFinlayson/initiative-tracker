import { useEffect, useState } from "react";

import OBR, { Metadata, Player } from "@owlbear-rodeo/sdk";
import { InitiativeHeader } from "../InitiativeHeader";
import { InitiativeTracker } from "../classicInitiative/InitiativeTracker";
import {
  readBooleanFromMetadata,
  ZIPPER_INITIATIVE_ENABLED_METADATA_ID,
} from "../metadataHelpers";
import { ZipperInitiative } from "../zipperInitiative/ZipperInitiative";
import { getPluginId } from "../getPluginId";
import addThemeToBody from "../addThemeToBody";
import { useTheme } from "@mui/material";

const addIcon = new URL("../assets/add.svg#icon", import.meta.url).toString();
const removeIcon = new URL(
  "../assets/remove.svg#icon",
  import.meta.url,
).toString();

export function App() {
  const [sceneReady, setSceneReady] = useState(false);
  const [zipperInitiativeEnabled, setZipperInitiativeEnabled] = useState(false);
  const [role, setRole] = useState<"GM" | "PLAYER">("PLAYER");

  const theme = useTheme();

  addThemeToBody(theme.palette.mode);

  useEffect(() => {
    OBR.scene.isReady().then(setSceneReady);
    return OBR.scene.onReadyChange(setSceneReady);
  }, []);

  useEffect(() => {
    const handlePlayerChange = (player: Player) => {
      setRole(player.role);
    };
    OBR.player.getRole().then(setRole);
    return OBR.player.onChange(handlePlayerChange);
  }, []);

  useEffect(() => {
    const handleRoomMetadataChange = (roomMetadata: Metadata) => {
      setZipperInitiativeEnabled(
        readBooleanFromMetadata(
          roomMetadata,
          ZIPPER_INITIATIVE_ENABLED_METADATA_ID,
          zipperInitiativeEnabled,
        ),
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
          OBR.scene.items.updateItems(context.items, (items) => {
            // Check whether to add the items to initiative or remove them
            const addToInitiative = items.every(
              (item) => item.metadata[getPluginId("metadata")] === undefined,
            );
            let count = 0;
            for (const item of items) {
              if (addToInitiative) {
                item.metadata[getPluginId("metadata")] = {
                  count: `${count}`,
                  active: false,
                  group: role === "GM" ? 1 : 0,
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
  }, [role]);

  // Show a basic header when the scene isn't ready
  if (!sceneReady) {
    return (
      <InitiativeHeader subtitle="Open a scene to use the initiative tracker" />
    );
  }

  if (zipperInitiativeEnabled) return <ZipperInitiative role={role} />;

  return <InitiativeTracker role={role} />;
}
