import { EmployeeDetail } from "@/components/master/employee-detail"
export default async function EmployeePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <EmployeeDetail id={id} />
}
