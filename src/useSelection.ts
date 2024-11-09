import OBR from "@owlbear-rodeo/sdk";
import { useEffect, useState } from "react";

export default function useSelection() {
  const [selection, setSelection] = useState<string[]>([]);

  useEffect(() => {
    const handleSelectionChange = (selection: string[] | undefined) => {
      if (selection === undefined) setSelection([]);
      else setSelection(selection);
    };
    OBR.player.getSelection().then(handleSelectionChange);
    return OBR.player.onChange((player) =>
      handleSelectionChange(player.selection),
    );
  }, []);

  return selection;
}
