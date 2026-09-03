"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Eye, EyeOff } from "lucide-react";
import { signInAction } from "@/lib/actions/crm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={disabled || pending}>
      {pending ? "Signing in..." : "Sign in"}
    </Button>
  );
}

export function LoginForm({
  next,
  disabled,
  portal,
}: {
  next: string;
  disabled: boolean;
  portal?: "contractor";
}) {
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    const form = event.currentTarget;
    const data = new FormData(form);
    const email = String(data.get("email") || "").trim();
    const password = String(data.get("password") || "");
    let emailMessage = "";
    let passwordMessage = "";
    if (!email) emailMessage = "Enter your email address.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) emailMessage = "Enter a valid email address.";
    if (!password) passwordMessage = "Enter your password.";
    setEmailError(emailMessage);
    setPasswordError(passwordMessage);
    if (emailMessage || passwordMessage) event.preventDefault();
  }

  return (
    <form action={signInAction} onSubmit={onSubmit} noValidate className="space-y-4">
      <input type="hidden" name="next" value={next} />
      {portal ? <input type="hidden" name="portal" value={portal} /> : null}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@company.com"
          aria-invalid={Boolean(emailError) || undefined}
          disabled={disabled}
        />
        {emailError ? <p className="text-sm text-red-700">{emailError}</p> : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            aria-invalid={Boolean(passwordError) || undefined}
            disabled={disabled}
            className="pr-10"
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        {passwordError ? <p className="text-sm text-red-700">{passwordError}</p> : null}
      </div>
      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        <input type="checkbox" name="remember" defaultChecked className="size-4 rounded border" />
        Remember session
      </label>
      <SubmitButton disabled={disabled} />
    </form>
  );
}