import React from "react";
import { TableHead, TableCell } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export const CustomTableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <TableHead
    ref={ref}
    className={cn(
      "border-r border-border text-sm font-extrabold tracking-widest text-foreground py-4",
      className,
    )}
    {...props}
  />
));
CustomTableHead.displayName = "CustomTableHead";

export const CustomTableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <TableCell
    ref={ref}
    className={cn("border-r border-border whitespace-nowrap", className)}
    {...props}
  />
));
CustomTableCell.displayName = "CustomTableCell";
