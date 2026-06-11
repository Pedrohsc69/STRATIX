import { useTheme } from "../../../core/theme/theme-context";
import logoMain from "../../assets/logos/originals/logo-main.png";
import logoStacked from "../../assets/logos/originals/logo-stacked.png";
import logoSymbol from "../../assets/logos/originals/logo-symbol.png";
import logoMainWhite from "../../assets/logos/white-versions/logo-main-white.png";
import logoStackedWhite from "../../assets/logos/white-versions/logo-stacked-white.png";
import logoSymbolWhite from "../../assets/logos/white-versions/logo-symbol-white.png";

type StratixLogoProps = {
  variant?: "light" | "dark" | "auto";
  type?: "full" | "symbol" | "stacked";
  className?: string;
  imgClassName?: string;
  alt?: string;
};

const logoMap = {
  light: {
    full: logoMain,
    symbol: logoSymbol,
    stacked: logoStacked,
  },
  dark: {
    full: logoMainWhite,
    symbol: logoSymbolWhite,
    stacked: logoStackedWhite,
  },
} as const;

export function StratixLogo({
  variant = "light",
  type = "full",
  className,
  imgClassName,
  alt = "STRATIX",
}: StratixLogoProps) {
  const { resolvedTheme } = useTheme();
  const resolvedVariant = variant === "auto" ? resolvedTheme : variant;
  const src = logoMap[resolvedVariant][type];

  return (
    <div className={className}>
      <img className={`object-contain ${imgClassName ?? ""}`} src={src} alt={alt} />
    </div>
  );
}
