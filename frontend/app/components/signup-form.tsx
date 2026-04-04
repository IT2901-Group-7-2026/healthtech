import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useId } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Checkbox } from "./ui/checkbox.js";

export function SignupForm({ ...props }: React.ComponentProps<typeof Card>) {
	const nameId = useId();
	const emailId = useId();
	const passwordId = useId();
	const confirmPasswordId = useId();
	const privacyConsentId = useId();

	const { t } = useTranslation();

	return (
		<Card {...props}>
			<CardHeader>
				<CardTitle>{t(($) => $.register.title)}</CardTitle>
			</CardHeader>
			<CardContent>
				<form>
					<FieldGroup>
						<Field>
							<FieldLabel htmlFor={nameId}>{t(($) => $.register.name)}</FieldLabel>
							<Input id={nameId} type="text" placeholder={"Ola Nordmann"} required={true} />
						</Field>
						<Field>
							<FieldLabel htmlFor={emailId}>{t(($) => $.register.email)}</FieldLabel>
							<Input id={emailId} type="email" placeholder={"ola.nordmann@aker.no"} required={true} />
						</Field>
						<Field>
							<FieldLabel htmlFor={passwordId}>{t(($) => $.register.password)}</FieldLabel>
							<Input id={passwordId} type="password" required={true} />
						</Field>
						<Field>
							<FieldLabel htmlFor={confirmPasswordId}>{t(($) => $.register.confirmPassword)}</FieldLabel>
							<Input id={confirmPasswordId} type="password" required={true} />
						</Field>
						<Field orientation="horizontal">
							<Checkbox defaultChecked={true} id={privacyConsentId} />
							<FieldLabel htmlFor={privacyConsentId}>{t(($) => $.register.privacyConsent)}</FieldLabel>
						</Field>
						<FieldGroup>
							<Field>
								<Button asChild={true}>
									<Link to="/">{t(($) => $.register.createAccount)}</Link>
								</Button>
								<FieldDescription className="px-6 text-center">
									{t(($) => $.register.haveAccount)}{" "}
									<span className="underline">{t(($) => $.register.login)}</span>
								</FieldDescription>
							</Field>
						</FieldGroup>
					</FieldGroup>
				</form>
			</CardContent>
		</Card>
	);
}
