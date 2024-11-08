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
import { Divider, Typography } from "@mui/material";
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

import ModeEditRoundedIcon from "@mui/icons-material/ModeEditRounded";
import EditOffRoundedIcon from "@mui/icons-material/EditOffRounded";
import { labelItem, removeLabel, selectItem } from "../findItem";
import { writePreviousStackToScene } from "./previousStack";
import {
  closestCenter,
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableContext, useSortable } from "@dnd-kit/sortable";
import { restrictToFirstScrollableAncestor } from "@dnd-kit/modifiers";

import { CSS } from "@dnd-kit/utilities";
import isMetadata from "./isMetadata";
import writeGroupDataToItems from "./writeGroupDataToItems";

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
          roundCount,
        ),
      );
      setPreviousStack(
        readStringArrayFromMetadata(sceneMetadata, PREVIOUS_STACK_METADATA_ID),
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
          displayRound,
        ),
      );
      setSelectActiveItem(
        readNumberFromMetadata(
          roomMetadata,
          SELECT_ACTIVE_ITEM_METADATA_ID,
          selectActiveItem,
        ),
      );
    };
    OBR.room.getMetadata().then(handleRoomMetadataChange);
    return OBR.room.onMetadataChange(handleRoomMetadataChange);
  }, []);

  useEffect(() => {
    const handleItems = async (items: Item[]) => {
      const newInitiativeItems: InitiativeItem[] = [];
      for (const item of items) {
        if (isImage(item)) {
          const metadata = item.metadata[getPluginId("metadata")];
          if (isMetadata(metadata)) {
            newInitiativeItems.push({
              id: item.id,
              name: item.text.plainText || item.name,
              url: item.image.url,
              visible: item.visible,
              active: metadata.active,
              count: metadata.count,
              ready: metadata.ready !== undefined ? metadata.ready : true,
              group: metadata.group !== undefined ? metadata.group : 1,
              groupIndex:
                metadata.groupIndex !== undefined ? metadata.groupIndex : -1,
            });
          }
        }
      }

      guaranteeMinimumGroupIndices(newInitiativeItems);
      setInitiativeItems(newInitiativeItems);
    };

    OBR.scene.items.getItems().then(handleItems);
    return OBR.scene.items.onChange(handleItems);
  }, []);

  function guaranteeMinimumGroupIndices(newInitiativeItems: InitiativeItem[]) {
    newInitiativeItems.sort(
      (a, b) =>
        (a.groupIndex === -1 ? newInitiativeItems.length : a.groupIndex) -
        (b.groupIndex === -1 ? newInitiativeItems.length : b.groupIndex),
    );
    newInitiativeItems.sort((a, b) => a.group - b.group);
    const groupCounts = new Map<number, number>();
    for (let i = 0; i < newInitiativeItems.length; i++) {
      const group = newInitiativeItems[i].group;
      if (!groupCounts.has(group)) {
        groupCounts.set(group, 0);
        newInitiativeItems[i].groupIndex = 0;
      } else {
        const groupCount = groupCounts.get(group);
        if (groupCount === undefined) throw "Error bad group";
        const newGroupCount = groupCount + 1;
        groupCounts.set(group, newGroupCount);
        newInitiativeItems[i].groupIndex = newGroupCount;
      }
    }
  }

  function handleReadyChange(id: string, ready: boolean, previousId: string) {
    const isNewActive = !ready;
    // Set local items immediately and update previous stack
    setInitiativeItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          // Highlight ready item on map
          if (selectActiveItem === 1 && isNewActive) selectItem(item.id);
          if (selectActiveItem === 2 && isNewActive) labelItem(item.id);

          // Update item locally
          return {
            ...item,
            ready: ready,
            active: isNewActive,
          };
        } else {
          // Update item locally
          return { ...item, active: false };
        }
      }),
    );

    if (isNewActive) {
      // Record that this item went at this point
      const newPreviousStack = [...previousStack, id];
      setPreviousStack(newPreviousStack);
      writePreviousStackToScene(newPreviousStack);
    } else {
      // Restore previous initiative item
      const newPreviousStack = previousStack.slice(0, -1);
      setPreviousStack(newPreviousStack);
      writePreviousStackToScene(newPreviousStack);
      if (newPreviousStack.length === 0) removeLabel();
      setInitiativeItems((prev) =>
        prev.map((item) => {
          if (item.id === previousId) {
            if (selectActiveItem === 1) selectItem(item.id);
            if (selectActiveItem === 2) labelItem(item.id);
            return { ...item, active: true };
          } else return { ...item };
        }),
      );
    }

    // Sync item changes over the network
    OBR.scene.items.updateItems(
      initiativeItems.map((item) => item.id),
      (items) => {
        for (const item of items) {
          const metadata = item.metadata[getPluginId("metadata")];
          if (isMetadata(metadata)) {
            if (item.id === id) {
              metadata.ready = ready;
              metadata.active = isNewActive;
            } else if (!isNewActive && item.id === previousId) {
              metadata.active = true;
            } else {
              metadata.active = false;
            }
          }
        }
      },
    );
  }

  function handleResetClicked() {
    // Clear previous stack
    setPreviousStack([]);
    writePreviousStackToScene([]);

    // Set local items immediately
    setInitiativeItems(
      initiativeItems.map((item) => ({
        ...item,
        ready: true,
        active: false,
      })),
    );

    // Update the scene items with the new active status
    OBR.scene.items.updateItems(
      initiativeItems.map((init) => init.id),
      (items) => {
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          const metadata = item.metadata[getPluginId("metadata")];
          if (isMetadata(metadata)) {
            metadata.ready = true;
            metadata.active = false;
          }
        }
      },
    );

    // Remove your turn label
    if (selectActiveItem == 2) removeLabel();
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
        index: number,
      ) =>
        new ResizeObserver((entries) => {
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
            listHeights.forEach((height) => {
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
        listHeights.forEach((value) => {
          value.resizeObserver.disconnect();
        });
        // Reset height when unmounted
        OBR.action.setHeight(
          129 + zoomMargin + (roundCount ? roundCountHeight : 0),
        );
      };
    }
  }, [roundCount]);

  const partyItems = initiativeItems.filter((item) => item.group === 0);
  const enemyItems = initiativeItems.filter((item) => item.group === 1);
  const adversariesDividerId = getGroupDividerId("Adversaries");
  const sortableItems = [
    ...partyItems.map((item) => item.id),
    adversariesDividerId,
    ...enemyItems.map((item) => item.id),
  ];

  const allEnemiesHidden =
    enemyItems.filter((item) => item.visible).length === 0;
  const roundFinished =
    initiativeItems.filter((item) => item.ready).length === 0;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: { y: 10 } },
    }),
  );

  return (
    <DndContext
      sensors={sensors}
      modifiers={[restrictToFirstScrollableAncestor]}
      collisionDetection={closestCenter}
      onDragEnd={(event) => {
        const { active, over } = event;

        // Return early if  active is over itself
        if (!over?.id || active.id === over.id) return;

        const activeItem = initiativeItems.find(
          (item) => item.id === active.id,
        );
        if (activeItem === undefined) throw "error invalid items";
        const activeIndex = sortableItems.findIndex((id) => id === active.id);
        const overIndex = sortableItems.findIndex((id) => id === over.id);
        const groupDividerIndex = sortableItems.findIndex(
          (id) => id === adversariesDividerId,
        );

        const newInitiativeItems = [...initiativeItems];

        if (overIndex === groupDividerIndex) {
          // handle item is dragged over group divider
          if (activeIndex < groupDividerIndex) {
            activeItem.group = 1;
            activeItem.groupIndex = -2;
          } else {
            activeItem.group = 0;
            activeItem.groupIndex = partyItems.length;
          }
        } else {
          const overItem = initiativeItems.find((item) => item.id === over.id);
          if (overItem === undefined) throw "error invalid items";

          const overGroupIndex = overItem.groupIndex;
          if (overItem.group === activeItem.group) {
            // handle item is dragged to same group
            newInitiativeItems.forEach((item) => {
              if (item.id !== activeItem.id && item.group === overItem.group)
                if (
                  item.groupIndex > activeItem.groupIndex &&
                  item.groupIndex <= overGroupIndex
                ) {
                  item.groupIndex--;
                } else if (
                  item.groupIndex >= overGroupIndex &&
                  item.groupIndex < activeItem.groupIndex
                ) {
                  item.groupIndex++;
                }
            });
            activeItem.groupIndex = overGroupIndex;
          } else {
            // handle item is dragged to different group
            newInitiativeItems.forEach((item) => {
              if (item.id !== activeItem.id && item.group === overItem.group)
                if (item.groupIndex > overGroupIndex) {
                  item.groupIndex++;
                }
            });
            activeItem.group = overItem.group;
            if (activeIndex < overIndex)
              activeItem.groupIndex = overGroupIndex + 1;
            else {
              activeItem.groupIndex = overGroupIndex;
              overItem.groupIndex++;
            }
          }
        }

        guaranteeMinimumGroupIndices(newInitiativeItems);
        setInitiativeItems(newInitiativeItems);
        writeGroupDataToItems(newInitiativeItems);
      }}
    >
      <SortableContext items={sortableItems}>
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
                  <LoopRoundedIcon
                    color={roundFinished ? "primary" : undefined}
                  />
                </IconButton>
              </>
            }
          />

          <Box sx={{ overflowY: "auto", overflowX: "clip" }}>
            <GroupHeading groupName="Party" />

            <GroupHint
              visible={partyItems.length === 0}
              hintText={
                Math.random() < 0.1 &&
                enemyItems.length !== 0 &&
                !allEnemiesHidden
                  ? "I need a hero!"
                  : "The party seems to be empty..."
              }
            />

            <List ref={listRef0} sx={{ py: 0 }}>
              {partyItems.map((item) => (
                <InitiativeListItem
                  key={item.id}
                  item={item}
                  onReadyChange={(ready) => {
                    handleReadyChange(
                      item.id,
                      ready,
                      previousStack.length > 1
                        ? (previousStack.at(previousStack.length - 2) as string)
                        : "",
                    );
                  }}
                  showHidden={role === "GM"}
                  edit={editMode}
                />
              ))}
            </List>

            <SortableGroupHeading groupName="Adversaries" />
            <List ref={listRef1} sx={{ py: 0 }}>
              {enemyItems.map((item) => (
                <InitiativeListItem
                  key={item.id}
                  item={item}
                  onReadyChange={(ready) => {
                    handleReadyChange(
                      item.id,
                      ready,
                      previousStack.length > 1
                        ? (previousStack.at(previousStack.length - 2) as string)
                        : "",
                    );
                  }}
                  showHidden={role === "GM"}
                  edit={editMode}
                />
              ))}
            </List>
            <GroupHint
              visible={
                enemyItems.length === 0 || (allEnemiesHidden && role !== "GM")
              }
              hintText={
                partyItems.length === 0
                  ? "The action must be elsewhere..."
                  : "The party stands uncontested"
              }
            />
          </Box>
        </Stack>
      </SortableContext>
    </DndContext>
  );
}

type GroupHeadingProps = {
  groupName: string;
};
const GroupHeading = ({ groupName }: GroupHeadingProps) => {
  return (
    <div
      style={{
        minHeight: 46,
        display: "flex",
        flexDirection: "column",
        justifyContent: "end",
      }}
    >
      <Typography
        variant="overline"
        sx={{
          px: 2,
          py: 0.5,
          display: "inline-block",
          color: "text.secondary",
        }}
      >
        {groupName}
      </Typography>

      <Divider variant="fullWidth" />
    </div>
  );
};

const GroupHint = ({
  visible,
  hintText,
}: {
  visible: boolean;
  hintText: string;
}) => {
  if (!visible) return null;
  return (
    <Typography
      variant="caption"
      sx={{
        px: 2,
        py: 1,
        display: "inline-block",
        color: "text.secondary",
      }}
    >
      {hintText}
    </Typography>
  );
};

const getGroupDividerId = (groupName: string) => `${groupName}_GROUP_DIVIDER`;
const SortableGroupHeading = (groupHeadingProps: GroupHeadingProps) => {
  const { attributes, setNodeRef, transform, transition } = useSortable({
    id: getGroupDividerId(groupHeadingProps.groupName),
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={{ ...style }} {...attributes}>
      <GroupHeading {...groupHeadingProps} />
    </div>
  );
};
