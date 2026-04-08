"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const tabs = [
  {
    name: "Explore",
    value: "explore",
    content: (
      <>
        Discover <span className="font-semibold text-foreground">fresh ideas</span>, trending topics,
        and hidden gems curated just for you. Start exploring and let your curiosity lead the way!
      </>
    ),
  },
  {
    name: "Favorites",
    value: "favorites",
    content: (
      <>
        All your <span className="font-semibold text-foreground">favorites</span> are saved here.
        Revisit articles, collections, and moments you love, any time you want a little inspiration.
      </>
    ),
  },
  {
    name: "Surprise Me",
    value: "surprise",
    content: (
      <>
        <span className="font-semibold text-foreground">Surprise!</span> Here&apos;s something
        unexpected—a fun fact, a quirky tip, or a daily challenge. Come back for a new surprise every
        day!
      </>
    ),
  },
];

/** Underline tab list (Base UI tabs use `data-active` on triggers; styles live on `variant="underline"`). */
export default function TabsUnderlineDemo() {
  return (
    <div className="w-full max-w-md">
      <Tabs defaultValue="explore" className="gap-4">
        <TabsList variant="underline">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map((tab) => (
          <TabsContent key={tab.value} value={tab.value}>
            <p className="text-sm text-muted-foreground">{tab.content}</p>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
