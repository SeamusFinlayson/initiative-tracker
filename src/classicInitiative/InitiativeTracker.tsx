import { useEffect, useRef, useState } from "react";

import Stack from "@mui/material/Stack";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import Box from "@mui/material/Box";

import SkipPreviousRoundedIcon from "@mui/icons-material/SkipPreviousRounded";
import SkipNextRounded from "@mui/icons-material/SkipNextRounded";

import OBR, { isImage, Item, Metadata } from "@owlbear-rodeo/sdk";

import { InitiativeItem } from "../InitiativeItem";

import { InitiativeListItem } from "./InitiativeListItem";
import { getPluginId } from "../getPluginId";
import { InitiativeHeader } from "../InitiativeHeader";
import { isPlainObject } from "../isPlainObject";
import { sortFromOrder, sortList, useOrder } from "./sceneOrder";
import { Button, Icon, useTheme } from "@mui/material";
import {
  ADVANCED_CONTROLS_METADATA_ID,
  DISABLE_NOTIFICATION_METADATA_ID,
  DISPLAY_ROUND_METADATA_ID,
  readBooleanFromMetadata,
  readNumberFromMetadata,
  ROUND_COUNT_METADATA_ID,
  SORT_ASCENDING_METADATA_ID,
  updateRoundCount,
} from "../metadataHelpers";
import SortAscendingIcon from "../assets/SortAscendingIcon";
import SortDescendingIcon from "../assets/SortDescendingIcon";
import SettingsButton from "../components/SettingsButton";

/** Check that the item metadata is in the correct format */
function isMetadata(
  metadata: unknown
): metadata is { count: string; active: boolean } {
  return (
    isPlainObject(metadata) &&
    typeof metadata.count === "string" &&
    typeof metadata.active === "boolean"
  );
}

export function InitiativeTracker({ role }: { role: "PLAYER" | "GM" }) {
  const [initiativeItems, setInitiativeItems] = useState<InitiativeItem[]>([]);

  const [roundCount, setRoundCount] = useState(1);

  const [sortAscending, setSortAscending] = useState(false);
  const [advancedControls, setAdvancedControls] = useState(false);
  const [displayRound, setDisplayRound] = useState(false);
  const [disableNotifications, setDisableNotifications] = useState(false);

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
              count: metadata.count,
              url: item.image.url,
              name: item.text.plainText || item.name,
              active: metadata.active,
              visible: item.visible,
              // Unused properties
              ready: true,
              group: 0,
            });
          }
        }
      }
      setInitiativeItems(initiativeItems);
    };

    OBR.scene.items.getItems().then(handleItemsChange);
    return OBR.scene.items.onChange(handleItemsChange);
  }, []);

  function handleSortClick() {
    // Sort items and write order to the scene
    const sorted = sortList(initiativeItems, sortAscending);

    // Focus first item
    const nextIndex = 0;

    // Set local items immediately
    setInitiativeItems(
      sorted.map((item, index) => ({
        ...item,
        active: index === nextIndex,
      }))
    );

    // Update the scene items with the new active status
    OBR.scene.items.updateItems(
      sorted.map(init => init.id),
      items => {
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          const metadata = item.metadata[getPluginId("metadata")];
          if (isMetadata(metadata)) {
            metadata.active = i === nextIndex;
          }
        }
      }
    );
  }

  function handleDirectionClick(next = true) {
    // Get the next index to activate
    const sorted = sortFromOrder(initiativeItems, order);
    let newIndex =
      sorted.findIndex(initiative => initiative.active) + (next ? 1 : -1);

    if (newIndex < 0) {
      newIndex = sorted.length + newIndex;
      if (advancedControls && displayRound && roundCount > 1)
        updateRoundCount(roundCount - 1, setRoundCount);
    } else if (newIndex >= sorted.length) {
      newIndex = newIndex % sorted.length;
      if (advancedControls && displayRound)
        updateRoundCount(roundCount + 1, setRoundCount);
    }

    // Set local items immediately
    setInitiativeItems(
      sorted.map((item, index) => ({
        ...item,
        active: index === newIndex,
      }))
    );

    // Update the scene items with the new active status
    OBR.scene.items.updateItems(
      sorted.map(init => init.id),
      items => {
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          const metadata = item.metadata[getPluginId("metadata")];
          if (isMetadata(metadata)) {
            metadata.active = i === newIndex;
          }
        }
      }
    );
  }

  function handleInitiativeCountChange(id: string, newCount: string) {
    // Set local items immediately
    setInitiativeItems(prev =>
      prev.map(item => {
        if (item.id === id) {
          return {
            ...item,
            count: newCount,
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
          metadata.count = newCount;
        }
      }
    });
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

  const order = useOrder();
  const sortedInitiativeItems = sortFromOrder(initiativeItems, order);

  const themeIsDark = useTheme().palette.mode === "dark";

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
            <IconButton onClick={handleSortClick}>
              <Icon>
                {sortAscending ? (
                  <SortAscendingIcon darkMode={themeIsDark}></SortAscendingIcon>
                ) : (
                  <SortDescendingIcon
                    darkMode={themeIsDark}
                  ></SortDescendingIcon>
                )}
              </Icon>
            </IconButton>
            {!advancedControls && (
              <IconButton
                aria-label="next"
                onClick={() => handleDirectionClick()}
                disabled={initiativeItems.length === 0}
              >
                <SkipNextRounded />
              </IconButton>
            )}
          </>
        }
      />

      <Box sx={{ overflowY: "auto" }}>
        <List ref={listRef}>
          {sortedInitiativeItems.map(item => (
            <InitiativeListItem
              key={item.id}
              item={item}
              darkMode={themeIsDark}
              onCountChange={newCount => {
                handleInitiativeCountChange(item.id, newCount);
              }}
              showHidden={role === "GM"}
            />
          ))}
        </List>
      </Box>

      {advancedControls && (
        <Box
          sx={{
            p: 1,
            display: "flex",
            justifyContent: "space-evenly",
            gap: 1,
          }}
        >
          <Box
            sx={{
              outline: 1,
              outlineStyle: "solid",
              outlineColor: themeIsDark
                ? "rgba(255,255,255,0.1)"
                : "rgba(0, 0, 0, 0.12)",
              // background: "rgba(0,0,0,0.15)",
              m: 0,
              borderRadius: 9999,
              display: "inline-flex",
            }}
          >
            <IconButton
              aria-label="previous"
              onClick={() => handleDirectionClick(false)}
              disabled={initiativeItems.length === 0}
            >
              <SkipPreviousRoundedIcon />
            </IconButton>
            {displayRound && (
              <>
                <Button
                  color="primary"
                  sx={{ pl: 1, pr: 1, pb: 0.4, borderRadius: 9999 }}
                  disabled={role === "PLAYER"}
                  onClick={() => {
                    if (role === "GM") {
                      updateRoundCount(1, setRoundCount);
                      if (!disableNotifications)
                        OBR.notification.show(
                          "Round counter reset. Use Undo to restore the counter.",
                          "INFO"
                        );
                    }
                  }}
                >
                  Round {roundCount}
                </Button>
              </>
            )}
            <IconButton
              aria-label="next"
              onClick={() => handleDirectionClick()}
              disabled={initiativeItems.length === 0}
            >
              <SkipNextRounded />
            </IconButton>
          </Box>
        </Box>
      )}
    </Stack>
  );
}
