import {
	type ColumnDef,
	flexRender,
	getCoreRowModel,
	type TableOptions,
	useReactTable,
} from "@tanstack/react-table";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import type { TranslateFn } from "@/i18n/config.js";

type DataTableProps<TData, TValue> = Omit<
	TableOptions<TData>,
	"columns" | "getCoreRowModel"
> & {
	columns: Array<ColumnDef<TData, TValue>>;
	selectionLabelT?: TranslateFn;
};

export function DataTable<TData, TValue>({
	selectionLabelT,
	columns,
	data,
	...options
}: DataTableProps<TData, TValue>) {
	const table = useReactTable({
		...options,
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
	});

	return (
		<div className="flex flex-col gap-1 rounded-md border">
			<div className="max-h-[min(calc(var(--spacing)*150),70dvh)] overflow-y-auto">
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => {
									return (
										<TableHead key={header.id}>
											{header.isPlaceholder
												? null
												: flexRender(
														header.column.columnDef.header,
														header.getContext(),
													)}
										</TableHead>
									);
								})}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{table.getRowModel().rows?.length ? (
							table.getRowModel().rows.map((row) => (
								<TableRow
									key={row.id}
									data-state={row.getIsSelected() && "selected"}
								>
									{row.getVisibleCells().map((cell) => (
										<TableCell key={cell.id}>
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext(),
											)}
										</TableCell>
									))}
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell
									colSpan={columns.length}
									className="h-24 text-center"
								>
									No results.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
			{selectionLabelT !== undefined && (
				<p className="ml-1 p-1 text-muted-foreground flex-1 text-xs">
					{selectionLabelT(($) => $.table.numberOfRowsSelected, {
						selected: table.getFilteredSelectedRowModel().rows.length,
						total: table.getFilteredRowModel().rows.length,
					})}
				</p>
			)}
		</div>
	);
}
