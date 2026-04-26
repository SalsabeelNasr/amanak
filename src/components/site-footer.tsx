import Image from "next/image";
import { getTranslations } from "next-intl/server";

export async function SiteFooter() {
  const t = await getTranslations("footer");

  return (
    <footer className="border-t border-border bg-card pt-10 pb-[max(2.5rem,env(safe-area-inset-bottom,0px))] text-sm text-muted-foreground">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-6">
        <div className="flex min-w-0 flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-5">
          <div className="flex shrink-0 items-center gap-3">
            <div className="relative h-11 w-[3.5rem] shrink-0">
              <Image
                src="/footer/ministry-of-health-population-egypt.png"
                alt={t("supervisionMinistryAlt")}
                fill
                className="object-contain object-center opacity-90"
                sizes="56px"
              />
            </div>
            <div className="relative h-11 w-[3.5rem] shrink-0">
              <Image
                src="/footer/national-council-health-tourism.png"
                alt={t("supervisionCouncilAlt")}
                fill
                className="object-contain object-center opacity-90"
                sizes="56px"
              />
            </div>
          </div>
          <div className="min-w-0 space-y-1 text-sm text-muted-foreground">
            <p className="font-medium leading-5 text-foreground">{t("tagline")}</p>
            <p className="leading-5">© {new Date().getFullYear()} {t("rights")}</p>
          </div>
        </div>
        <a
          href="https://wa.me/201159187434"
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-11 w-full shrink-0 items-center justify-start rounded-md text-muted-foreground transition-colors hover:text-[#25D366] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:inline-flex sm:w-11 sm:justify-center sm:self-center"
          aria-label={t("whatsappAria")}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="currentColor"
            aria-hidden
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.123 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
          </svg>
        </a>
      </div>
    </footer>
  );
}
