import { useTheme } from "../../../core/theme/theme-context";
import logoMain from "../../assets/logos/originals/logo-main.png";
import logoStacked from "../../assets/logos/originals/logo-stacked.png";
import logoSymbol from "../../assets/logos/originals/logo-symbol.png";
import logoMainWhite from "../../assets/logos/white-versions/logo-main-white.png";
import logoStackedWhite from "../../assets/logos/white-versions/logo-stacked-white.png";
import logoSymbolWhite from "../../assets/logos/white-versions/logo-symbol-white.png";

type StratixLogoProps = {
  variant?: "horizontal" | "stacked" | "symbol";
  theme?: "light" | "dark" | "auto";
  className?: string;
  imgClassName?: string;
  alt?: string;
};

const logoMap = {
  light: {
    horizontal: logoMain,
    stacked: logoStacked,
    symbol: logoSymbol,
  },
  dark: {
    horizontal: logoMainWhite,
    stacked: logoStackedWhite,
    symbol: logoSymbolWhite,
  },
} as const;

export function StratixLogo({
  variant = "horizontal",
  theme = "light",
  className,
  imgClassName,
  alt = "STRATIX",
}: StratixLogoProps) {
  const { resolvedTheme } = useTheme();
  const resolvedVariantTheme = theme === "auto" ? resolvedTheme : theme;
  const src = logoMap[resolvedVariantTheme][variant];

  return (
    <div className={className}>
      <img className={imgClassName} src={src} alt={alt} />
    </div>
  );
}
