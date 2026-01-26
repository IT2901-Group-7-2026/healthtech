import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "@/ui/select";
import { t } from "i18next";

type OptionGroup<T extends string> = {
	label?: string;
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
						{label && <SelectLabel>{t(label) ?? label}</SelectLabel>}
						{items.map((value) => (
							<SelectItem key={`${key} ${value}`} value={value}>
								{t(value) ?? value}
							</SelectItem>
						))}
					</SelectGroup>
				))}
			</SelectContent>
		</Select>
	);
}
