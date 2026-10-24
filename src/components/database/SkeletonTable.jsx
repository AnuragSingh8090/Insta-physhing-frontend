export function TableHead({ columns = [], type = "login" }) {
  const th =
    "px-3 py-2 text-left text-[10px] uppercase tracking-widest text-[#3a5a8a] font-semibold";
  return (
    <thead className="border-b border-[#131e35] bg-[#080f1e]">
      <tr>
        <th className="w-10 py-2 pl-4 pr-2" aria-label="Select" />
        <th className="w-12 px-2 py-2" aria-label="Service" />
        <th className={th}>{type === "forgot_password" ? "Email" : "Username"}</th>
        {columns.map((c) => (
          <th key={c.key} className={th}>
            {c.label}
          </th>
        ))}
        <th className={th}>Type</th>
        <th className={th}>Time</th>
        <th className={`${th} pr-4 text-right`}>Actions</th>
      </tr>
    </thead>
  );
}

export default function SkeletonTable({ columns = [], type = "login" }) {
  return (
    <div
      className="overflow-x-auto rounded border border-[#131e35] bg-[#0b1527]"
      aria-busy="true"
    >
      <table className="w-full min-w-[720px] animate-pulse">
        <TableHead columns={columns} type={type} />
        <tbody className="divide-y divide-[#0f1e38]">
          {Array.from({ length: 6 }).map((_, i) => (
            <tr key={i}>
              <td className="py-3 pl-4 pr-2">
                <div className="h-4 w-4 rounded bg-[#131e35]" />
              </td>
              <td className="px-2 py-3">
                <div className="h-8 w-8 rounded-full bg-[#131e35]" />
              </td>
              <td className="px-3 py-3">
                <div className="h-3 w-28 rounded bg-[#131e35]" />
              </td>
              {columns.map((c) => (
                <td key={c.key} className="px-3 py-3">
                  <div className="h-3 w-24 rounded bg-[#131e35]" />
                </td>
              ))}
              <td className="px-3 py-3">
                <div className="h-4 w-20 rounded-full bg-[#131e35]" />
              </td>
              <td className="px-3 py-3">
                <div className="h-3 w-14 rounded bg-[#131e35]" />
              </td>
              <td className="py-3 pl-3 pr-4">
                <div className="ml-auto h-3 w-12 rounded bg-[#131e35]" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
