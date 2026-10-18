import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${pathname}`, {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the Heart Island application", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Heart Island/i);
  assert.match(html, /Good morning/);
  assert.match(html, /Daily Goals/);
  assert.match(html, /Base Island · Tap to decorate/);
  assert.doesNotMatch(html, /codex-preview|Building your site/);
});

test("includes the complete personalization flow and one base island", async () => {
  const [page, editor] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/scene-test/IslandAssetEditor.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(page, /PERSONALIZATION_KEY/);
  assert.match(page, /How much time feels realistic for recovery each day\?/);
  assert.match(page, /When would you like Lin to gently check in\?/);
  assert.match(page, /YOUR PERSONAL RECOVERY RHYTHM/);
  assert.match(page, /PERSONALIZED_HOME_COPY/);
  assert.doesNotMatch(page, /StarterLook|Wildwood Haven|Riverside Camp/);
  assert.doesNotMatch(editor, /STARTER ISLAND|StarterDecorScene|starterLook/);
});
