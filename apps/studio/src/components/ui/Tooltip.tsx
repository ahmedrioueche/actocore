import { useId } from "react";
import { Tooltip as ReactTooltip } from "react-tooltip";
import "react-tooltip/dist/react-tooltip.css";

interface TooltipProps {
  children: React.ReactNode;
  content: string;
  place?: "top" | "right" | "bottom" | "left";
  className?: string;
}

const Tooltip = ({
  children,
  content,
  place = "top",
  className = "",
}: TooltipProps) => {
  const id = useId();

  return (
    <>
      <div
        data-tooltip-id={id}
        data-tooltip-content={content}
        className={className}
      >
        {children}
      </div>
      <ReactTooltip
        id={id}
        place={place}
        style={{
          backgroundColor: "rgb(24, 24, 27)", // zinc-900
          color: "rgb(244, 244, 245)", // zinc-100
          padding: "6px 12px",
          borderRadius: "8px",
          fontSize: "12px",
          fontWeight: "500",
          zIndex: 100,
          boxShadow:
            "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
          border: "1px solid rgb(39, 39, 42)", // zinc-800
        }}
      />
    </>
  );
};

export default Tooltip;
