export const JsonValue = ({ v }) => {
  if (v === null || v === undefined)
    return <span className="text-[#6b8cba]">null</span>;
  if (typeof v === "string")
    return <span className="text-[#e8c97a]">"{v}"</span>;
  if (typeof v === "number" || typeof v === "boolean")
    return <span className="text-[#e8c97a]">{String(v)}</span>;
  if (Array.isArray(v)) {
    return (
      <span>
        <span className="text-[#6b8cba]">[</span>
        {v.map((item, i) => (
          <div key={i} className="pl-4">
            <JsonValue v={item} />
            {i < v.length - 1 && <span className="text-[#6b8cba]">,</span>}
          </div>
        ))}
        <span className="text-[#6b8cba]">]</span>
      </span>
    );
  }
  // Object — recurse
  const entries = Object.entries(v);
  return (
    <span>
      <span className="text-[#6b8cba]">{"{"}</span>
      {entries.map(([k, val], i) => (
        <div key={k} className="pl-4">
          <span className="text-[#a0bce0]">"{k}"</span>
          <span className="text-[#6b8cba]">: </span>
          <JsonValue v={val} />
          {i < entries.length - 1 && <span className="text-[#6b8cba]">,</span>}
        </div>
      ))}
      <span className="text-[#6b8cba]">{"}"}</span>
    </span>
  );
};

export function JsonBlock({ data }) {
  if (!data) return null;
  const parsed = typeof data === "string" ? JSON.parse(data) : data;
  return (
    <div className="font-mono text-[12px] leading-relaxed">
      <JsonValue v={parsed} />
    </div>
  );
}

export function HeadersBlock({ headers = {} }) {
  const entries = Object.entries(headers).filter(([, v]) => v !== undefined);
  return (
    <div className="font-mono text-[12px] leading-relaxed">
      <span className="text-[#6b8cba]">{"{"}</span>
      {entries.map(([k, v], i) => (
        <div key={k} className="pl-4">
          <span className="text-[#a0bce0]">"{k}"</span>
          <span className="text-[#6b8cba]">: </span>
          <span className="text-[#e8c97a]">"{v}"</span>
          {i < entries.length - 1 && <span className="text-[#6b8cba]">,</span>}
        </div>
      ))}
      <span className="text-[#6b8cba]">{"}"}</span>
    </div>
  );
}
