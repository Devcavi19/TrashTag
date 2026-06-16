const VARIANT_MAP = {
  Biodegradable: { label: "Biodegradable", classes: "bg-green-100 text-green-800" },
  Recyclable:    { label: "Recyclable",    classes: "bg-blue-100 text-blue-800" },
  Residual:      { label: "Residual",      classes: "bg-red-100 text-red-800" },
  open:          { label: "Open",               classes: "bg-gray-100 text-gray-700" },
  accepted:      { label: "Collector on the way", classes: "bg-yellow-100 text-yellow-800" },
  collected:     { label: "Collected",          classes: "bg-sky-100 text-sky-800" },
  paid:          { label: "Paid ✓",             classes: "bg-green-100 text-green-800" },
};

export default function StatusBadge({ variant }) {
  const config = VARIANT_MAP[variant];
  if (!config) {
    return (
      <span className="rounded-full px-2 py-0.5 text-xs font-semibold bg-gray-100 text-gray-500">
        {variant ?? "—"}
      </span>
    );
  }
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${config.classes}`}>
      {config.label}
    </span>
  );
}
