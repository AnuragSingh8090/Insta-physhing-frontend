export default function BarChart({ data }) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-1 h-14">
      {data.map((v, i) => (
        <div key={i} className="flex-1">
          <div
            className="w-full rounded-t"
            style={{
              height: `${Math.max(4, (v / max) * 100)}%`,
              background: "linear-gradient(to top, #1a4a8a, #3d7aba)",
            }}
          />
        </div>
      ))}
    </div>
  );
}
