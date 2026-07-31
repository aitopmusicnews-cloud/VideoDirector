export default function Loader({ label }: { label: string }) {
  return (
    <div className="loader-row" role="status">
      <span className="spinner" />
      <span>{label}</span>
    </div>
  );
}
