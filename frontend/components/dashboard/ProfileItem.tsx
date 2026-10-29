type Props = {
  label: string;
  value?: string | number | null;
};

export default function ProfileItem({ label, value }: Props) {
  return (
    <div className="min-w-0 rounded-xl bg-slate-50 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-2 break-words text-sm font-semibold text-slate-800">
        {value !== null && value !== undefined && String(value).trim()
          ? value
          : "No registrado"}
      </p>
    </div>
  );
}
