import {
	Combobox,
	ComboboxChip,
	ComboboxChips,
	ComboboxChipsInput,
	ComboboxContent,
	ComboboxEmpty,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
	ComboboxValue,
} from "@/components/ui/combobox.js";
import type { User } from "@/lib/dto.js";
import type { ComboboxRootProps } from "@base-ui/react";

type UserSearchProps<Multiple extends boolean = false> = Exclude<ComboboxRootProps<User, Multiple>, "placeholder"> & {
	users: Array<User>;
	placeholder: string;
	emptyLabel: string;
};

export const UserSearch = <Multiple extends boolean = false>({
	users,
	placeholder,
	emptyLabel,
	...props
}: UserSearchProps<Multiple>) => {
	return (
		<Combobox
			{...props}
			items={users}
			// God knows why I have to explicitly type this one but not the other
			itemToStringValue={(user: User) => user.id}
			itemToStringLabel={(user) => user.name}
		>
			{props.multiple && props.value && Array.isArray(props.value) ? (
				<ComboboxChips>
					<ComboboxValue>
						{props.value.map((item) => (
							<ComboboxChip key={item.id}>{item.name}</ComboboxChip>
						))}
					</ComboboxValue>
					<ComboboxChipsInput placeholder={placeholder} />
				</ComboboxChips>
			) : (
				<ComboboxInput placeholder={placeholder} />
			)}
			<ComboboxContent>
				<ComboboxEmpty>{emptyLabel}</ComboboxEmpty>
				<ComboboxList>
					{(user: User) => (
						<ComboboxItem key={user.id} value={user}>
							{user.name}
						</ComboboxItem>
					)}
				</ComboboxList>
			</ComboboxContent>
		</Combobox>
	);
};
