import { Tooltip } from "@mui/material";
import { cn } from "../utils";

export default function LinkButton({
  name,
  icon,
  href,
  size,
}: {
  name: string;
  icon: JSX.Element;
  href: string;
  size?: "base" | "large";
}): JSX.Element {
  return (
    <Tooltip title={name}>
      <a
        className={cn(
          "focus-visible:ring-secondary dark:focus-visible:ring-secondary-dark flex items-center justify-center border border-gray-300 fill-gray-800 stroke-gray-800 outline-none hover:bg-gray-200 focus-visible:ring-2 dark:border-gray-700 dark:fill-gray-50 dark:stroke-gray-50 dark:hover:bg-gray-700",
          {
            "size-[36px] rounded-lg": size === "base" || size === undefined,
            "size-10 rounded-full": size === "large",
          },
        )}
        target="_blank"
        rel="noreferrer noopener"
        href={href}
      >
        {icon}
      </a>
    </Tooltip>
  );
}
