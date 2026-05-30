const stageOptions = [
  "Pattern",
  "Khaka",
  "Issue Beading",
  "Beading",
  "Zarkan",
  "Stitching",
  "Balance Pending",
  "Ready To Delivery",
  "Shipped",
];

const filterButtonClassName =
  "rounded-md border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted";

const buildHref = ({
  query,
  orderType,
  due,
  stage,
}: {
  query?: string;
  orderType?: string;
  due?: string;
  stage?: string;
}) => {
  const params = new URLSearchParams();

  if (query) params.set("q", query);
  if (orderType) params.set("orderType", orderType);
  if (due) params.set("due", due);
  if (stage) params.set("stage", stage);

  const search = params.toString();
  return search ? `?${search}` : "?";
};

export default function StageFilter({
  query,
  orderType,
  due,
  stage,
}: {
  query?: string;
  orderType?: string;
  due?: string;
  stage?: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <a
        href={buildHref({ query, orderType, due })}
        className={`${filterButtonClassName} ${!stage ? "bg-muted" : ""}`}
      >
        All Stages
      </a>
      {stageOptions.map((option) => (
        <a
          key={option}
          href={buildHref({ query, orderType, due, stage: option })}
          className={`${filterButtonClassName} ${
            stage === option ? "border-primary bg-primary/10" : ""
          }`}
        >
          {option}
        </a>
      ))}
    </div>
  );
}
