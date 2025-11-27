import { redirect } from "next/navigation";

export default async function HomePage() {
  // Create a new conversation and redirect to it
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/conversations`,
    {
      method: "POST",
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to create conversation");
  }

  const { id } = await response.json();
  redirect(`/chat/${id}`);
}

