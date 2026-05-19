type ConsistencyStatus = "match" | "mismatch" | "missing" | "missing_github" | "missing_db";

interface Props {
  status: ConsistencyStatus | string;
}

export default function ConsistencyBadge({ status }: Props) {
  const cls =
    status === "match"
      ? "text-green-400"
      : status === "missing" || status === "missing_github" || status === "missing_db"
      ? "text-yellow-400"
      : "text-red-400";
  return <span className={`font-mono text-xs ${cls}`}>{status}</span>;
}
