export default function Card({ children, style }) {
  return (
    <div className="card card-pad" style={style}>
      {children}
    </div>
  );
}
