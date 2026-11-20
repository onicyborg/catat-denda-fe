import { PaymentDetail } from "@/components/payments/detail"
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <PaymentDetail id={id} />
}
