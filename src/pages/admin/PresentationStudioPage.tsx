import { useParams } from "react-router-dom";
import { PresentationLanding } from "@/components/presentations/PresentationLanding";
import { PresentationEditor } from "@/components/presentations/PresentationEditor";

export function PresentationStudioPage() {
  const { id } = useParams<{ id?: string }>();
  return id ? <PresentationEditor presentationId={id} /> : <PresentationLanding />;
}
