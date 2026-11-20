"use client"
import { useState } from "react"
import { usePathname, useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  LoadState,
  Pager,
  fieldClass,
  selectClass,
  useResource,
} from "@/components/master/shared"
import type { Page } from "@/lib/master"
import { wib } from "@/lib/fines"
import {
  currentMonth,
  reportParams,
  type AuditOptions,
  type AuditRow,
} from "@/lib/reporting"
export function AuditLogs() {
  const search = useSearchParams(),
    router = useRouter(),
    path = usePathname(),
    defaults = currentMonth(),
    values = {
      from: search.get("from") ?? defaults.from,
      to: search.get("to") ?? defaults.to,
      actorUserId: search.get("actorUserId") ?? "",
      action: search.get("action") ?? "",
      entityType: search.get("entityType") ?? "",
      page: search.get("page") ?? "1",
    },
    options = useResource<AuditOptions>("/audit-logs/options"),
    result = useResource<Page<AuditRow>>(
      "/audit-logs?" + reportParams(values),
      true
    )
  const update = (data: Record<string, string>) =>
    router.replace(path + "?" + reportParams({ ...values, ...data }), {
      scroll: false,
    })
  return (
    <section className="space-y-6">
      <div>
        <p className="mb-2 text-sm text-foreground/65">Jejak perubahan</p>
        <h1 className="text-3xl font-semibold">Audit log</h1>
        <p className="mt-3 text-sm text-foreground/65">
          Histori hanya baca, mencakup akses admin, perubahan data, pembayaran,
          dan ekspor.
        </p>
      </div>
      <LoadState
        loading={options.loading}
        error={options.error}
        retry={options.reload}
      >
        {options.data && (
          <AuditFilters
            key={search.toString()}
            values={values}
            options={options.data}
            onApply={update}
          />
        )}
      </LoadState>
      <Button
        variant="outline"
        className="min-h-11"
        onClick={() => {
          result.reload()
          options.reload()
        }}
      >
        Segarkan audit
      </Button>
      <LoadState
        loading={result.loading}
        error={result.error}
        retry={result.reload}
        empty={
          result.data?.data.length === 0
            ? "Tidak ada audit yang sesuai."
            : undefined
        }
      >
        <div className="divide-y rounded-xl border bg-background">
          {result.data?.data.map((row) => (
            <article key={row.id} className="space-y-3 p-4 sm:p-5">
              <div className="flex flex-wrap justify-between gap-3">
                <h2 className="font-semibold break-words">{row.action}</h2>
                <p className="text-xs text-foreground/65">
                  {wib(row.createdAt)}
                </p>
              </div>
              <p className="text-sm break-words">
                {row.actorName} · {row.entityType}
              </p>
              <details className="text-sm">
                <summary className="cursor-pointer py-3 focus-visible:outline-2">
                  Detail audit
                </summary>
                <div className="space-y-3">
                  <p className="text-xs break-all text-foreground/65">
                    Entitas {row.entityId} · Request{" "}
                    {row.requestId ?? "Tidak tersedia"}
                  </p>
                  <p className="text-xs text-foreground/65">
                    Tampilan payload dibatasi; field di luar daftar aman tidak
                    ditampilkan.
                  </p>
                  <div className="grid gap-4 md:grid-cols-2">
                    {[
                      ["Sebelum", row.beforeJson],
                      ["Sesudah", row.afterJson],
                    ].map(([label, value]) => (
                      <div key={String(label)} className="min-w-0">
                        <h3 className="mb-2 font-medium">{String(label)}</h3>
                        <pre className="max-h-80 overflow-y-auto rounded-lg bg-muted/50 p-3 text-xs break-all whitespace-pre-wrap">
                          {value === null
                            ? "Tidak ada payload"
                            : JSON.stringify(value, null, 2)}
                        </pre>
                      </div>
                    ))}
                  </div>
                </div>
              </details>
            </article>
          ))}
        </div>
      </LoadState>
      <Pager
        result={result.data}
        page={Number(values.page)}
        onChange={(page) => update({ page: String(page) })}
      />
    </section>
  )
}
function AuditFilters({
  values,
  options,
  onApply,
}: {
  values: {
    from: string
    to: string
    actorUserId: string
    action: string
    entityType: string
  }
  options: AuditOptions
  onApply: (data: Record<string, string>) => void
}) {
  const [from, setFrom] = useState(values.from),
    [to, setTo] = useState(values.to),
    [actor, setActor] = useState(values.actorUserId),
    [action, setAction] = useState(values.action),
    [entity, setEntity] = useState(values.entityType)
  return (
    <form
      className="space-y-4 rounded-xl border bg-background p-4 sm:p-5"
      onSubmit={(e) => {
        e.preventDefault()
        onApply({
          from,
          to,
          actorUserId: actor,
          action,
          entityType: entity,
          page: "1",
        })
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <label className="space-y-2 text-sm">
          <span>Dari waktu pencatatan (WIB)</span>
          <Input
            className={fieldClass + " w-full min-w-0"}
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            required
          />
        </label>
        <label className="space-y-2 text-sm">
          <span>Sampai waktu pencatatan (WIB)</span>
          <Input
            className={fieldClass + " w-full min-w-0"}
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            required
          />
        </label>
        <div className="space-y-2 text-sm">
          <label htmlFor="audit-actor">Aktor</label>
          <select
            id="audit-actor"
            className={selectClass}
            value={actor}
            onChange={(e) => setActor(e.target.value)}
          >
            <option value="">Semua aktor</option>
            {options.actors.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2 text-sm">
          <label htmlFor="audit-action">Aksi</label>
          <select
            id="audit-action"
            className={selectClass}
            value={action}
            onChange={(e) => setAction(e.target.value)}
          >
            <option value="">Semua aksi</option>
            {options.actions.map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2 text-sm">
          <label htmlFor="audit-entity">Entitas</label>
          <select
            id="audit-entity"
            className={selectClass}
            value={entity}
            onChange={(e) => setEntity(e.target.value)}
          >
            <option value="">Semua entitas</option>
            {options.entityTypes.map((e) => (
              <option key={e}>{e}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button className="min-h-11" type="submit">
          Terapkan filter audit
        </Button>
        <Button
          className="min-h-11"
          type="button"
          variant="ghost"
          onClick={() =>
            onApply({
              ...currentMonth(),
              actorUserId: "",
              action: "",
              entityType: "",
              page: "1",
            })
          }
        >
          Reset filter audit
        </Button>
      </div>
    </form>
  )
}
