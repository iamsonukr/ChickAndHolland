export default function PublicQrPage() {
  return (
    <main style={{ minHeight: "100svh", display: "grid", placeItems: "center" }}>
      <img
        src="/chic-default-qr.png"
        alt="Chic & Holland"
        style={{ display: "block", width: "100%", maxWidth: 900, maxHeight: "100svh", objectFit: "contain" }}
      />
    </main>
  );
}
