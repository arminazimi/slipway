export * from "./utils.ts";

import * as c0 from "./checks/ae.agents-md.layout.ts";
import * as c1 from "./checks/ae.agents-md.never.ts";
import * as c2 from "./checks/ae.agents-md.paths-exist.ts";
import * as c3 from "./checks/ae.agents-md.present.ts";
import * as c4 from "./checks/ae.agents-md.schemas.ts";
import * as c5 from "./checks/ae.agents-md.size.ts";
import * as c6 from "./checks/ae.agents-md.verify.ts";
import * as c7 from "./checks/ae.edit-prompt.source.ts";
import * as c8 from "./checks/ae.edit-prompt.without-script.ts";
import * as c9 from "./checks/ae.rtl.bidi-isolated.ts";
import * as c10 from "./checks/ae.rtl.dir-matches-lang.ts";
import * as c11 from "./checks/ae.schemas.closed.ts";
import * as c12 from "./checks/ae.schemas.config.ts";
import * as c13 from "./checks/ae.schemas.content.ts";
import * as c14 from "./checks/ae.schemas.described.ts";
import * as c15 from "./checks/ae.schemas.index.ts";
import * as c16 from "./checks/ae.schemas.resolve.ts";
import * as c17 from "./checks/ae.schemas.valid.ts";
import * as c18 from "./checks/ae.skills.edit.ts";
import * as c19 from "./checks/ae.skills.index.ts";
import * as c20 from "./checks/ae.skills.resolve.ts";
import * as c21 from "./checks/ae.sourcemap.coverage.ts";
import * as c22 from "./checks/ae.sourcemap.ids.ts";
import * as c23 from "./checks/ae.sourcemap.lines.ts";
import * as c24 from "./checks/ae.sourcemap.present.ts";
import * as c25 from "./checks/ae.sourcemap.sources-exist.ts";
import * as c26 from "./checks/ae.sourcemap.urls-exist.ts";
import * as c27 from "./checks/unknown-config.ts";
import * as c28 from "./checks/unknown-front-matter.ts";
import * as c29 from "./checks/twin-fresh.ts";
import * as c30 from "./checks/schema-coverage.ts";
import * as c31 from "./checks/lang-mismatch.ts";
import * as c32 from "./checks/agent.skill-hint.ts";
import * as c33 from "./checks/agents-commands.ts";
import * as c34 from "./checks/i18n.zwnj.ts";
import * as c35 from "./checks/sourcemap-fresh.ts";
import * as c36 from "./checks/i18n.kashida.ts";
import * as c37 from "./checks/i18n.spacing.ts";

export const checks = {
  [c30.id]: c30.run,
  [c31.id]: c31.run,
  [c0.id]: c0.run,
  [c1.id]: c1.run,
  [c2.id]: c2.run,
  [c3.id]: c3.run,
  [c4.id]: c4.run,
  [c5.id]: c5.run,
  [c6.id]: c6.run,
  [c7.id]: c7.run,
  [c8.id]: c8.run,
  [c9.id]: c9.run,
  [c10.id]: c10.run,
  [c11.id]: c11.run,
  [c12.id]: c12.run,
  [c13.id]: c13.run,
  [c14.id]: c14.run,
  [c15.id]: c15.run,
  [c16.id]: c16.run,
  [c17.id]: c17.run,
  [c18.id]: c18.run,
  [c19.id]: c19.run,
  [c20.id]: c20.run,
  [c21.id]: c21.run,
  [c22.id]: c22.run,
  [c23.id]: c23.run,
  [c24.id]: c24.run,
  [c25.id]: c25.run,
  [c26.id]: c26.run,
  [c27.id]: c27.run,
  [c28.id]: c28.run,
  [c29.id]: c29.run,
  [c32.id]: c32.run,
  [c33.id]: c33.run,
  [c34.id]: c34.run,
  [c35.id]: c35.run,
  [c36.id]: c36.run,
  [c37.id]: c37.run,
};
