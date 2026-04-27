import { Button } from "@/components/ui/button";
import { Combobox, ComboboxContent, ComboboxInput, ComboboxItem, ComboboxList } from "@/components/ui/combobox";
import { cn } from "@/lib/utils";
import { XIcon } from "lucide-react";

export type UserSelectUser = { id: string; name: string };

interface UserSelectProps {
	users: Array<UserSelectUser>;
	value: string | null;
	onValueChange: (value: string | null) => void;
	placeholder: string;
	inputClassName?: string;
	contentClassName?: string;
	itemClassName?: string;
}

export function UserSelect({
	users,
	value,
	onValueChange,
	placeholder,
	inputClassName,
	contentClassName,
	itemClassName,
}: UserSelectProps) {
	const disabled = !users || users.length === 0;
	const selectedUser = users?.find((u) => u.id === value);

	const items = users.map((u) => ({
		value: u.id,
		label: u.name,
	}));

	return (
		<div className="flex gap-1">
			<Combobox items={items} disabled={disabled} value={value ?? undefined} onValueChange={onValueChange}>
				<ComboboxInput
					placeholder={placeholder}
					disabled={disabled}
					className={cn(
						"rounded-r-md rounded-l-xl bg-background font-medium dark:bg-input/30",
						inputClassName,
					)}
					value={selectedUser?.name ?? ""}
				/>
				<ComboboxContent className={cn("rounded-xl", contentClassName)}>
					<ComboboxList>
						{(item) => (
							<ComboboxItem
								key={item.value}
								value={item.value}
								className={cn("rounded-lg", itemClassName)}
							>
								{item.label}
							</ComboboxItem>
						)}
					</ComboboxList>
				</ComboboxContent>
			</Combobox>

			<Button
				aria-label="Clear user selection"
				variant="outline"
				size="icon"
				onClick={() => onValueChange(null)}
				disabled={disabled || value === null}
				className="rounded-r-xl"
			>
				<XIcon className="size-4" aria-hidden="true" />
			</Button>
		</div>
	);
}
