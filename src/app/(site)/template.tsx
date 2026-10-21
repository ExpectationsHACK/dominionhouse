/**
 * Re-mounts on every navigation between public pages, so each new page fades
 * in. Opacity only: a transform here would break the sticky elements inside
 * (programme day labels, the header's neighbours) while it plays.
 */
export default function SiteTemplate({ children }: { children: React.ReactNode }) {
  return <div className="page-in">{children}</div>;
}
