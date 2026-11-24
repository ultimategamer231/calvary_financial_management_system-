import "./globals.css";
export const metadata = {
  title: "Calvary Baptist Church | Finance",
  description: "Church finance staff workspace",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
