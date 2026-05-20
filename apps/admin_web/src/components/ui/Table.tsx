import React from 'react';
import { clsx } from 'clsx';

type TableProps = React.TableHTMLAttributes<HTMLTableElement>;

export function Table({ className, ...props }: TableProps) {
  return (
    <div className="w-full overflow-auto rounded-xl border border-border-default bg-surface">
      <table className={clsx("w-full caption-bottom text-sm", className)} {...props} />
    </div>
  );
}

export function TableHeader({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={clsx("[&_tr]:border-b bg-background-subtle", className)} {...props} />;
}

export function TableBody({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={clsx("[&_tr:last-child]:border-0", className)} {...props} />;
}

export function TableFooter({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tfoot className={clsx("bg-background-subtle font-medium [&>tr]:last:border-b-0", className)} {...props} />;
}

export function TableRow({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={clsx(
        "border-b border-border-default transition-colors hover:bg-background-subtle/50 data-[state=selected]:bg-background-subtle",
        className
      )}
      {...props}
    />
  );
}

export function TableHead({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={clsx(
        "h-12 px-4 text-left align-middle font-bold text-text-secondary uppercase tracking-wider text-[11px] [&:has([role=checkbox])]:pr-0",
        className
      )}
      {...props}
    />
  );
}

export function TableCell({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={clsx("p-4 align-middle text-text-primary [&:has([role=checkbox])]:pr-0", className)}
      {...props}
    />
  );
}
