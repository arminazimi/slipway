export * from "./utils.mjs";

import * as c0 from "./checks/ae.agents-md.layout.mjs";
import * as c1 from "./checks/ae.agents-md.never.mjs";
import * as c2 from "./checks/ae.agents-md.paths-exist.mjs";
import * as c3 from "./checks/ae.agents-md.present.mjs";
import * as c4 from "./checks/ae.agents-md.schemas.mjs";
import * as c5 from "./checks/ae.agents-md.size.mjs";
import * as c6 from "./checks/ae.agents-md.verify.mjs";
import * as c7 from "./checks/ae.edit-prompt.source.mjs";
import * as c8 from "./checks/ae.edit-prompt.without-script.mjs";
import * as c9 from "./checks/ae.rtl.bidi-isolated.mjs";
import * as c10 from "./checks/ae.rtl.dir-matches-lang.mjs";
import * as c11 from "./checks/ae.schemas.closed.mjs";
import * as c12 from "./checks/ae.schemas.config.mjs";
import * as c13 from "./checks/ae.schemas.content.mjs";
import * as c14 from "./checks/ae.schemas.described.mjs";
import * as c15 from "./checks/ae.schemas.index.mjs";
import * as c16 from "./checks/ae.schemas.resolve.mjs";
import * as c17 from "./checks/ae.schemas.valid.mjs";
import * as c18 from "./checks/ae.skills.edit.mjs";
import * as c19 from "./checks/ae.skills.index.mjs";
import * as c20 from "./checks/ae.skills.resolve.mjs";
import * as c21 from "./checks/ae.sourcemap.coverage.mjs";
import * as c22 from "./checks/ae.sourcemap.ids.mjs";
import * as c23 from "./checks/ae.sourcemap.lines.mjs";
import * as c24 from "./checks/ae.sourcemap.present.mjs";
import * as c25 from "./checks/ae.sourcemap.sources-exist.mjs";
import * as c26 from "./checks/ae.sourcemap.urls-exist.mjs";
import * as c27 from "./checks/unknown-config.mjs";
import * as c28 from "./checks/unknown-front-matter.mjs";
import * as c29 from "./checks/twin-fresh.mjs";
import * as c30 from "./checks/schema-coverage.mjs";
import * as c31 from "./checks/lang-mismatch.mjs";
import * as c32 from "./checks/agent.skill-hint.mjs";
import * as c33 from "./checks/agents-commands.mjs";
import * as c34 from "./checks/i18n.kashida.mjs";

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
};
