# Making a Lombax design

“It could really be anything, but it has to be something.”

Lombax is a vault of independent interface designs for apps, websites, components, and related experiments. Each entry can serve a single, very particular situation. Give it a reason to exist.

- Start with something a person wants to understand, express, or do. Find a surprising way for them to do it. Inspiration can come from an object, an image, a word, a physical gesture, or anywhere else. Let that idea shape how information is revealed, how the interface responds, or how the composition communicates.
- Give each entry its own identity. Look at the existing vault before designing. Faultline is one example, not a house style. If a proposal amounts to an existing layout with a new palette or subject, revisit the underlying idea. Choose 2D, isometric, 3D, motion, or stillness according to what the piece needs.
- Compose navigation, calls to action, and other controls as part of the piece. A familiar button can be exactly right when it makes the intended action clear. Surprise belongs in the overall experience. Users should be able to discover what they can do, recognize what happened, and get back to the vault.
- Before shipping, try the main interaction from the vault on a narrow and a wide screen. Check keyboard use, visible focus, touch where relevant, and reduced motion when motion is involved. Ask what the unconventional choice helps the visitor see, feel, or accomplish. If its purpose or operation is unclear, refine the design.

## Adding an entry

1. Choose a distinctive name and create designs/<name>/ with its own index.html, CSS, and JavaScript in separate files. Include any additional assets the design needs.
2. Link the entry from designs/index.html, the vault's main entrance. Use paths that work under the GitHub Pages project URL and verify navigation in both directions.
3. Use pnpm for package management and project commands. Run pnpm build and exercise the finished interaction. Commit each design and its vault entry together as a separate commit, then push it to GitHub.
4. The optional Nuxt project is for trying designs in a realistic app context. When working on it, use the onmax skills and GSAP for animation. Use Three.js where it serves the design, and ask the owner for local skills if needed.
