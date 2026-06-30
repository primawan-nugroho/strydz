"use client";

import { useEffect, useState } from "react";

function greetingFor(hour: number): string {
  if (hour < 5) return "Still up";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function Greeting({ name }: { name: string }) {
  // Server renders a neutral greeting; the client swaps in the time-of-day one using the
  // browser's local clock (server time/timezone would otherwise be wrong for the user).
  const [greeting, setGreeting] = useState("Welcome back");

  useEffect(() => {
    setGreeting(greetingFor(new Date().getHours()));
  }, []);

  return (
    <>
      <p className="text-[13px] text-text-muted">{greeting}</p>
      <p className="text-[16px] font-medium">{name}</p>
    </>
  );
}
