import React from "react";

interface CinexLogoProps {
  height?: number | string;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  alt?: string;
}

export const CinexLogo: React.FC<CinexLogoProps> = ({
  height = 28,
  className = "",
  style,
  onClick,
  alt = "CineX"
}) => {
  return (
    <img
      src="/cinex-logo.png"
      alt={alt}
      className={`cinex-brand-logo ${className}`.trim()}
      onClick={onClick}
      style={{
        height,
        width: "auto",
        objectFit: "contain",
        display: "inline-block",
        verticalAlign: "middle",
        cursor: onClick ? "pointer" : "default",
        ...style
      }}
    />
  );
};
