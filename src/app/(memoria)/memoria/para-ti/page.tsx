import { ParaTiFeed } from "~/components/memoria/ParaTiFeed";
import { ParaTiNav } from "~/components/memoria/ParaTiNav";
import { getFeedMemories } from "~/server/queries/memoria/feed";

export default async function ParaTiPage() {
  const feedItems = await getFeedMemories(20);

  return (
    <div className="relative min-h-screen bg-black">
      <ParaTiFeed initialItems={feedItems} />
      <ParaTiNav />
    </div>
  );
}
