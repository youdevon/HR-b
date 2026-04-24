import { getContractById } from "@/lib/queries/contracts";
import { notFound } from "next/navigation";

type ContractDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ContractDetailPage({
  params,
}: ContractDetailPageProps) {
  const { id } = await params;

  const contract = await getContractById(id);

  if (!contract) {
    notFound();
  }

  return (
    <main className="space-y-6">
      <h1 className="text-2xl font-semibold text-neutral-900">
        Contract {contract.contract_number}
      </h1>
    </main>
  );
}