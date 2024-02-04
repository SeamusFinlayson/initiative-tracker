import OBR, { Metadata } from "@owlbear-rodeo/sdk";
import { useEffect, useState } from "react";
import { getOrder } from "./sceneOrder";

export function useOrder() {

    const [order, setOrder] = useState({});

    useEffect(
        () => {
            const updateOrder = (sceneMetadata: Metadata) => {
                setOrder(getOrder(sceneMetadata))
            }
            OBR.scene.getMetadata().then((sceneMetadata) => {updateOrder(sceneMetadata)});
            return OBR.scene.onMetadataChange((sceneMetadata) => {updateOrder(sceneMetadata)});
        },
        []
    );

    return order;
}