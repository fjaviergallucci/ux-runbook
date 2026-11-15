# Linen

The design system of Clinic rooms, version 2.3.

- **Tokens:** `src/styles/linen-tokens.css`. A warm paper ground, `--linen-ground: #f6f1e7`; ink,
  `--linen-ink: #2b2620`; one accent, `--linen-accent: #0f6b5c`; the typeface Atkinson Hyperlegible, in
  two sizes; a 4 px grid.
- **Components:** `src/components/linen/`: LinenButton, LinenField, LinenTable, LinenBadge, LinenDialog.
- **Conventions:** a list of things is a LinenTable with its search field above it; a state is a
  LinenBadge; an action that books or saves is the one accent LinenButton of its screen, at the bottom
  right of its panel.
