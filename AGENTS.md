# Making a Lombax design

“It could really be anything, but it has to be something.”

Lombax is a vault of independent interface designs for apps, websites, components, and related experiments. Each entry can serve a single, very particular situation. Give it a reason to exist.

- Start with a specific situation and name one thing a familiar interface makes hard to see, compare, predict, express, or do. It can be an everyday software task or an experiment. Identify the convention that creates the limitation and rethink it so the visitor can do the task in a new way or understand something they would otherwise miss.
- Develop an original premise, interaction, and visual identity grounded in the visitor’s goal and the subject’s own facts, relationships, and constraints. Explore different ways the task could work before settling on a composition or visual treatment.
- Keep the vault presentation on its main page. Its job is to help visitors choose a design. Add the entrance link there and preserve the existing presentation. Inside each entry, give the piece its own opening, composition, typography, and controls. Leave the Lombax masthead, plate numbers, and archive framing at the entrance.
- Before building, sketch the starting state, one visitor action, and its consequence using realistic content. Give the visitor enough information to understand what changed and why. Test the idea with plain styling. If the benefit disappears or the same interaction works unchanged for an unrelated subject, rethink the premise.
- Let the visitor step straight into the interaction. Choose stillness, motion, 2D, or 3D according to what it helps them experience. Use familiar controls wherever they make the idea easier to use.
- Give each entry a discoverable way back to the vault. Work the exit into the piece when the idea suggests one. Otherwise, put a simple back link at the top and style it for that entry.
- Before shipping, try the main interaction from the vault on a narrow and a wide screen. Check keyboard use, visible focus, touch where relevant, and reduced motion when motion is involved. Ask what the unconventional choice helps the visitor see, feel, or accomplish. If its purpose or operation is unclear, refine the design.

## Adding an entry

1. Choose a distinctive name and create designs/<name>/ with its own index.html, CSS, and JavaScript in separate files. Include any additional assets the design needs.
2. Link the entry from designs/index.html, the vault's main entrance. Use paths that work under the GitHub Pages project URL and verify navigation in both directions.
3. Use pnpm for package management and project commands. Run pnpm build and exercise the finished interaction. Commit each design and its vault entry together as a separate commit, then push it to GitHub.
4. The optional Nuxt project is for trying designs in a realistic app context. When working on it, use the onmax skills and GSAP for animation. Use Three.js where it serves the design, and ask the owner for local skills if needed.
