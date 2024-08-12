import OBR, { Metadata } from "@owlbear-rodeo/sdk";
import { InitiativeItem } from "../InitiativeItem";
import { getPluginId } from "../getPluginId";
import { useEffect, useState } from "react";

/** Sort items in place and write sorted order to the scene. */
export function sortList(items: InitiativeItem[], sortAscending = false) {
  // Sort items
  const sorted = items.sort(
    sortAscending
      ? (a, b) => parseFloat(a.count) - parseFloat(b.count)
      : (a, b) => parseFloat(b.count) - parseFloat(a.count)
  );

  // Build a index: id object to represent initiative order
  let order: Order = {};
  for (let i = 0; i < sorted.length; i++) {
    order = { ...order, [i]: sorted[i].id };
  }

  OBR.scene.setMetadata({ [getPluginId("order")]: order });

  return items;
}

/** A hook that provides up to date access to the initiative order stored in the scene. */
export function useOrder() {
  const [order, setOrder] = useState({});

  useEffect(() => {
    const updateOrder = (sceneMetadata: Metadata) => {
      setOrder(getOrder(sceneMetadata));
    };
    OBR.scene.getMetadata().then(sceneMetadata => {
      updateOrder(sceneMetadata);
    });
    return OBR.scene.onMetadataChange(sceneMetadata => {
      updateOrder(sceneMetadata);
    });
  }, []);

  return order;
}

/** Extract order object from scene metadata. */
function getOrder(sceneMetadata: Metadata) {
  try {
    const orderMetadata: object = JSON.parse(JSON.stringify(sceneMetadata))[
      getPluginId("order")
    ];
    return orderMetadata;
  } catch (error) {
    return {};
  }
}

/** Sorts the items items according to the order retrieved from the scene. */
export function sortFromOrder(items: InitiativeItem[], order: object) {
  // Ensure order object is valid
  if (typeof order === "undefined") {
    return items;
  }
  const values = Object.values(order);
  if (values.length === 0) {
    return items;
  }

  // Add sorted items to the initiative list
  const newItems: InitiativeItem[] = [];
  for (let i = 0; i < values.length; i++) {
    const item = items.find(item => item.id === values[i]);
    if (typeof item !== "undefined") {
      newItems.push(item);
    }
  }

  // Add any remaining unsorted items to the initiative list
  for (let i = 0; i < items.length; i++) {
    const found = newItems.find(item => item.id === items[i].id);
    if (typeof found === "undefined") {
      newItems.push(items[i]);
    }
  }

  return newItems;
}

interface Order {
  [position: number]: string;
}
