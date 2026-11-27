# Making a Lombax design

“It could really be anything, but it has to be something.”

Lombax is a vault of independent interface designs for apps, websites, components, and related experiments. Each entry can serve a single, very particular situation. Give it a reason to exist.

- Start with something a person wants to understand, express, or do. Find a surprising way for them to do it. Inspiration can come from an object, an image, a word, a physical gesture, or anywhere else. Let that idea shape how information is revealed, how the interface responds, or how the composition communicates.
- Keep the vault presentation on its main page. Its job is to help visitors choose a design. Add the entrance link there and preserve the existing presentation. Inside each entry, give the piece its own opening, composition, typography, and controls. Leave the Lombax masthead, plate numbers, and archive framing at the entrance.
- Before building, describe one specific moment a visitor could only have in this piece. Sketch what they see, what they can do or notice, and what that reveals. Try swapping in an unrelated subject. If the same hero, gallery, and controls still tell the same story, rethink the premise. A beautiful specimen gallery with a movable spotlight was the owner's example of a polished design that still felt familiar.
- Let the visitor step straight into that moment. Choose stillness, motion, 2D, or 3D according to what it helps them experience. A distinctive idea can be quiet and a familiar control can serve it well.
- Give each entry a discoverable way back to the vault. Work the exit into the piece when the idea suggests one. Otherwise, put a simple back link at the top and style it for that entry.
- Before shipping, try the main interaction from the vault on a narrow and a wide screen. Check keyboard use, visible focus, touch where relevant, and reduced motion when motion is involved. Ask what the unconventional choice helps the visitor see, feel, or accomplish. If its purpose or operation is unclear, refine the design.

## Adding an entry

1. Choose a distinctive name and create designs/<name>/ with its own index.html, CSS, and JavaScript in separate files. Include any additional assets the design needs.
2. Link the entry from designs/index.html, the vault's main entrance. Use paths that work under the GitHub Pages project URL and verify navigation in both directions.
3. Use pnpm for package management and project commands. Run pnpm build and exercise the finished interaction. Commit each design and its vault entry together as a separate commit, then push it to GitHub.
4. The optional Nuxt project is for trying designs in a realistic app context. When working on it, use the onmax skills and GSAP for animation. Use Three.js where it serves the design, and ask the owner for local skills if needed.
