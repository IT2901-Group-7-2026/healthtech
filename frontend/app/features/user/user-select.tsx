import { Button } from "@/components/ui/button";
import { Combobox, ComboboxContent, ComboboxInput, ComboboxItem, ComboboxList } from "@/components/ui/combobox";
import { cn } from "@/lib/utils";
import { XIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

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
	const { t } = useTranslation();

	const disabled = !users || users.length === 0;

	const items = users.map((user) => ({
		value: user.id,
		label: user.name,
	}));

	const resolveItemLabel = (item: string | UserSelectListItem) => userSelectItemToStringLabel(item, users);

	function handleComboboxValueChange(nextValue: string | UserSelectListItem | null) {
		if (nextValue === null) {
			onValueChange(null);
			return;
		}

		if (typeof nextValue === "string") {
			onValueChange(nextValue);
			return;
		}

		onValueChange(nextValue.value);
	}

	return (
		<div className="flex gap-1">
			<Combobox
				items={items}
				disabled={disabled}
				value={value ?? undefined}
				onValueChange={handleComboboxValueChange}
				itemToStringLabel={resolveItemLabel}
			>
				<ComboboxInput
					placeholder={placeholder}
					disabled={disabled}
					className={cn(
						"rounded-r-md rounded-l-xl bg-background font-medium dark:bg-input/30",
						inputClassName,
					)}
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
				aria-label={t(($) => $.foremanDashboard.overview.clearUserSelection)}
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

type UserSelectListItem = { value: string; label: string };

function userSelectItemToStringLabel(item: string | UserSelectListItem, users: Array<UserSelectUser>): string {
	if (typeof item === "string") {
		return users.find((user) => user.id === item)?.name ?? "";
	}

	if (item.label == null) {
		return "";
	}

	return String(item.label);
}
