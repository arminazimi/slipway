# 0019. The API model: one JSON file of modules, symbols, signatures, docs, and source

**Status:** Accepted (2026-10-30).

## Context

A documentation site built from source comments needs the same shape from every language: a page generator reads one model and renders modules, classes, functions, methods, types, constants, and endpoints with their signatures, parameters, return values, examples, deprecation, and the source line each came from. Four established converters were read before choosing a shape:

- **TypeDoc JSON** nests reflections by `kind` (module, class, interface, function, method, property, type alias) and puts callable details in `signatures`: parameters with a `type` tree, `defaultValue`, `flags.isOptional`; a comment with `summary` and `blockTags` (`@param`, `@returns`, `@example`, `@deprecated`); `sources` with `fileName`, `line`, `character`; and `flags.isDeprecated`.
- **rustdoc JSON** is a flat `index` of item ids. Each item has `kind`, an `inner` variant (a function's `sig` with typed `inputs` and `output`), `docs`, a `span` (filename, begin and end line and column), and `deprecation` (`since`, `note`). Methods live under `impls`, not under the type.
- **griffe** gives modules, classes, functions, and attributes with parsed docstring sections (`Parameters`, `Returns`, `Raises`, `Examples`, `Deprecated`), typed parameters with defaults, `labels` such as `deprecated`, and `filepath`/`lineno`/`endlineno`.
- **`go/doc`** gives packages with `Funcs`, `Types` (each with its `Funcs` and `Methods`), `Consts`, and `Vars`; doc text is plain; positions come from the file set's `token.Position`; examples come from `_test.go` files; deprecation is a `Deprecated:` paragraph convention.

They agree on more than they differ: a tree of named things, callable details beside the name, prose docs, a source position, and a deprecation flag. They disagree on everything a schema would have to freeze: type trees, where methods live, how deprecation is spelled, whether positions have an end.

## Decision

1. **One file, `api.json`, at the site root**, written by a converter and validated by `schema/api.schema.json`. Format version `"0.1"`; a change that breaks an existing file is a new version.
2. **Containers and symbols.** A container is a `module`, `class`, or `interface` and carries `members`. A symbol is a `function`, `method`, `type`, `constant`, or `endpoint`: a named thing the page documents on its own. Top-level entries are modules. What nests where is the converter's call, because TypeScript nests methods under a class and Go does not.
3. **Signatures stay text.** `signature` is the declaration as source writes it, so generics, defaults, and language syntax survive without a type tree. Parameters are structured — `name`, `type` (text, `unknown` when the converter cannot infer), `description`, `optional`, `default` as source text so `{}` and `""` stay distinct — and returns are `type` plus `description`.
4. **Docs are Markdown.** `description` is the comment without its markers, with the sections a converter can lift (`@param`, `@returns`, `@example`, `@deprecated`) moved into fields. Parsed docstring sections from griffe are flattened the same way.
5. **Every thing carries its source.** `source` is `{ file, line, commit }`: a relative path with forward slashes, a 1-based start line, and the lowercase commit hash the converter read. The page links to `/blob/<commit>/<file>#L<line>`, so a line is valid against the commit it names.
6. **Deprecation is an object, not a flag.** Its presence marks the deprecation; `since`, `replacement`, and `description` are optional because converters know different amounts. rustdoc's `since` and `note` map directly; TypeDoc's and griffe's flags map to an empty object; Go's paragraph becomes `description`.
7. **An endpoint is a symbol with `method` and `path`** (required together, forbidden elsewhere) plus the same parameters and returns. Request and response bodies, status codes, and security stay in the OpenAPI file the converter reads from; the model carries only what a docs page renders.
8. **Examples are `{ code, lang, title? }`**, the code without fences, so the theme renders a code block and never parses Markdown inside an example.
9. **Unknown fields are rejected.** A converter that needs a new field adds it in a version of the schema, so a typo cannot pass silently.

### What is left out, and why

- **Type structure.** Generics, unions, tuples, and inference would need a type tree per language. The model prints the type text and links the docs page instead; a tree is a compiler front end, not a docs format.
- **Inheritance, implementations, visibility, decorators, and annotations.** They change what a page could show, but no converter agrees on a shape, and a docs page links the class page instead.
- **Overloads as separate entries.** One symbol per name, with each overload on its own line in `signature`. Splitting them would need a discriminator the fixture cannot check across languages.
- **Properties and fields.** This version covers callables and named values; a page that needs fields waits for 0.2.
- **Errors and throws.** `go/doc` has none, griffe has `Raises`, TypeDoc has `@throws`; one shape would be mostly empty.
- **End positions and blame.** The start line is what a reader follows. A commit per symbol is the last change the converter saw; per-line history belongs to git.
- **Cross-references.** Doc links stay Markdown links; the model does not resolve symbol ids, so a moved symbol breaks a link the same way it breaks in the source.

## Consequences

- A converter writes one file per project; the theme walks modules, renders parameter and return tables from the structured fields, a deprecation banner from the object, an example block per example, and a source link per symbol.
- `tools/api/fixtures/model.json` is the contract: it covers every kind and validates in `tools/api/model.test.mjs`. A converter is correct when its output validates and reads like the fixture.
- A language without a converter yet — Rust's nightly rustdoc JSON included — can be added without changing the schema as long as it can name a file, a line, and a commit.
- The model is not an API reference generator: it has no layout, ordering, or navigation. Those stay in the site's content, as with every other Slipway page.
