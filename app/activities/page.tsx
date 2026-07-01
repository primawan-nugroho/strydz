import { getActivitiesPage } from "@/lib/activities";
import LoadMoreActivities from "@/components/LoadMoreActivities";

export default async function ActivitiesPage() {
  const activities = await getActivitiesPage(1);

  return (
    <div>
      <h1 className="text-[18px] font-medium mb-4">Activities</h1>
      <LoadMoreActivities initialActivities={activities} />
    </div>
  );
}
