interface IconLogoProps {
  className?: string;
  width?: number;
  height?: number;
  variant?: "ko" | "en";
  isDarkMode?: boolean;
}

export default function IconLogo({
  className = "",
  width = 100,
  height = 36,
  variant = "ko",
  isDarkMode = false,
}: IconLogoProps) {
  const getLogoSrc = () => {
    if (variant === "ko") {
      return "/images/logo-ko.svg"; // 다크/라이트 모드 공용
    }

    if (variant === "en") {
      return isDarkMode ? "/images/logo-en-white.svg" : "/images/logo-en.svg";
    }

    return "/images/logo-ko.svg";
  };

  return (
    <img
      src={getLogoSrc()}
      alt={variant === "ko" ? "갓생상사" : "GOATLIFE"}
      width={width}
      height={height}
      className={className}
    />
  );
}
