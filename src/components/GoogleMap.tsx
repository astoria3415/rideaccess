/**
 * Lightweight Google Maps embed for service-area display.
 *
 * Uses the keyless public embed so the map always renders without depending
 * on an API key or its HTTP-referrer restrictions (this is a static location
 * display, not an interactive map — no key is required). The address
 * autocomplete on the booking form is what uses the API key.
 */
export function GoogleMap({
  query = "New York City",
  title = "Service area map",
  className = "",
}: {
  query?: string;
  title?: string;
  className?: string;
}) {
  const src = `https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=10&output=embed`;

  return (
    <div
      className={`overflow-hidden rounded-2xl border border-slate-200 shadow-soft ${className}`}
    >
      <iframe
        title={title}
        src={src}
        width="100%"
        height="100%"
        style={{ border: 0, minHeight: "100%" }}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
      />
    </div>
  );
}
