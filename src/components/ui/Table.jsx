import { cn } from '../../utils/cn';

const Table = ({ children, className, ...props }) => {
  return (
    <div className="overflow-x-auto">
      <table className={cn('w-full', className)} {...props}>
        {children}
      </table>
    </div>
  );
};

const TableHeader = ({ children, className, ...props }) => {
  return (
    <thead className={cn('bg-[#1F2833] border-b border-[#66FCF1]/20', className)} {...props}>
      {children}
    </thead>
  );
};

const TableBody = ({ children, className, ...props }) => {
  return (
    <tbody className={cn('divide-y divide-[#66FCF1]/10', className)} {...props}>
      {children}
    </tbody>
  );
};

const TableRow = ({ children, className, hover = true, ...props }) => {
  return (
    <tr
      className={cn(
        'border-b border-[#66FCF1]/10 transition-colors duration-200',
        hover && 'hover:bg-[#0B0C10]/50 group',
        className
      )}
      {...props}
    >
      {children}
    </tr>
  );
};

const TableHead = ({ children, className, ...props }) => {
  return (
    <th
      className={cn(
        'text-left py-4 px-4 text-sm font-semibold text-[#66FCF1]',
        className
      )}
      {...props}
    >
      {children}
    </th>
  );
};

const TableCell = ({ children, className, ...props }) => {
  return (
    <td
      className={cn('py-4 px-4 text-sm text-white', className)}
      {...props}
    >
      {children}
    </td>
  );
};

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell };
