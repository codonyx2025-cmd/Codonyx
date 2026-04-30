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

function calculateStrength(password: string): StrengthLevel {
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

  if (!password) return null;

  return (
    <div className="mt-2 space-y-1">
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
    </div>
  );
}
