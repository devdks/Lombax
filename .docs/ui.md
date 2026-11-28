# UI

The UI is the built, usable experience. It carries the [design](design.md) into layout, rendering, controls, and feedback while preserving the [concept’s rules](concept.md).

## Implement the interaction

1. **Begin with the decisive example.** Build the central action through to its consequence. Check that the starting state from the vault gives the visitor enough context to try it immediately.
2. **Keep views and readouts in agreement.** Use the same subject model for scenes, controls, values, and recommendations. Name units, time windows, and assumptions where visitors need them. A camera switch should preserve the scenario it is showing.
3. **Make the main action work through familiar controls.** Use native controls and meaningful names where they fit. Provide visible keyboard focus, suitable touch targets, and a usable equivalent for actions on a visual scene. Keep the task usable with reduced motion by preserving meaningful state changes and the ability to step through them.
4. **Refine the live composition.** Check the reading order, visible labels, and spacing on narrow and wide screens with real values. Inspect long labels and changing results for collisions. Give special attention to what the visitor sees immediately after an action.

## Catchment

The [runoff model](../designs/catchment/runoff.js) calculates water volumes and overflow timing. The [scene renderer](../designs/catchment/courtyard.js) draws the courtyard and runoff. The [interaction code](../designs/catchment/study.js) keeps the site pins, radio controls, rain slider, timeline, and readouts in sync. The reading attached to the door follows the current minute. The comparison strip uses the end of the same 30-minute storm.

Visitors can select a site in the scene or in the comparison strip. They can inspect a minute directly, replay the storm, or jump to overflow. Reduced motion retains the minute-by-minute changes while removing the continuous movement of the flow arrows. The model notes describe the fixed drainage routes and illustrative terrain.

## Check the built entry

- Start at the actual vault entrance. Use both entrances when the vault offers more than one, and verify the way back.
- Try the central interaction on a wide and a narrow screen with keyboard and touch where relevant. Check visible focus, layout, and reduced motion when the entry uses motion.
- Repeat the concept’s decisive examples. Include the baseline or boundary where it matters. Check that the scene, numbers, and explanation agree as the visitor changes inputs or views.
- Ask a reviewer what they could see, understand, or do because of the unconventional interaction. Follow the evidence back to the part that needs refinement. Use the repository’s [build and release instructions](../AGENTS.md#adding-an-entry) when shipping the entry.

The UI is ready to put in front of a reviewer when the central task works through the vault, the worked cases agree with the model, and the visitor can reach the same outcome with the supported inputs.
