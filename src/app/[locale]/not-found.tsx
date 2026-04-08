import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function NotFound() {
  const t = await getTranslations("nav");

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-6 px-4 py-24 text-center">
      <h1 className="text-2xl font-semibold text-foreground">404</h1>
      <Link href="/" className={cn(buttonVariants())} prefetch={false}>
        {t("home")}
      </Link>
    </div>
  );
}
