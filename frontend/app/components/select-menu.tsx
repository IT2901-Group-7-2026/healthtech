import type { TranslateFn } from "@/i18n/config.js";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "@/ui/select";

type OptionGroup<T extends string> = {
	label?: TranslateFn;
	valueLabel?: TranslateFn;
	key: string;
	items: Array<T>;
};

export function SelectMenu<T extends string>({
	options,
	defaultValue,
	placeholder,
	onChange,
}: {
	options: Array<OptionGroup<T>> | OptionGroup<T>;
	defaultValue?: T;
	placeholder: string;
	onChange: (T: T) => void;
}) {
	options = Array.isArray(options) ? options : [options];
	return (
		<Select value={defaultValue} onValueChange={onChange}>
			<SelectTrigger className="w-32">
				<SelectValue placeholder={placeholder} />
			</SelectTrigger>
			<SelectContent className="w-32">
				{options.map(({ label, key, items }) => (
					<SelectGroup key={key}>
						{label && <SelectLabel>{label}</SelectLabel>}
						{items.map((value) => (
							<SelectItem key={`${key} ${value}`} value={value}>
								{value}
							</SelectItem>
						))}
					</SelectGroup>
				))}
			</SelectContent>
		</Select>
	);
}
