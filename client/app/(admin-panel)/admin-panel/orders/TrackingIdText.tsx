const TRACKING_ID_LINE_LENGTH = 2116;

const splitTrackingId = (trackingId: string) =>
  trackingId.match(new RegExp(`.{1,${TRACKING_ID_LINE_LENGTH}}`, "g")) ?? [];

const TrackingIdText = ({
  trackingId,
  fallback = "-",
}: {
  trackingId?: string | null;
  fallback?: string;
}) => {
  const value = trackingId?.trim();

  if (!value) return <>{fallback}</>;

  return (
    <span className="inline-block min-w-[26ch] whitespace-pre leading-5">
      {splitTrackingId(value).map((line, index, lines) => (
        <span key={`${line}-${index}`}>
          {line}
          {index < lines.length - 1 && <br />}
        </span>
      ))}
    </span>
  );
};

export default TrackingIdText;
