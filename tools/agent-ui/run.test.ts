import assert from "node:assert/strict";
import { test } from "node:test";
import { builtSite } from "../fixture-build/build.ts";
import { budgetBytes } from "../js-budget-engine/run.ts";
import {
  BLOCK_SELECTOR,
  type ClientSize,
  budgetFindings,
  clientSizes,
  controlsMarkup,
  FIXTURE,
  fixtureState,
  main,
  markupFindings,
  probeHtml,
  probeRun,
} from "./run.ts";

/** Runs `fn` with console output captured, so a gate that reports a skip stays out of the test log. */
async function capture<T>(fn: () => Promise<T>): Promise<{ value: T; lines: string[] }> {
  const [log, error] = [console.log, console.error];
  const lines: string[] = [];
  console.log = (...args: unknown[]) => {
    lines.push(args.map(String).join(" "));
  };
  console.error = (...args: unknown[]) => {
    lines.push(args.map(String).join(" "));
  };
  try {
    return { value: await fn(), lines };
  } finally {
    console.log = log;
    console.error = error;
  }
}

/** Two small scripts, the shape the budget check receives. */
function sizes(block: number, menu: number): ClientSize[] {
  return [
    { control: "block actions", path: "chrome/block-actions/client.ts", bytes: block, raw: block, measured: "source" },
    { control: "page agent menu", path: "chrome/page-agent-menu/client.ts", bytes: menu, raw: menu, measured: "source" },
  ];
}

test("the two client scripts stay inside the JavaScript budget of the existing JS gate", async () => {
  const measured = await clientSizes();
  assert.equal(measured.length, 2);
  for (const size of measured) {
    assert.ok(size.bytes > 0, `${size.control} has a size`);
    assert.ok(size.bytes < budgetBytes, `${size.control} is under the page budget`);
  }
  assert.deepEqual(budgetFindings(measured), []);
});

test("a client script over the page budget fails, alone or as a pair", () => {
  const alone = budgetFindings(sizes(budgetBytes + 1, 1));
  assert.ok(alone.some((finding) => /block actions client is .* over the .* page budget/.test(finding)), alone.join("\n"));

  const pair = budgetFindings(sizes(Math.ceil(budgetBytes / 2), Math.ceil(budgetBytes / 2) + 1));
  assert.ok(pair.some((finding) => /the two client scripts total .* over the .* page budget/.test(finding)), pair.join("\n"));

  assert.deepEqual(budgetFindings(sizes(1000, 400)), []);
});

test("the theme renders both controls with accessible names and a plain tab order", () => {
  assert.deepEqual(markupFindings(controlsMarkup()), []);
});

test("an unnamed action or a control that sets tabindex fails the static check", () => {
  const markup = controlsMarkup();

  const unnamed = markupFindings({ ...markup, blockActions: markup.blockActions.replace(">Edit with your agent</button>", "></button>") });
  assert.ok(unnamed.some((finding) => /block actions: the action has no accessible name/.test(finding)), unnamed.join("\n"));

  const outOfOrder = markupFindings({
    ...markup,
    blockActions: markup.blockActions.replace('data-block-action="true"', 'data-block-action="true" tabindex="-1"'),
  });
  assert.ok(outOfOrder.some((finding) => /block actions: the action sets tabindex/.test(finding)), outOfOrder.join("\n"));

  const noLabel = markupFindings({ ...markup, pageAgentMenu: markup.pageAgentMenu.replace(">View Markdown</a>", "></a>") });
  assert.ok(noLabel.some((finding) => /page agent menu: the View Markdown link has no accessible name/.test(finding)), noLabel.join("\n"));
});

test("the probe page renders both controls and both client modules", async () => {
  const html = await probeHtml();
  assert.match(html, /data-block-actions="true"/);
  assert.match(html, /data-block-action="true"/);
  assert.match(html, /data-page-agent-menu="true"/);
  assert.match(html, /data-page-agent-copy="true"/);
  assert.match(html, /\[data-page-agent-copy\]/, "the page agent menu client is inline");
  assert.match(html, /\[data-block-actions\]/, "the block actions client is inline");
});

test("a missing Playwright skips the browser pass with a notice, not a failure", async () => {
  const run = await probeRun({
    loadPlaywright: async () => {
      throw new Error("playwright-core is not installed");
    },
  });
  assert.ok("skip" in run, "the run reports a skip");
  assert.match(run.skip, /playwright-core/);
});

test("a good synthetic page passes every keyboard check", async (t) => {
  const run = await probeRun();
  if ("skip" in run) {
    t.skip(run.skip);
    return;
  }
  try {
    const { value: result } = await capture(() => run.run());
    assert.deepEqual(result.findings, []);
    assert.ok(result.notes.some((note) => /fake clipboard/.test(note)), "the gate says it supplied the clipboard");
  } finally {
    await run.close();
  }
});

test("a control taken out of the tab order fails the browser pass", async (t) => {
  const run = await probeRun({
    mutate: (html) => html.replace('data-block-action="true"', 'data-block-action="true" tabindex="-1"'),
  });
  if ("skip" in run) {
    t.skip(run.skip);
    return;
  }
  try {
    const { value: result } = await capture(() => run.run());
    assert.ok(
      result.findings.some((finding) => finding.control === "block actions" && finding.message === `Tab never reached ${BLOCK_SELECTOR}`),
      `expected an unreachable block action, got ${JSON.stringify(result.findings)}`,
    );
  } finally {
    await run.close();
  }
});

test("the fixture gate stays green while engine.islands leaves the controls out of the build", async () => {
  const build = await builtSite(FIXTURE);
  const state = fixtureState(build);

  const { value: code, lines } = await capture(() => main([]));
  assert.equal(code, 0, lines.join("\n"));

  if (state.missing.length > 0) {
    assert.ok(state.missing.some((note) => /engine\.islands|provider links/.test(note)), `the gate names the gap: ${state.missing.join("; ")}`);
    assert.ok(lines.some((line) => line.startsWith("SKIP: agent-ui")), "the browser pass says it skipped");
    assert.ok(lines.some((line) => /engine\.islands|provider links/.test(line)), "the skip names the gap");
  } else {
    assert.notEqual(state.page, undefined, "a wired build names the page the browser pass tests");
  }
});
