import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function InboxLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-coco-light">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {children}
      </div>
    </div>
  );
}
