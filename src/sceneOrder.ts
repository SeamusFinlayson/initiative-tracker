import OBR, { Metadata } from "@owlbear-rodeo/sdk";
import { InitiativeItem } from "./InitiativeItem";
import { getPluginId } from "./getPluginId";

export function sortList(items: InitiativeItem[]) {

    // console.log(items)
    const sorted = items.sort(
        (a, b) => parseFloat(b.count) - parseFloat(a.count)
    );

    let order: Order = {};
    for (let i = 0; i < sorted.length; i++) {
        order = { ...order, [i]: sorted[i].id }
    }

    // console.log(sorted)
    // console.log(order)
    OBR.scene.setMetadata({ [getPluginId("order")]: order });

    return sorted;
}

export function getOrder(sceneMetadata: Metadata) {

    try {
        const orderMetadata: Object = JSON.parse(JSON.stringify(sceneMetadata))[getPluginId("order")];
        return orderMetadata;
    } catch (error) {
        return {};
    }
}

export function sortFromOrder(items: InitiativeItem[], order: Object) {

    if (typeof order === "undefined") {
        return items;
    }
        const values = Object.values(order);
    
    if (values.length === 0) {
        return items;
    }
    
    let newItems: InitiativeItem[] = [];
    for (let i = 0; i < values.length; i++) {
        const item = items.find((item) => item.id === values[i]);
        if (typeof item !== "undefined") {
            newItems.push(item);
            // console.log(item.count)
        }
    }

    for (let i = 0; i < items.length; i++) {
        const found = newItems.find((item) => item.id === items[i].id);
        if (typeof found === "undefined") {
            newItems.push(items[i]);
            // console.log(items[i].name, items[i].count)
        }
    }

    return newItems;
}

interface Order {
    [position: number]: string;
}