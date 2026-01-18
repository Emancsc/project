import AppLayout from "./AppLayout";
import Card from "../components/Card";

export default function AuthLayout({ children }) {
  return (
    <AppLayout>
      <div style={{ maxWidth: 520, margin: "22px auto" }}>
        <Card>{children}</Card>
      </div>
    </AppLayout>
  );
}
