/**
 * Renders the company name. The first word is painted in the Indian flag
 * colours (saffron -> white -> green); "Indian" is styled this way.
 */
export function Brand({ name }: { name: string | null }) {
  const full = name ?? "Company name not set";
  const [first, ...rest] = full.split(" ");
  const restText = rest.join(" ");
  const flagFirst = first.toLowerCase() === "indian";

  return (
    <span className="text-sm font-semibold text-slate-100">
      {flagFirst ? (
        <span className="bg-gradient-to-r from-[#FF9933] via-white to-[#138808] bg-clip-text text-transparent">
          {first}
        </span>
      ) : (
        first
      )}
      {restText ? <span> {restText}</span> : null}
    </span>
  );
}
