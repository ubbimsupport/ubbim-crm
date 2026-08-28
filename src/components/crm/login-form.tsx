"use client";

import { useState } from "react";
import { signInAction } from "@/lib/actions/crm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm({
  next,
  disabled,
}: {
  next: string;
  disabled: boolean;
}) {
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

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
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@ubbim.com"
          aria-invalid={Boolean(emailError) || undefined}
          disabled={disabled}
        />
        {emailError ? <p className="text-sm text-red-700">{emailError}</p> : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          aria-invalid={Boolean(passwordError) || undefined}
          disabled={disabled}
        />
        {passwordError ? <p className="text-sm text-red-700">{passwordError}</p> : null}
      </div>
      <Button type="submit" className="w-full" disabled={disabled}>
        Sign in
      </Button>
    </form>
  );
}
