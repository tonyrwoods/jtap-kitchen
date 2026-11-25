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
      <legend className="mb-2 text-base font-semibold text-foreground">JTAP Kitchen SMS/Text Opt-In</legend>
      <div>
        <label htmlFor={`${id}-phone`} className="block text-sm font-medium text-foreground mb-2">Mobile Phone Number</label>
        <input id={`${id}-phone`} name="phone" type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={e => changePhone(e.target.value)} placeholder="e.g. 901-555-0100" aria-describedby={`${id}-phone-help ${id}-disclosures`} className={inputClassName} />
        <p id={`${id}-phone-help`} className="text-xs text-foreground mt-2 leading-relaxed">Only checking the box below gives JTAP Kitchen permission to text this number.</p>
      </div>
      <div className="rounded-xl border border-border bg-secondary/40 p-3 space-y-2">
        <label htmlFor={`${id}-consent`} className={`flex items-start gap-3 text-sm text-foreground leading-relaxed ${hasPhone ? "cursor-pointer" : "cursor-not-allowed"}`}>
          <input id={`${id}-consent`} name="sms_opt_in" type="checkbox" checked={hasPhone && checked} disabled={!hasPhone} onChange={e => onCheckedChange(e.target.checked)} aria-describedby={`${id}-disclosures ${id}-policies`} className="mt-1 w-4 h-4 shrink-0 rounded border-border accent-primary focus:ring-primary/40" />
          <span className="min-w-0 space-y-2">
            <span className="block"><strong className="font-semibold">I agree to receive SMS/text messages from JTAP Kitchen</strong> at <strong className="font-semibold break-words">{hasPhone ? phone.trim() : "the mobile phone number entered above"}</strong>.</span>
            <span id={`${id}-disclosures`} className="block space-y-1">
              <span className="block"><strong className="font-semibold">Message type:</strong> {messageType}.</span>
              <span className="block"><strong className="font-semibold">Message frequency:</strong> {frequency}</span>
              <span className="block">Msg &amp; data rates may apply.</span>
              <span className="block"><strong className="font-semibold">Reply STOP to cancel, HELP for help.</strong></span>
              <span className="block">Consent is optional and is not a condition of purchase.</span>
            </span>
          </span>
        </label>
        <p id={`${id}-policies`} className="text-sm text-foreground leading-relaxed">
          <Link to="/terms-of-service" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">Terms &amp; Conditions</Link> · <Link to="/privacy-policy" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">Privacy Policy</Link>
        </p>
      </div>
    </fieldset>
  );
}