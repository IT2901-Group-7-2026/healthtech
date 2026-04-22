import { useCallback, useState } from "react";

export function usePopup() {
	const [visible, setVisible] = useState(false);
	const closePopup = useCallback(() => setVisible(false), []);
	const openPopup = useCallback(() => setVisible(true), []);

	return { visible, closePopup, openPopup };
}
