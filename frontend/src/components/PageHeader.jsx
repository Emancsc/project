export default function PageHeader({ title, subtitle, right }) {
  return (
    <div className="row" style={{ alignItems: "center", justifyContent: "space-between" }}>
      <div>
        <h1 className="h1">{title}</h1>
        {subtitle && <p className="sub">{subtitle}</p>}
      </div>
      {right ? <div>{right}</div> : null}
    </div>
  );
}
