# Making a Lombax design

“It could really be anything, but it has to be something.”

Lombax is a vault of independent interface designs for apps, websites, components, and related experiments. Each entry can serve a single, very particular situation. Give it a reason to exist.

- Start with a specific situation and name one thing a familiar interface makes hard to see, compare, predict, express, or do. It can be an everyday software task or an experiment. Identify the interface convention that creates the limitation. Rethink that convention so the visitor can see, decide, or do something they otherwise would struggle to.
- Keep the vault presentation on its main page. Its job is to help visitors choose a design. Add the entrance link there and preserve the existing presentation. Inside each entry, give the piece its own opening, composition, typography, and controls. Leave the Lombax masthead, plate numbers, and archive framing at the entrance.
- Before building, sketch the starting state, one visitor action, and its consequence using realistic content. Give the visitor enough information to understand what changed and why. Test the idea with plain styling. If the benefit disappears or the same interaction works unchanged for an unrelated subject, rethink the premise.
- Let the visitor step straight into the interaction. Choose stillness, motion, 2D, or 3D according to what it helps them experience. Use familiar controls wherever they make the idea easier to use.
- Give each entry a discoverable way back to the vault. Work the exit into the piece when the idea suggests one. Otherwise, put a simple back link at the top and style it for that entry.
- Before shipping, try the main interaction from the vault on a narrow and a wide screen. Check keyboard use, visible focus, touch where relevant, and reduced motion when motion is involved. Ask what the unconventional choice helps the visitor see, feel, or accomplish. If its purpose or operation is unclear, refine the design.

## What to learn from UNSEEN

Study the leap each exhibit makes from a familiar task to an unexpected way of doing it. The five examples below are reference analysis. Originate every Lombax entry from its own subject and visitor need. Keep the exhibits’ concepts, metaphors, signature mechanics, composition, typography, assets, and code out of Lombax designs.

- **Prism questioned what a filter should do to a partial match.** A search result usually passes or disappears. Prism sends games through an optical bench, where lenses arrange the matches and weaker signals keep near-misses in view. Its comparison mode cancels shared traits so the differences stand out. The leap was treating search as a way to explore trade-offs and see what a preference costs.
- **Aqueduct questioned how a budget should explain a shortfall.** Budget totals show what is left in each category. Aqueduct makes each category a water chamber and lets the visitor drop in an expense as a stone. When one chamber cannot absorb the expense, the overflow visibly draws from another. The leap was letting someone try a decision and follow its downstream consequences in the same view.
- **Origami Time questioned whether all days need equal space.** A week grid keeps distant days apart even when those are the days you want to compare. Folding the intervening days brings Tuesday flush against Saturday while the folded days remain visible as a narrow pleat. Nearby commitments can also show compression as gaps tighten. The leap was letting the calendar change shape around the question someone is asking.
- **Thermograph questioned whether a recipe should read in a single order.** The thermal surface reveals technique and quantities in place, and a separate score counts backward to plating across parallel tracks for the pot, skillet, and prep. The leap was making overlap and dependencies visible so the cook can tell what to do while another step runs.
- **Entropy questioned whether a task list should look the same after a week of inaction.** Effort has visible mass, deadlines pull attention, and neglected tasks sink and fossilize as time advances. The leap was making elapsed time change how the work is perceived, including work the visitor has stopped looking at.

For a new entry, find a different assumption that limits the visitor and invent a behavior specific to that situation. The ambition is for the original interaction to change the task as clearly as these examples do. The notes above are self-contained. [Original UNSEEN exhibition](https://bungerz.github.io/ai_vehicule_use/)

## Adding an entry

1. Choose a distinctive name and create designs/<name>/ with its own index.html, CSS, and JavaScript in separate files. Include any additional assets the design needs.
2. Link the entry from designs/index.html, the vault's main entrance. Use paths that work under the GitHub Pages project URL and verify navigation in both directions.
3. Use pnpm for package management and project commands. Run pnpm build and exercise the finished interaction. Commit each design and its vault entry together as a separate commit, then push it to GitHub.
4. The optional Nuxt project is for trying designs in a realistic app context. When working on it, use the onmax skills and GSAP for animation. Use Three.js where it serves the design, and ask the owner for local skills if needed.
