import { useEffect, useRef, useState } from "react";

import Stack from "@mui/material/Stack";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import Box from "@mui/material/Box";

import SkipNextRounded from "@mui/icons-material/SkipNextRounded";
import SortIcon from '@mui/icons-material/Sort';


import OBR, { isImage, Item, Player } from "@owlbear-rodeo/sdk";

import { InitiativeItem } from "./InitiativeItem";

import addIcon from "./assets/add.svg";
import removeIcon from "./assets/remove.svg";

import { InitiativeListItem } from "./InitiativeListItem";
import { getPluginId } from "./getPluginId";
import { InitiativeHeader } from "./InitiativeHeader";
import { isPlainObject } from "./isPlainObject";
import { sortFromOrder, sortList } from "./sceneOrder";
import { useOrder } from "./useOrder";

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

export function InitiativeTracker() {
  const [initiativeItems, setInitiativeItems] = useState<InitiativeItem[]>([]);
  const [role, setRole] = useState<"GM" | "PLAYER">("PLAYER");

  useEffect(() => {
    const handlePlayerChange = (player: Player) => {
      setRole(player.role);
    };
    OBR.player.getRole().then(setRole);
    return OBR.player.onChange(handlePlayerChange);
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
        OBR.scene.items.updateItems(context.items, (items) => {
          // Check whether to add the items to initiative or remove them
          const addToInitiative = items.every(
            (item) => item.metadata[getPluginId("metadata")] === undefined
          );
          let count = 0;
          for (let item of items) {
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

  function handleNextClick() {
    // Get the next index to activate
    const sorted = sortFromOrder(initiativeItems, order);
    // console.log(sorted)

    const nextIndex = (sorted.findIndex((initiative) => initiative.active) + 1) % sorted.length;

    // Set local items immediately
    setInitiativeItems(() => {
      return sorted.map((item, index) => ({
        ...item,
        active: index === nextIndex,
      }));
    });
    // Update the scene items with the new active status
    OBR.scene.items.updateItems(
      sorted.map((init) => init.id),
      (items) => {
        for (let i = 0; i < items.length; i++) {
          let item = items[i];
          const metadata = item.metadata[getPluginId("metadata")];
          if (isMetadata(metadata)) {
            metadata.active = i === nextIndex;
          }
        }
      }
    );
  }

  function handleInitiativeCountChange(id: string, newCount: string) {
    // Set local items immediately
    setInitiativeItems((prev) =>
      prev.map((item) => {
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
    OBR.scene.items.updateItems([id], (items) => {
      for (let item of items) {
        const metadata = item.metadata[getPluginId("metadata")];
        if (isMetadata(metadata)) {
          metadata.count = newCount;
        }
      }
    });
  }

  const listRef = useRef<HTMLUListElement>(null);
  useEffect(() => {
    if (listRef.current && ResizeObserver) {
      const resizeObserver = new ResizeObserver((entries) => {
        if (entries.length > 0) {
          const entry = entries[0];
          // Get the height of the border box
          // In the future you can use `entry.borderBoxSize`
          // however as of this time the property isn't widely supported (iOS)
          const borderHeight = entry.contentRect.bottom + entry.contentRect.top;
          // Set a minimum height of 64px
          const listHeight = Math.max(borderHeight, 64);
          // Set the action height to the list height + the card header height + the divider
          OBR.action.setHeight(listHeight + 64 + 1);
        }
      });
      resizeObserver.observe(listRef.current);
      return () => {
        resizeObserver.disconnect();
        // Reset height when unmounted
        OBR.action.setHeight(129);
      };
    }
  }, []);

  const order = useOrder();
  const sortedInitiativeItems = sortFromOrder(initiativeItems, order);

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
            <IconButton
              onClick={() => sortList(initiativeItems)}
            >
              <SortIcon></SortIcon>
            </IconButton>
            <IconButton
              aria-label="next"
              onClick={handleNextClick}
              disabled={initiativeItems.length === 0}
            >
              <SkipNextRounded />
            </IconButton>
          </>
        }
      />
      <Box sx={{ overflowY: "auto" }}>
        <List ref={listRef}>
          {sortedInitiativeItems
            .map((item) => (
              <InitiativeListItem
                key={item.id}
                item={item}
                onCountChange={(newCount) => {
                  handleInitiativeCountChange(item.id, newCount);
                }}
                showHidden={role === "GM"}
              />
            ))}
        </List>
      </Box>
    </Stack>
  );
}
