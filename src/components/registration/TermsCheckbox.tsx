import { Link } from "react-router-dom";
import { Checkbox } from "@/components/ui/checkbox";

interface TermsCheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  id?: string;
}

export function TermsCheckbox({ checked, onCheckedChange, id = "terms" }: TermsCheckboxProps) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-md border border-input bg-muted/30">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(v) => onCheckedChange(v === true)}
        className="mt-0.5"
        required
      />
      <label htmlFor={id} className="text-sm text-muted-foreground leading-relaxed cursor-pointer select-none">
        I have read and agree to the{" "}
        <Link
          to="/terms"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline font-medium"
        >
          Terms &amp; Conditions
        </Link>{" "}
        and{" "}
        <Link
          to="/privacy-policy"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline font-medium"
        >
          Privacy Policy
        </Link>
        . <span className="text-destructive">*</span>
      </label>
    </div>
  );
}
