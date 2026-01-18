import Navbar from "../components/Navbar";

export default function AppLayout({ children }) {
  return (
    <div>
      <Navbar />
      <div className="container">{children}</div>
    </div>
  );
}
