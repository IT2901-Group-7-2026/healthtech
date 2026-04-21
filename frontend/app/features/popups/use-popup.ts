import { useCallback, useState } from "react";

type PopupToShow = "notifications" | "profile" | "privacySettings" | null;

export function usePopup() {
	const [visible, setVisible] = useState<PopupToShow>(null);
	const closePopup = useCallback(() => setVisible(null), []);
	const openPopup = useCallback((popup: PopupToShow) => setVisible(popup), []);
	//const togglePopup = useCallback(() => setVisible((prevState) => !prevState),[]);

	return { visible, closePopup, openPopup };
}
