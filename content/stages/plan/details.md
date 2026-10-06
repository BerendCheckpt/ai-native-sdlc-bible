You brainstorm with Claude, the result is written to `intent.md`, and recurring processes are encoded as skills.

### Steps

1. **Describe the problem**: what can't be done, who is affected, what "better" means, and what is out of scope.
2. **Brainstorm until the idea is concrete.** Claude asks analyst-style questions about scope, users, constraints and the definition of success.
3. **Have Claude write the result to `intent.md`** with the required `write-intent` skill. The skill is signed off by the lead.
4. **Correct misunderstandings.** The originator reviews the draft and fixes what Claude got wrong.
5. **Commit `intent.md`.** The commit records the author and timestamp, and the product owner picks up the idea from there.

### Who does what

| Role | Responsibility |
| --- | --- |
| Originator (human) | Describes the problem and corrects the draft |
| Claude | Asks analyst-style questions and drafts `intent.md` with the `write-intent` skill |
| Lead (human) | Owns and signs off the `write-intent` skill |
| Product owner (human) | Picks up the committed intent and decides whether it moves into design |

### What it triggers

A committed `intent.md` starts the requirements and design pass in Stage 2.
