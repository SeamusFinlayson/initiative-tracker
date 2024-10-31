import OBR, { Vector2, Math2, buildLabel } from "@owlbear-rodeo/sdk";

export async function deselectText() {
  // Deselect the list item text
  window.getSelection()?.removeAllRanges();
}

export async function selectItem(itemId: string) {
  OBR.player.select([itemId]);
}

export async function focusItem(itemId: string) {
  // User may have selected text by double clicking on the initiative item
  deselectText();

  // Select this item
  await selectItem(itemId);

  // Focus on this item

  // Convert the center of the selected item to screen-space
  const bounds = await OBR.scene.items.getItemBounds([itemId]);
  const boundsAbsoluteCenter = await OBR.viewport.transformPoint(bounds.center);

  // Get the center of the viewport in screen-space
  const viewportWidth = await OBR.viewport.getWidth();
  const viewportHeight = await OBR.viewport.getHeight();
  const viewportCenter: Vector2 = {
    x: viewportWidth / 2,
    y: viewportHeight / 2,
  };

  // Offset the item center by the viewport center
  const absoluteCenter = Math2.subtract(boundsAbsoluteCenter, viewportCenter);

  // Convert the center to world-space
  const relativeCenter =
    await OBR.viewport.inverseTransformPoint(absoluteCenter);

  // Invert and scale the world-space position to match a viewport position offset
  const viewportScale = await OBR.viewport.getScale();
  const viewportPosition = Math2.multiply(relativeCenter, -viewportScale);

  await OBR.viewport.animateTo({
    scale: viewportScale,
    position: viewportPosition,
  });
}

const labelId = "prettySordidActiveLabel";

export async function labelItem(itemId: string) {
  const bounds = await OBR.scene.items.getItemBounds([itemId]);
  const sceneDpi = await OBR.scene.grid.getDpi();

  const label = buildLabel()
    .id(labelId)
    .position({
      x: bounds.center.x,
      y: bounds.min.y - sceneDpi / 30,
    })
    .style({
      backgroundColor: "#3D4051",
      backgroundOpacity: 0.7,
      cornerRadius: 8,
      pointerDirection: "DOWN",
      pointerWidth: (sceneDpi / 150) * 8,
      pointerHeight: (sceneDpi / 150) * 8,
    })
    .maxViewScale(1.5)
    .minViewScale(0.8)
    .backgroundOpacity(1)
    .plainText("Your Turn!")
    .attachedTo(itemId)
    .locked(true)
    .build();

  OBR.scene.items.addItems([label]);
}

export async function removeLabel() {
  OBR.scene.local.deleteItems([labelId]);
}
