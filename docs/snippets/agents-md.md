This repository contains a static site built with a static site generator.

Source files are in `<source dir>`. After building, the output is in `<build dir>`.

After any change, you must verify the site by running:

```bash
npx slipway doctor <source dir> --build <build dir>
```

If there is no build directory yet, omit the `--build` flag.

Review the output of this command. Fix any findings by going to the specific file and line reported. Then, run the command again. Repeat this process until it reports no required failures (i.e. all MUST tests pass).

### Never do these things

- Never edit files in the built output folder (`<build dir>`).
- Never put Liquid or template syntax inside content files (e.g. Markdown).
- Never commit generated files to the repository.
