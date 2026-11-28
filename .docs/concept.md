# Concept

The concept is the interaction and the rules that turn the purpose into something a visitor can try. It defines what the visitor can change, what stays fixed, and how the subject responds.

## When Lombax proposes the concept

Start from the [purpose](purpose.md). Sketch distinct ways of making the obstacle visible. A static comparison might answer which option wins. A replay might show when and why it starts to win. Choose the interaction that makes the decisive relationship easiest to investigate with realistic inputs.

## When the owner brings the concept

1. Restate the supplied premise, the defining interaction, and any constraints the owner set. Carry those into the work as given.
2. Capture the purpose it serves. Use a provisional reading when a gap can be resolved with a reversible assumption. Ask before changing the premise, a required behavior, or the intended audience.
3. Develop the missing rules, example content, and states around that concept. Run the same worked-example check used for a Lombax proposal. If the check exposes a conflict with a defining part of the supplied concept, show the specific example and its consequence before proposing a change.

## Work the interaction on paper first

1. **Sketch the before and after.** Record the starting view, one visitor action, the visible consequence, and the reason it follows. Use realistic names, quantities, and units.
2. **Write down the rules.** Separate what the visitor changes from fixed constraints. Name the assumptions behind any prediction or recommendation so the UI can explain it.
3. **Try a second case that puts pressure on the first.** Look for a threshold, a reversal, a tie, or an input that leaves the result unchanged. Compare against a meaningful baseline when it helps the visitor understand the effect.
4. **Test with plain styling.** Use a sketch, a small table, or a minimal prototype. The visitor should already gain an insight from the interaction. The rules should explain why it belongs to this subject.

## Catchment

The visitor places the same 900 L basin at one of three sites, changes rain intensity, or inspects a minute of a 30-minute storm. Each site receives different runoff paths and has a different infiltration rate. The model tracks how much water the basin stores, how much the soil absorbs, and how much reaches the workshop door.

The entry opens at minute 30 with rain at 32 mm/h and the garden in the low corner. Moving the garden to the roof edge stops roof runoff from continuing past the basin in this case. The paving route still runs to the door, and the door reading drops from 1,188 L to 864 L. The no-garden baseline for the same storm is 2,208 L.

| Case | What happens at the door | What explains it |
| --- | --- | --- |
| 10 mm/h, low corner | 0 L reaches the door after 30 minutes. | The low corner intercepts both paths, and its storage and drainage handle the runoff. |
| 32 mm/h, low corner | The basin first overflows at the displayed minute 13. By the end, 1,188 L reaches the door. | Both paths reach the basin and fill it faster than the soil drains it. |
| 32 mm/h, roof edge | 864 L reaches the door by the end, 324 L less than at the low corner. | Faster soil infiltration frees storage for roof runoff during the storm. Paving runoff still reaches the door. |

## Handoff to design

Give [Design](design.md) the starting state, the actions worth exposing, the rules, the worked cases, and the evidence the visitor needs for each consequence. The concept is ready when the central insight holds in plain styling and the example outcomes follow from the stated rules.
