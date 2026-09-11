declare module "lucide-react" {
  import * as React from "react";

  export type LucideProps = React.SVGProps<SVGSVGElement> & {
    color?: string;
    size?: string | number;
    strokeWidth?: string | number;
    absoluteStrokeWidth?: boolean;
  };

  export type LucideIcon = React.ForwardRefExoticComponent<
    LucideProps & React.RefAttributes<SVGSVGElement>
  >;

  const icon: LucideIcon;
  export default icon;

  export const AlertCircle: LucideIcon;
  export const AlertTriangle: LucideIcon;
  export const ArrowLeft: LucideIcon;
  export const ArrowRight: LucideIcon;
  export const Calendar: LucideIcon;
  export const Check: LucideIcon;
  export const ChevronDown: LucideIcon;
  export const ChevronDownIcon: LucideIcon;
  export const ChevronLeft: LucideIcon;
  export const ChevronLeftIcon: LucideIcon;
  export const ChevronRight: LucideIcon;
  export const ChevronRightIcon: LucideIcon;
  export const ChevronUp: LucideIcon;
  export const ChevronUpIcon: LucideIcon;
  export const Circle: LucideIcon;
  export const Clapperboard: LucideIcon;
  export const Clock: LucideIcon;
  export const Eye: LucideIcon;
  export const EyeOff: LucideIcon;
  export const Film: LucideIcon;
  export const GripVertical: LucideIcon;
  export const Heart: LucideIcon;
  export const HeartOff: LucideIcon;
  export const Loader2: LucideIcon;
  export const LogOut: LucideIcon;
  export const Minus: LucideIcon;
  export const MoreHorizontal: LucideIcon;
  export const PanelLeft: LucideIcon;
  export const Plus: LucideIcon;
  export const Search: LucideIcon;
  export const SearchX: LucideIcon;
  export const SlidersHorizontal: LucideIcon;
  export const Sparkles: LucideIcon;
  export const Star: LucideIcon;
  export const Trash2: LucideIcon;
  export const User: LucideIcon;
  export const X: LucideIcon;
}
