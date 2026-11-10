The docs site scripts now run: the theme switch, mobile menu, search, copy buttons, and page agent menu work. The engine writes each theme script and its imports as browser modules, and the first paint no longer shifts when fonts or scripts load.
Pages preload the fonts their stylesheet declares with `font-display: optional`, so the text is laid out once.
