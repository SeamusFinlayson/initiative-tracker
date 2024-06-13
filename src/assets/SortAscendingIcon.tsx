export default function SortAscendingIcon({
  darkMode,
}: {
  darkMode: boolean;
}): JSX.Element {
  return (
    // This svg is licensed under the Zest Free License which can be found in attributions.md
    <svg
      width="36px"
      height="36px"
      viewBox="1 1 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M7.00002 5C7.00002 4.44772 6.5523 4 6.00002 4C5.44773 4 5.00002 4.44772 5.00002 5V16.5858L3.7071 15.2929C3.31658 14.9024 2.68341 14.9024 2.29289 15.2929C1.90237 15.6834 1.90237 16.3166 2.2929 16.7071L5.29291 19.7071C5.68344 20.0976 6.3166 20.0976 6.70713 19.7071L9.70713 16.7071C10.0977 16.3166 10.0977 15.6834 9.70713 15.2929C9.3166 14.9024 8.68344 14.9024 8.29291 15.2929L7.00002 16.5858V5ZM13 6C12.4477 6 12 6.44772 12 7C12 7.55228 12.4477 8 13 8H14C14.5523 8 15 7.55228 15 7C15 6.44772 14.5523 6 14 6H13ZM13 11C12.4477 11 12 11.4477 12 12C12 12.5523 12.4477 13 13 13H17C17.5523 13 18 12.5523 18 12C18 11.4477 17.5523 11 17 11H13ZM13 16C12.4477 16 12 16.4477 12 17C12 17.5523 12.4477 18 13 18H21C21.5523 18 22 17.5523 22 17C22 16.4477 21.5523 16 21 16H13Z"
        fill={darkMode ? "rgb(255, 255, 255)" : "rgba(0, 0, 0, 0.58)"}
      />
    </svg>
  );
}
