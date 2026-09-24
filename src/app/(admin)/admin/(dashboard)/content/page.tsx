import type { Metadata } from "next";
import Link from "next/link";
import {
  deleteHeroMedia,
  moveHeroMedia,
  saveHeroMedia,
  saveMessagesLink,
  toggleHeroMedia,
} from "./actions";
import { ActionForm } from "@/components/admin/action-form";
import { Badge, Eyebrow, Notice, Panel, PanelHeader, Stat } from "@/components/ui";
import { Checkbox, Field, Input } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { getSetting, SETTING_KEYS } from "@/lib/settings";
import type { MediaPlacement } from "@/generated/prisma/enums";

export const metadata: Metadata = { title: "Website content", robots: { index: false } };

type Media = {
  id: string;
  placement: MediaPlacement;
  title: string;
  subtitle: string | null;
  videoUrl: string | null;
  imageUrl: string | null;
  linkUrl: string | null;
  posterUrl: string | null;
  sortOrder: number;
  isActive: boolean;
};

const SECTIONS = [
  {
    placement: "HERO_GALLERY" as const,
    title: "Latest messages",
    where: "Not shown on the site at the moment",
    description:
      "The homepage carousel these fed has been removed, so nothing here is public right now. The cards are kept so they are ready if messages return to the site.",
    needs: "video" as const,
  },
  {
    placement: "CAMP_CARDS" as const,
    title: "Fresh Fire cards",
    where: "Camp page, the depth-card carousel",
    description:
      "Still images with a label; captions are not shown on these cards. A card with no image falls back to a blue wash.",
    needs: "image" as const,
  },
  {
    placement: "PASTORS" as const,
    title: "Meet our Senior Pastors",
    where: "Homepage, the pastors carousel",
    description:
      "One card per pastor: the card label is their name, the line under it their role, and the image their photo (portrait, roughly 3:4). Until you add cards here, the homepage shows the four Senior Pastors already set up; adding any card here replaces that list, so re-add all of them.",
    needs: "image" as const,
  },
];

export default async function ContentPage() {
  await requireAdmin(["SUPER_ADMIN", "ADMIN"]);

  const messagesUrl = await getSetting(SETTING_KEYS.messagesUrl);

  const media = (await db.siteMedia.findMany({
    orderBy: [{ placement: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
  })) as Media[];

  const live = media.filter((item) => item.isActive).length;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow>What the public site shows</Eyebrow>
          <h1 className="display mt-2 text-5xl">Website content</h1>
        </div>
        <div className="flex gap-2">
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="border border-ink px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.1em] transition-colors hover:bg-ink hover:text-white"
          >
            View homepage
          </Link>
          <Link
            href="/camp"
            target="_blank"
            rel="noopener noreferrer"
            className="border border-ink px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.1em] transition-colors hover:bg-ink hover:text-white"
          >
            View camp page
          </Link>
        </div>
      </header>

      <div className="grid gap-px bg-ink/12 sm:grid-cols-3">
        <Stat label="Showing" value={live} tone="brand" />
        <Stat label="Hidden" value={media.length - live} />
        <Stat label="Total cards" value={media.length} />
      </div>

      <Panel className="p-5">
        <Eyebrow>Where &ldquo;Listen to the messages&rdquo; goes</Eyebrow>
        <p className="mt-1.5 text-xs text-ink-45">
          Saved for when messages return to the site. The homepage carousel this belonged to has
          been removed, so nothing uses it right now.
        </p>
        <ActionForm action={saveMessagesLink} className="mt-4 max-w-xl">
          <Field label="Messages link" htmlFor="messagesUrl">
            <Input
              id="messagesUrl"
              name="messagesUrl"
              type="url"
              defaultValue={messagesUrl ?? ""}
              placeholder="https://youtube.com/@dominionhouse"
            />
          </Field>
          <SubmitButton size="sm" pendingLabel="Saving…">
            Save link
          </SubmitButton>
        </ActionForm>
      </Panel>

      <Notice tone="warn" title="Where to put your artwork">
        Drop image files into <code className="font-mono text-xs">public/camp/</code> and reference
        them as <code className="font-mono text-xs">/camp/filename.jpg</code>, or paste any{" "}
        <code className="font-mono text-xs">https://</code> URL. Hero{" "}
        <strong>videos</strong> additionally need a host that sends{" "}
        <code className="font-mono text-xs">Access-Control-Allow-Origin</code>, because they are
        painted onto a WebGL canvas. Pexels works, most CDNs and YouTube links do not.
      </Notice>

      {SECTIONS.map((section) => {
        const rows = media.filter((item) => item.placement === section.placement);

        return (
          <div key={section.placement} className="grid gap-6 xl:grid-cols-[1fr_400px]">
            <Panel>
              <PanelHeader
                title={section.title}
                description={`${section.where}. ${section.description}`}
              />
              {rows.length === 0 ? (
                <p className="px-5 py-10 text-sm text-ink-45">
                  Nothing here yet: this section is hidden on the site until you add a card.
                </p>
              ) : (
                <ul>
                  {rows.map((item, index) => (
                    <li key={item.id} className="border-b border-ink/10 px-5 py-4 last:border-0">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex min-w-0 items-start gap-4">
                          <Preview item={item} />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold">
                              <span className="font-mono text-ink-45">{index + 1}.</span>{" "}
                              {item.title}
                            </p>
                            {item.subtitle ? (
                              <p className="mt-0.5 text-xs text-ink-45">{item.subtitle}</p>
                            ) : null}
                            <p className="mt-1 break-all font-mono text-[11px] text-ink-45">
                              {item.videoUrl || item.imageUrl || "No media, blue wash"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge tone={item.isActive ? "success" : "neutral"}>
                            {item.isActive ? "showing" : "hidden"}
                          </Badge>
                          {(["up", "down"] as const).map((direction) => (
                            <ActionForm action={moveHeroMedia} key={direction}>
                              <input type="hidden" name="id" value={item.id} />
                              <input type="hidden" name="placement" value={item.placement} />
                              <input type="hidden" name="direction" value={direction} />
                              <SubmitButton
                                size="sm"
                                variant="ghost"
                                withArrow={false}
                                pendingLabel="…"
                              >
                                {direction === "up" ? "↑" : "↓"}
                              </SubmitButton>
                            </ActionForm>
                          ))}
                        </div>
                      </div>

                      <details className="mt-3">
                        <summary className="cursor-pointer font-mono text-[10px] uppercase tracking-[0.14em] text-ink-45">
                          Edit card
                        </summary>
                        <div className="mt-4 space-y-4 border-l-2 border-brass pl-4">
                          <ActionForm action={saveHeroMedia}>
                            <input type="hidden" name="id" value={item.id} />
                            <input type="hidden" name="placement" value={item.placement} />
                            <Field label="Label" htmlFor={`title-${item.id}`} required>
                              <Input
                                id={`title-${item.id}`}
                                name="title"
                                defaultValue={item.title}
                                required
                              />
                            </Field>
                            {section.needs === "image" ? (
                              <Field label="Caption" htmlFor={`subtitle-${item.id}`}>
                                <Input
                                  id={`subtitle-${item.id}`}
                                  name="subtitle"
                                  defaultValue={item.subtitle ?? ""}
                                  maxLength={160}
                                />
                              </Field>
                            ) : null}
                            {section.needs === "video" ? (
                              <Field
                                label="Video URL"
                                htmlFor={`video-${item.id}`}
                                required
                                hint="Direct .mp4, CORS-enabled."
                              >
                                <Input
                                  id={`video-${item.id}`}
                                  name="videoUrl"
                                  defaultValue={item.videoUrl ?? ""}
                                  required
                                />
                              </Field>
                            ) : null}
                            <Field
                              label="Image URL"
                              htmlFor={`image-${item.id}`}
                              hint="/camp/file.jpg for a file in public/, or a full https:// URL."
                            >
                              <Input
                                id={`image-${item.id}`}
                                name="imageUrl"
                                defaultValue={item.imageUrl ?? ""}
                              />
                            </Field>
                            {section.needs === "video" ? (
                              <Field label="Poster image URL" htmlFor={`poster-${item.id}`}>
                                <Input
                                  id={`poster-${item.id}`}
                                  name="posterUrl"
                                  defaultValue={item.posterUrl ?? ""}
                                />
                              </Field>
                            ) : null}
                            <Field
                              label="Link"
                              htmlFor={`link-${item.id}`}
                              hint="Where the card sends people, e.g. the message on YouTube."
                            >
                              <Input
                                id={`link-${item.id}`}
                                name="linkUrl"
                                defaultValue={item.linkUrl ?? ""}
                              />
                            </Field>
                            <Field label="Position" htmlFor={`order-${item.id}`}>
                              <Input
                                id={`order-${item.id}`}
                                name="sortOrder"
                                type="number"
                                min={0}
                                defaultValue={item.sortOrder}
                              />
                            </Field>
                            <Checkbox
                              name="isActive"
                              label="Show on the site"
                              defaultChecked={item.isActive}
                            />
                            <SubmitButton size="sm" pendingLabel="Saving…">
                              Save card
                            </SubmitButton>
                          </ActionForm>

                          <div className="flex flex-wrap gap-2">
                            <ActionForm action={toggleHeroMedia}>
                              <input type="hidden" name="id" value={item.id} />
                              <SubmitButton
                                size="sm"
                                variant="outline"
                                withArrow={false}
                                pendingLabel="…"
                              >
                                {item.isActive ? "Hide" : "Show"}
                              </SubmitButton>
                            </ActionForm>
                            <ActionForm
                              action={deleteHeroMedia}
                              confirm={`Delete "${item.title}"?`}
                            >
                              <input type="hidden" name="id" value={item.id} />
                              <SubmitButton
                                size="sm"
                                variant="ghost"
                                withArrow={false}
                                pendingLabel="…"
                                className="text-danger"
                              >
                                Delete
                              </SubmitButton>
                            </ActionForm>
                          </div>
                        </div>
                      </details>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            <Panel className="xl:sticky xl:top-6 xl:self-start">
              <PanelHeader title={`Add to ${section.title.toLowerCase()}`} />
              <div className="p-5">
                <ActionForm action={saveHeroMedia}>
                  <input type="hidden" name="placement" value={section.placement} />
                  <Field label="Label" htmlFor={`new-title-${section.placement}`} required>
                    <Input
                      id={`new-title-${section.placement}`}
                      name="title"
                      required
                      maxLength={40}
                      placeholder={section.needs === "video" ? "Worship" : "Teaching"}
                    />
                  </Field>
                  {section.needs === "image" ? (
                    <Field label="Caption" htmlFor={`new-subtitle-${section.placement}`}>
                      <Input
                        id={`new-subtitle-${section.placement}`}
                        name="subtitle"
                        maxLength={160}
                        placeholder="One line under the title"
                      />
                    </Field>
                  ) : null}
                  {section.needs === "video" ? (
                    <Field
                      label="Video URL"
                      htmlFor={`new-video-${section.placement}`}
                      required
                      hint="Direct .mp4, CORS-enabled."
                    >
                      <Input
                        id={`new-video-${section.placement}`}
                        name="videoUrl"
                        required
                        placeholder="https://…/clip.mp4"
                      />
                    </Field>
                  ) : null}
                  <Field
                    label="Image URL"
                    htmlFor={`new-image-${section.placement}`}
                    hint="/camp/file.jpg, or a full https:// URL."
                  >
                    <Input
                      id={`new-image-${section.placement}`}
                      name="imageUrl"
                      placeholder="/camp/fresh-fire-01.jpg"
                    />
                  </Field>
                  <Field
                    label="Link"
                    htmlFor={`new-link-${section.placement}`}
                    hint="Where the card sends people. Falls back to the messages link above."
                  >
                    <Input
                      id={`new-link-${section.placement}`}
                      name="linkUrl"
                      placeholder="https://youtube.com/watch?v=..."
                    />
                  </Field>
                  <Field label="Position" htmlFor={`new-order-${section.placement}`}>
                    <Input
                      id={`new-order-${section.placement}`}
                      name="sortOrder"
                      type="number"
                      min={0}
                      defaultValue={rows.length}
                    />
                  </Field>
                  <Checkbox name="isActive" label="Show on the site" defaultChecked />
                  <SubmitButton className="w-full" pendingLabel="Adding…">
                    Add card
                  </SubmitButton>
                </ActionForm>
              </div>
            </Panel>
          </div>
        );
      })}
    </div>
  );
}

function Preview({ item }: { item: Media }) {
  const box = "h-16 w-24 shrink-0 border border-ink/12 bg-ink object-cover";

  if (item.videoUrl) {
    return (
      <video
        src={item.videoUrl}
        poster={item.posterUrl ?? undefined}
        muted
        loop
        playsInline
        preload="metadata"
        className={box}
      />
    );
  }

  if (item.imageUrl) {
    // Admin-supplied URLs from arbitrary hosts; next/image would need each allow-listed.
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={item.imageUrl} alt="" className={box} />;
  }

  return (
    <div
      className={box}
      style={{ background: "linear-gradient(150deg,#0b0b0c 0%,#21a1ff 55%,#eef7ff 100%)" }}
    />
  );
}
