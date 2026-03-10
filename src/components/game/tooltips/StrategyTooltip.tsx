import * as React from 'react';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const SURFACE_CLASSNAME = 'rounded-xl border border-primary/15 bg-slate-950/95 p-3 text-popover-foreground shadow-[0_16px_40px_rgba(0,0,0,0.42)] backdrop-blur-md';

export const StrategyTooltipProvider: React.FC<React.ComponentProps<typeof TooltipProvider>> = ({
  delayDuration = 120,
  children,
  ...props
}) => (
  <TooltipProvider delayDuration={delayDuration} {...props}>
    {children}
  </TooltipProvider>
);

export const StrategyTooltip = Tooltip;
export const StrategyTooltipTrigger = TooltipTrigger;

export const StrategyTooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipContent>,
  React.ComponentPropsWithoutRef<typeof TooltipContent>
>(({ className, sideOffset = 8, ...props }, ref) => (
  <TooltipContent
    ref={ref}
    sideOffset={sideOffset}
    className={cn(SURFACE_CLASSNAME, className)}
    {...props}
  />
));
StrategyTooltipContent.displayName = 'StrategyTooltipContent';

export const StrategyTooltipSurface: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={cn(SURFACE_CLASSNAME, className)} {...props} />
);
