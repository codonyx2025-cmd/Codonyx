import { useMemo } from "react";

interface PasswordStrengthProps {
  password: string;
}

type StrengthLevel = {
  label: string;
  score: number; // 0-4
  color: string; // tailwind bg color class
  textColor: string;
};

export function calculateStrength(password: string): StrengthLevel {
  if (!password) {
    return { label: "", score: 0, color: "bg-muted", textColor: "text-muted-foreground" };
  }

  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (password.length < 6) {
    return { label: "Too short", score: 1, color: "bg-destructive", textColor: "text-destructive" };
  }
  if (score <= 2) {
    return { label: "Weak", score: 1, color: "bg-destructive", textColor: "text-destructive" };
  }
  if (score === 3) {
    return { label: "Medium", score: 2, color: "bg-amber-500", textColor: "text-amber-600" };
  }
  if (score === 4) {
    return { label: "Strong", score: 3, color: "bg-emerald-500", textColor: "text-emerald-600" };
  }
  return { label: "Very Strong", score: 4, color: "bg-emerald-600", textColor: "text-emerald-700" };
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const strength = useMemo(() => calculateStrength(password), [password]);

  const checks = useMemo(
    () => [
      { label: "10+ characters", ok: password.length >= 10 },
      { label: "Uppercase (A-Z)", ok: /[A-Z]/.test(password) },
      { label: "Lowercase (a-z)", ok: /[a-z]/.test(password) },
      { label: "Number (0-9)", ok: /\d/.test(password) },
      { label: "Symbol (e.g. !@#$%&*?)", ok: /[^A-Za-z0-9]/.test(password) },
    ],
    [password]
  );

  if (!password) return null;

  return (
    <div className="mt-2 space-y-2">
      <div className="grid grid-cols-4 gap-1">
        {[1, 2, 3, 4].map((bar) => (
          <div
            key={bar}
            className={`h-1.5 rounded-full transition-colors ${
              bar <= strength.score ? strength.color : "bg-muted"
            }`}
          />
        ))}
      </div>
      <p className={`text-xs font-medium ${strength.textColor}`}>
        Password strength: {strength.label}
      </p>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1 text-[11px] leading-tight">
        {checks.map((c) => (
          <li
            key={c.label}
            className={`flex items-center gap-1.5 ${c.ok ? "text-emerald-600" : "text-muted-foreground"}`}
          >
            <span aria-hidden="true">{c.ok ? "✓" : "•"}</span>
            <span>{c.label}</span>
          </li>
        ))}
      </ul>
      <p className="text-[11px] text-muted-foreground">
        Example: <span className="font-mono">Codonyx@2026!</span> — but don't use this exact password.
      </p>
    </div>
  );
}
