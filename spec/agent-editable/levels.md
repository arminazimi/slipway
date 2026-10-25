# Agent-editable site: conformance levels

**Status:** Draft, for [version 0.1](0.1.md) of the spec. Machine-readable tests: [`tests.json`](tests.json), valid against [`schema/conformance-tests.schema.json`](../../schema/conformance-tests.schema.json).

A site reaches a level when it meets every MUST of that level and of every level below it. Each level is a strict superset of the one below: it keeps all of the lower level's requirements and adds at least one MUST. There is no level above L3.

SHOULD requirements belong to a level too, so a checker can say where a warning matters, but a SHOULD that fails is a warning and never lowers the level.

## The levels

| Level | Adds | An agent can |
| --- | --- | --- |
| L0 | `AGENTS.md` and a page-to-file map | find the file behind any page and the rules for editing it |
| L1 | content schemas | write front matter and config that the site accepts |
| L2 | section-to-line maps and edit prompts | edit the exact line a person points at |
| L3 | the agent-skills index | find all of the above from the live site alone |

### L0: instructions and a page-to-file map

| Id | Keyword | Scope |
| --- | --- | --- |
| [`ae.agents-md.present`](0.1.md#11-aeagents-mdpresent) | MUST | source |
| [`ae.agents-md.layout`](0.1.md#12-aeagents-mdlayout) | MUST | source |
| [`ae.agents-md.paths-exist`](0.1.md#13-aeagents-mdpaths-exist) | MUST | source |
| [`ae.sourcemap.present`](0.1.md#31-aesourcemappresent) | MUST | output |
| [`ae.sourcemap.sources-exist`](0.1.md#32-aesourcemapsources-exist) | MUST | both |
| [`ae.sourcemap.urls-exist`](0.1.md#33-aesourcemapurls-exist) | MUST | output |
| [`ae.agents-md.never`](0.1.md#14-aeagents-mdnever) | SHOULD | source |
| [`ae.agents-md.size`](0.1.md#17-aeagents-mdsize) | SHOULD | source |

### L1: content schemas

Everything in L0, and:

| Id | Keyword | Scope |
| --- | --- | --- |
| [`ae.agents-md.schemas`](0.1.md#16-aeagents-mdschemas) | MUST | source |
| [`ae.schemas.index`](0.1.md#21-aeschemasindex) | MUST | source |
| [`ae.schemas.resolve`](0.1.md#22-aeschemasresolve) | MUST | source |
| [`ae.schemas.config`](0.1.md#23-aeschemasconfig) | MUST | source |
| [`ae.schemas.content`](0.1.md#24-aeschemascontent) | MUST | both |
| [`ae.schemas.valid`](0.1.md#25-aeschemasvalid) | MUST | source |
| [`ae.agents-md.verify`](0.1.md#15-aeagents-mdverify) | SHOULD | source |
| [`ae.sourcemap.coverage`](0.1.md#34-aesourcemapcoverage) | SHOULD | both |

### L2: section-to-line maps and edit prompts

Everything in L1, and:

| Id | Keyword | Scope |
| --- | --- | --- |
| [`ae.sourcemap.lines`](0.1.md#35-aesourcemaplines) | MUST | both |
| [`ae.sourcemap.ids`](0.1.md#36-aesourcemapids) | MUST | output |
| [`ae.edit-prompt.source`](0.1.md#51-aeedit-promptsource) | MUST | output |
| [`ae.edit-prompt.content`](0.1.md#52-aeedit-promptcontent) | MUST (review) | output |
| [`ae.edit-prompt.no-send`](0.1.md#53-aeedit-promptno-send) | MUST (review) | output |
| [`ae.schemas.described`](0.1.md#26-aeschemasdescribed) | SHOULD | source |
| [`ae.schemas.closed`](0.1.md#27-aeschemasclosed) | SHOULD | source |
| [`ae.edit-prompt.without-script`](0.1.md#54-aeedit-promptwithout-script) | SHOULD | output |

### L3: the agent-skills index

Everything in L2, and:

| Id | Keyword | Scope |
| --- | --- | --- |
| [`ae.skills.index`](0.1.md#41-aeskillsindex) | MUST | output |
| [`ae.skills.resolve`](0.1.md#42-aeskillsresolve) | MUST | output |
| [`ae.skills.edit`](0.1.md#43-aeskillsedit) | MUST | output |

## `tests.json`

[`tests.json`](tests.json) lists one test per requirement, in the order of the spec, with the same id, level, keyword, and scope. A checker loads it and never hard-codes a requirement id. Each test has:

- `id`, `level`, `keyword`, `scope`: as in the spec.
- `how`: `automated` when a checker decides it, `review` when a person does by following `check`.
- `network`: `opt-in` when part of the test needs network access, which a checker runs only when its network option is on. No other test uses the network.
- `description` and `check`: the requirement's text and its check, copied from the spec.

The spec and `tests.json` change together: a test in this repository fails when an id, level, keyword, or scope differs between them.

## How a checker reports a level

A checker, such as `slipway doctor` (`doctor.cli`), runs every test it can on the source folder and, when given one, the output folder. Each test ends as `pass`, `fail`, or `not-run`:

- A `review` test is `not-run`; a person decides it.
- The network part of an `opt-in` test is `not-run` when the network option is off; the rest of the test still runs.
- A test that needs the output folder is `fail` when no output folder is given, because the site has not shown that it meets it.

The reported level is the highest level whose MUST tests, together with the MUST tests of every level below, all end as `pass` or `not-run`. When an L0 MUST fails, the site has no level.

In JSON output the result has a `level` field, `"L0"` to `"L3"`, or `null` when no level is reached, and lists the tests it did not run so a person can finish them:

```json
{
  "spec": "agent-editable",
  "version": "0.1",
  "level": "L2",
  "notRun": ["ae.edit-prompt.content", "ae.edit-prompt.no-send"],
  "findings": []
}
```

The rest of the output format, including `findings`, belongs to `doctor.output`.
