import { useId } from "react";
import { Link } from "react-router-dom";

export default function SmsOptInField({ phone, onPhoneChange, checked, onCheckedChange, messageType = "reservation confirmations, reminders, and updates", frequency = "Up to 4 messages per reservation.", inputClassName = "w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" }) {
  const id = useId();
  const hasPhone = Boolean(phone.trim());
  const changePhone = (value) => {
    onPhoneChange(value);
    onCheckedChange(false);
  };
  return (
    <fieldset data-sms-opt-in className="space-y-3 font-body">
      <legend className="text-sm font-semibold text-foreground mb-2">JTAP Kitchen SMS/text consent (optional)</legend>
      <div>
        <label htmlFor={`${id}-phone`} className="block text-sm font-medium text-foreground mb-2">Mobile Phone Number for SMS/text messages</label>
        <input id={`${id}-phone`} name="phone" type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={e => changePhone(e.target.value)} placeholder="e.g. 901-555-0100" aria-describedby={`${id}-phone-help ${id}-disclosures`} className={inputClassName} />
        <p id={`${id}-phone-help`} className="text-xs text-foreground mt-2 leading-relaxed">Enter the mobile number JTAP Kitchen may text. Providing a number alone does not opt you in.</p>
      </div>
      <label htmlFor={`${id}-consent`} className={`flex items-start gap-3 text-sm text-foreground leading-relaxed ${hasPhone ? "cursor-pointer" : "cursor-not-allowed"}`}>
        <input id={`${id}-consent`} name="sms_opt_in" type="checkbox" checked={hasPhone && checked} disabled={!hasPhone} onChange={e => onCheckedChange(e.target.checked)} aria-describedby={`${id}-disclosures ${id}-policies`} className="mt-1 w-4 h-4 shrink-0 rounded border-border accent-primary focus:ring-primary/40" />
        <span><strong className="font-semibold">I agree to receive SMS/text messages from JTAP Kitchen</strong> at the mobile phone number entered above about {messageType}.</span>
      </label>
      <div id={`${id}-disclosures`} className="pl-7 text-sm text-foreground leading-relaxed space-y-2">
        <p><strong className="font-semibold">Message frequency:</strong> {frequency}</p>
        <p>Msg &amp; data rates may apply.</p>
        <p><strong className="font-semibold">Reply STOP to cancel, HELP for help.</strong></p>
        <p>Consent is optional and is not a condition of purchase.</p>
      </div>
      <p id={`${id}-policies`} className="pl-7 text-sm text-foreground leading-relaxed">
        Read our <Link to="/terms-of-service" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">Terms &amp; Conditions</Link> and <Link to="/privacy-policy" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">Privacy Policy</Link>, and see our <Link to="/sms-opt-in" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">Text Message Program</Link>.
      </p>
    </fieldset>
  );
}