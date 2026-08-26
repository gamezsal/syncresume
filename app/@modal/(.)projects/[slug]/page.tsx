import ModalWrapper from "@/components/ModalWrapper";
import ProjectDetails from "@/components/ProjectDetails";

export default async function ProjectModal({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <ModalWrapper>
      <ProjectDetails slug={slug} />
    </ModalWrapper>
  );
}
