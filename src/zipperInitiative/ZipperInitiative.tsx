import { useEffect, useRef, useState } from "react";

import Stack from "@mui/material/Stack";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import Box from "@mui/material/Box";

import LoopRoundedIcon from "@mui/icons-material/LoopRounded";

import OBR, { isImage, Item, Metadata } from "@owlbear-rodeo/sdk";

import { InitiativeItem } from "../InitiativeItem";

import { getPluginId } from "../getPluginId";
import { InitiativeHeader } from "../InitiativeHeader";
import { Divider, Icon, Typography } from "@mui/material";
import {
  DISPLAY_ROUND_METADATA_ID,
  PREVIOUS_STACK_METADATA_ID,
  readBooleanFromMetadata,
  readNumberFromMetadata,
  readStringArrayFromMetadata,
  ROUND_COUNT_METADATA_ID,
  SELECT_ACTIVE_ITEM_METADATA_ID,
} from "../metadataHelpers";
import SettingsButton from "../settings/SettingsButton";
import { InitiativeListItem } from "./InitiativeListItem";
import { isPlainObject } from "../isPlainObject";

import ModeEditRoundedIcon from "@mui/icons-material/ModeEditRounded";
import EditOffRoundedIcon from "@mui/icons-material/EditOffRounded";
import { selectItem } from "../findItem";
import { writePreviousStackToScene } from "./previousStack";

/** Check that the item metadata is in the correct format */
function isMetadata(metadata: unknown): metadata is {
  count: string;
  active: boolean;
  ready: boolean | undefined;
  group: number | undefined;
} {
  return (
    isPlainObject(metadata) &&
    typeof metadata.count === "string" &&
    typeof metadata.active === "boolean"
  );
}

export function ZipperInitiative({ role }: { role: "PLAYER" | "GM" }) {
  const [initiativeItems, setInitiativeItems] = useState<InitiativeItem[]>([]);
  const [previousStack, setPreviousStack] = useState<string[]>([]);

  const [roundCount, setRoundCount] = useState(1);
  const [displayRound, setDisplayRound] = useState(false);
  const [selectActiveItem, setSelectActiveItem] = useState(0);

  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    const handleSceneMetadataChange = (sceneMetadata: Metadata) => {
      setRoundCount(
        readNumberFromMetadata(
          sceneMetadata,
          ROUND_COUNT_METADATA_ID,
          roundCount
        )
      );
      setPreviousStack(
        readStringArrayFromMetadata(sceneMetadata, PREVIOUS_STACK_METADATA_ID)
      );
    };
    OBR.scene.getMetadata().then(handleSceneMetadataChange);
    return OBR.scene.onMetadataChange(handleSceneMetadataChange);
  }, []);

  useEffect(() => {
    const handleRoomMetadataChange = (roomMetadata: Metadata) => {
      setDisplayRound(
        readBooleanFromMetadata(
          roomMetadata,
          DISPLAY_ROUND_METADATA_ID,
          displayRound
        )
      );
      setSelectActiveItem(
        readNumberFromMetadata(
          roomMetadata,
          SELECT_ACTIVE_ITEM_METADATA_ID,
          selectActiveItem
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
              group: metadata.group !== undefined ? metadata.group : 1,
            });
          }
        }
      }
      setInitiativeItems(initiativeItems);
    };

    OBR.scene.items.getItems().then(handleItemsChange);
    return OBR.scene.items.onChange(handleItemsChange);
  }, []);

  function handleReadyChange(id: string, ready: boolean, previousId: string) {
    const newActive = !ready;
    // Set local items immediately and update previous stack
    setInitiativeItems(prev =>
      prev.map(item => {
        if (item.id === id) {
          // Highlight ready item on map
          if (selectActiveItem === 1 && !ready) selectItem(id);

          // Update item locally
          return {
            ...item,
            ready: ready,
            active: newActive,
          };
        } else {
          // Update item locally
          return { ...item, active: false };
        }
      })
    );

    if (newActive) {
      // Record that this item went at this point
      const newPreviousStack = [...previousStack, id];
      setPreviousStack(newPreviousStack);
      writePreviousStackToScene(newPreviousStack);
    } else {
      // Restore previous initiative item
      const newPreviousStack = previousStack.slice(0, -1);
      setPreviousStack(newPreviousStack);
      writePreviousStackToScene(newPreviousStack);
      setInitiativeItems(prev =>
        prev.map(item => {
          if (item.id === previousId) {
            return { ...item, active: true };
          } else return { ...item };
        })
      );
    }

    // Sync item changes over the network
    OBR.scene.items.updateItems(
      initiativeItems.map(item => item.id),
      items => {
        for (const item of items) {
          const metadata = item.metadata[getPluginId("metadata")];
          if (isMetadata(metadata)) {
            if (item.id === id) {
              metadata.ready = ready;
              metadata.active = newActive;
            } else if (!newActive && item.id === previousId) {
              metadata.active = true;
            } else {
              metadata.active = false;
            }
          }
        }
      }
    );
  }

  function handleGroupChange(id: string, currentGroup: number) {
    const newGroup = currentGroup === 0 ? 1 : 0;
    // Set local items immediately
    setInitiativeItems(prev =>
      prev.map(item => {
        if (item.id === id) {
          return {
            ...item,
            group: newGroup,
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
          metadata.group = newGroup;
        }
      }
    });
  }

  function handleResetClicked() {
    // Clear previous stack
    setPreviousStack([]);
    writePreviousStackToScene([]);

    // Set local items immediately
    setInitiativeItems(
      initiativeItems.map(item => ({
        ...item,
        ready: true,
        active: false,
      }))
    );

    // Update the scene items with the new active status
    OBR.scene.items.updateItems(
      initiativeItems.map(init => init.id),
      items => {
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          const metadata = item.metadata[getPluginId("metadata")];
          if (isMetadata(metadata)) {
            metadata.ready = true;
            metadata.active = false;
          }
        }
      }
    );
  }

  const zoomMargin = 1; // scroll bar shows up at 90% page zoom w/o this
  const roundCountHeight = 56;
  const listRef0 = useRef<HTMLUListElement>(null);
  const listRef1 = useRef<HTMLUListElement>(null);
  const listRefs: React.RefObject<HTMLUListElement>[] = [listRef0, listRef1];
  type HeightTracker = { resizeObserver: ResizeObserver; height: number };
  useEffect(() => {
    if (listRef0.current && listRef1.current && ResizeObserver) {
      const makeResizeObserver = (
        listHeights: HeightTracker[],
        index: number
      ) =>
        new ResizeObserver(entries => {
          if (entries.length > 0) {
            const entry = entries[0];
            // Get the height of the border box
            // In the future you can use `entry.borderBoxSize`
            // however as of this time the property isn't widely supported (iOS)
            const borderHeight =
              entry.contentRect.bottom + entry.contentRect.top;
            // Set a minimum height of 64px
            listHeights[index].height = Math.max(borderHeight, 0);
            let sum = 0;
            listHeights.forEach(height => {
              sum += Math.max(height.height, 36);
            });
            // Set the action height to the list height + the card header height + the divider + margin
            OBR.action.setHeight(sum + 64 + 1 + zoomMargin + 49 * 2);
          }
        });
      const listHeights: HeightTracker[] = [];
      for (let i = 0; i < listRefs.length; i++) {
        listHeights.push({
          resizeObserver: makeResizeObserver(listHeights, i),
          height: 0,
        });
        const current = listRefs[i].current;
        if (current) listHeights[i].resizeObserver.observe(current);
      }
      return () => {
        listHeights.forEach(value => {
          value.resizeObserver.disconnect();
        });
        // Reset height when unmounted
        OBR.action.setHeight(
          129 + zoomMargin + (roundCount ? roundCountHeight : 0)
        );
      };
    }
  }, [roundCount]);

  const partyItems = initiativeItems.filter(item => item.group === 0);
  const enemyItems = initiativeItems.filter(item => item.group === 1);

  const allEnemiesHidden = enemyItems.findIndex(value => value.visible) === -1;
  const roundFinished = initiativeItems.findIndex(value => value.ready) === -1;

  return (
    <Stack height="100vh">
      <InitiativeHeader
        action={
          <>
            {role === "GM" && <SettingsButton></SettingsButton>}

            {editMode ? (
              <IconButton onClick={() => setEditMode(false)}>
                <EditOffRoundedIcon />
              </IconButton>
            ) : (
              <IconButton onClick={() => setEditMode(true)}>
                <ModeEditRoundedIcon />
              </IconButton>
            )}
            <IconButton
              onClick={handleResetClicked}
              disabled={role === "PLAYER" && !roundFinished}
            >
              <Icon color={roundFinished ? "primary" : undefined}>
                <LoopRoundedIcon></LoopRoundedIcon>
              </Icon>
            </IconButton>
          </>
        }
      />
      <Box sx={{ overflowY: "auto" }}>
        <Typography
          variant="overline"
          sx={{
            px: 2,
            py: 0.5,
            display: "inline-block",
            color: "text.secondary",
          }}
        >
          Party
        </Typography>
        <Divider variant="fullWidth" />

        {partyItems.length === 0 && (
          <Typography
            variant="caption"
            sx={{
              px: 2,
              py: 1,
              display: "inline-block",
              color: "text.secondary",
            }}
          >
            {Math.random() < 0.1 && enemyItems.length !== 0 && !allEnemiesHidden
              ? "I need a hero!"
              : "The party seems to be empty..."}
          </Typography>
        )}
        <List ref={listRef0} sx={{ py: 0 }}>
          {partyItems.map(item => (
            <InitiativeListItem
              key={item.id}
              item={item}
              onGroupClick={(currentGroup: number) =>
                handleGroupChange(item.id, currentGroup)
              }
              onReadyChange={ready => {
                handleReadyChange(
                  item.id,
                  ready,
                  previousStack.length > 1
                    ? (previousStack.at(previousStack.length - 2) as string)
                    : ""
                );
              }}
              showHidden={role === "GM"}
              edit={editMode}
            />
          ))}
        </List>

        <Typography
          variant="overline"
          sx={{
            px: 2,
            py: 0.5,

            display: "inline-block",
            color: "text.secondary",
          }}
        >
          Adversaries
        </Typography>
        <Divider variant="fullWidth" />
        {(enemyItems.length === 0 || (allEnemiesHidden && role !== "GM")) && (
          <Typography
            variant="caption"
            sx={{
              px: 2,
              py: 1,
              display: "inline-block",
              color: "text.secondary",
            }}
          >
            {partyItems.length === 0
              ? "The action must be elsewhere..."
              : "The party stands uncontested"}
          </Typography>
        )}

        <List ref={listRef1} sx={{ py: 0 }}>
          {enemyItems.map(item => (
            <InitiativeListItem
              key={item.id}
              item={item}
              onGroupClick={(currentGroup: number) =>
                handleGroupChange(item.id, currentGroup)
              }
              onReadyChange={ready => {
                handleReadyChange(
                  item.id,
                  ready,
                  previousStack.length > 1
                    ? (previousStack.at(previousStack.length - 2) as string)
                    : ""
                );
              }}
              showHidden={role === "GM"}
              edit={editMode}
            />
          ))}
        </List>
      </Box>
    </Stack>
  );
}
