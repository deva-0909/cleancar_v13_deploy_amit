import { ActivityTimeline } from "./ActivityTimeline";

export function ActivityTimelineWrapper() {
  // In a real app, you'd get leadId from URL params or context
  // For demo purposes, using a default lead
  const leadId = "LD001";
  const leadName = "Rajesh Kumar";

  return <ActivityTimeline leadId={leadId} leadName={leadName} />;
}
