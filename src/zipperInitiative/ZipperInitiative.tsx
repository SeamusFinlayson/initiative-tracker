import { useEffect, useRef, useState } from "react";

import Stack from "@mui/material/Stack";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import Box from "@mui/material/Box";

import LoopRoundedIcon from "@mui/icons-material/LoopRounded";

import OBR, { isImage, Item, Metadata, Player } from "@owlbear-rodeo/sdk";

import { InitiativeItem, isMetadata } from "../InitiativeItem";

import addIcon from "../assets/add.svg";
import removeIcon from "../assets/remove.svg";

import { getPluginId } from "../getPluginId";
import { InitiativeHeader } from "../InitiativeHeader";
import { Icon } from "@mui/material";
import {
  ADVANCED_CONTROLS_METADATA_ID,
  DISABLE_NOTIFICATION_METADATA_ID,
  DISPLAY_ROUND_METADATA_ID,
  readBooleanFromMetadata,
  readNumberFromMetadata,
  ROUND_COUNT_METADATA_ID,
  SORT_ASCENDING_METADATA_ID,
} from "../metadataHelpers";
import SettingsButton from "../components/SettingsButton";
import { InitiativeListItem } from "./InitiativeListItem";

export function ZipperInitiative() {
  const [initiativeItems, setInitiativeItems] = useState<InitiativeItem[]>([]);
  const [role, setRole] = useState<"GM" | "PLAYER">("PLAYER");

  const [roundCount, setRoundCount] = useState(1);

  const [sortAscending, setSortAscending] = useState(false);
  const [advancedControls, setAdvancedControls] = useState(false);
  const [displayRound, setDisplayRound] = useState(false);
  const [disableNotifications, setDisableNotifications] = useState(false);

  useEffect(() => {
    const handlePlayerChange = (player: Player) => {
      setRole(player.role);
    };
    OBR.player.getRole().then(setRole);
    return OBR.player.onChange(handlePlayerChange);
  }, []);

  useEffect(() => {
    const handleSceneMetadataChange = (sceneMetadata: Metadata) => {
      setRoundCount(
        readNumberFromMetadata(
          sceneMetadata,
          ROUND_COUNT_METADATA_ID,
          roundCount
        )
      );
    };
    OBR.scene.getMetadata().then(handleSceneMetadataChange);
    return OBR.scene.onMetadataChange(handleSceneMetadataChange);
  }, []);

  useEffect(() => {
    const handleRoomMetadataChange = (roomMetadata: Metadata) => {
      setSortAscending(
        readBooleanFromMetadata(
          roomMetadata,
          SORT_ASCENDING_METADATA_ID,
          sortAscending
        )
      );
      setAdvancedControls(
        readBooleanFromMetadata(
          roomMetadata,
          ADVANCED_CONTROLS_METADATA_ID,
          advancedControls
        )
      );
      setDisplayRound(
        readBooleanFromMetadata(
          roomMetadata,
          DISPLAY_ROUND_METADATA_ID,
          displayRound
        )
      );
      setDisableNotifications(
        readBooleanFromMetadata(
          roomMetadata,
          DISABLE_NOTIFICATION_METADATA_ID,
          disableNotifications
        )
      );
    };
    OBR.room.getMetadata().then(handleRoomMetadataChange);
    return OBR.room.onMetadataChange(handleRoomMetadataChange);
  }, []);

  useEffect(() => {
    const handleItemsChange = async (items: Item[]) => {
      const initiativeItems: InitiativeItem[] = [];
      for (const item of items) {
        if (isImage(item)) {
          const metadata = item.metadata[getPluginId("metadata")];
          if (isMetadata(metadata)) {
            initiativeItems.push({
              id: item.id,
              name: item.text.plainText || item.name,
              url: item.image.url,
              visible: item.visible,
              active: metadata.active,
              count: metadata.count,
              ready: metadata.ready !== undefined ? metadata.ready : true,
            });
          }
        }
      }
      setInitiativeItems(initiativeItems);
    };

    OBR.scene.items.getItems().then(handleItemsChange);
    return OBR.scene.items.onChange(handleItemsChange);
  }, []);

  useEffect(() => {
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
              { key: ["metadata", getPluginId("metadata")], value: undefined },
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
  }, []);

  function handleReadyChange(id: string, ready: boolean) {
    // Set local items immediately
    setInitiativeItems(prev =>
      prev.map(item => {
        if (item.id === id) {
          return {
            ...item,
            ready: ready,
          };
        } else {
          return item;
        }
      })
    );
    // Sync changes over the network
    OBR.scene.items.updateItems([id], items => {
      for (const item of items) {
        const metadata = item.metadata[getPluginId("metadata")];
        if (isMetadata(metadata)) {
          metadata.ready = ready;
        }
      }
    });
  }

  function handleResetClicked() {
    // Set local items immediately
    setInitiativeItems(
      initiativeItems.map(item => ({
        ...item,
        ready: true,
      }))
    );

    // Update the scene items with the new active status
    OBR.scene.items.updateItems(
      initiativeItems.map(init => init.id),
      items => {
        for (let i = 0; i < items.length; i++) {
          let item = items[i];
          const metadata = item.metadata[getPluginId("metadata")];
          if (isMetadata(metadata)) {
            metadata.ready = true;
          }
        }
      }
    );
  }

  const zoomMargin = 1; // scroll bar shows up at 90% page zoom w/o this
  const advancedControlsHeight = 56;
  const listRef = useRef<HTMLUListElement>(null);
  useEffect(() => {
    if (listRef.current && ResizeObserver) {
      const resizeObserver = new ResizeObserver(entries => {
        if (entries.length > 0) {
          const entry = entries[0];
          // Get the height of the border box
          // In the future you can use `entry.borderBoxSize`
          // however as of this time the property isn't widely supported (iOS)
          const borderHeight = entry.contentRect.bottom + entry.contentRect.top;
          // Set a minimum height of 64px
          const listHeight = Math.max(borderHeight, 64);
          // Set the action height to the list height + the card header height + the divider + margin
          OBR.action.setHeight(
            listHeight +
              64 +
              1 +
              zoomMargin +
              (advancedControls ? advancedControlsHeight : 0)
          );
        }
      });
      resizeObserver.observe(listRef.current);
      return () => {
        resizeObserver.disconnect();
        // Reset height when unmounted
        OBR.action.setHeight(
          129 + zoomMargin + (advancedControls ? advancedControlsHeight : 0)
        );
      };
    }
  }, [advancedControls]);

  // const themeIsDark = useTheme().palette.mode === "dark";

  return (
    <Stack height="100vh">
      <InitiativeHeader
        subtitle={
          initiativeItems.length === 0
            ? "Select a character to start initiative"
            : undefined
        }
        action={
          <>
            {role === "GM" && <SettingsButton></SettingsButton>}
            <IconButton onClick={handleResetClicked}>
              <Icon>
                <LoopRoundedIcon></LoopRoundedIcon>
              </Icon>
            </IconButton>
          </>
        }
      />
      <Box sx={{ overflowY: "auto" }}>
        <List ref={listRef}>
          {initiativeItems.map(item => (
            <InitiativeListItem
              key={item.id}
              item={item}
              onReadyChange={ready => {
                handleReadyChange(item.id, ready);
              }}
              showHidden={role === "GM"}
            />
          ))}
        </List>
      </Box>
    </Stack>
  );
}
