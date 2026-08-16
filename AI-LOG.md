# AI Log

Where AI was used on this project, what I kept, and how I checked the output.

## The short version

AI wrote most of the code in this repo by working from specifications I set and
semantics I chose. I own all of it and the decisions in `DECISIONS.md` and the README
are mine, the tests encode behaviour I picked rather than behaviour the model
happened to produce and every step was gated on a passing suite and a clean build
before it went in.

## How the work was split

**What I owned:**

- Scope. Two features, everything else written down as deliberately out of scope.
- The data model shape: plain calendar dates rather than timestamps, integer sen
  rather than floats and recurrence rules as a discriminated union.
- Every semantic decision in `DECISIONS.md`: month-end clamping, pipeline ordering,
  cross-month shifts, weekend shift direction, debits-before-credits, intra-day
  trough.
- What the tests assert. The golden scenario in `forecast.test.ts` was worked out by
  hand on paper before the code existed, so the assertions describe what should
  happen rather than what the code does.
- Scope cuts under time pressure: no item editing, no adjustable window, no
  public-holiday handling.

**What I delegated:**

- Implementation of `recurrence.ts` and `forecast.ts` against the specs above.
- The test files from a list of cases I specified.
- The React components, Tailwind classes and Recharts configuration.
- Boilerplate scaffold config, formatting helpers and storage wrapper.

## How I checked it

- **Tests first, code second.** The test cases were fixed before the implementations
  were written, so passing meant matching my intended semantics rather than
  self-consistency.
- **A hand-checkable golden scenario.** A month of balances I could verify against a
  calendar by hand: RM 1,000 opening, rent shiftig off a Saturday to Monday the 3rd
  and salary on the 25th.
- **Every step gated on `npm test` and `npm run build`.** Nothing was committed on a
  red suite and nothing was "fixed" by editing a test.
- **Manual checks for what tests can't cover.** Adding an item and refreshing to
  confirm persistence. Cross-checking that the chart's trough marker sits on the
  same date the table highlights.
- **Reading against the calendar.** I checked the rendered table by hand: salary on
  Tue 25 Aug unshifted, Sun 25 Oct shifting back to Friday the 23rd and groceries
  landing fortnightly rather than monthly.

## Things caught and corrected

**A wrong test assertion.** The every 14 days test originally asserted 26
occurrences in 2026 with an anchor of 1 January. That's wrong: 1 Jan to 31 Dec is 364
days, which divides evenly by 14, so an anchor on the 1st produces 27 occurrences,
not 26. The anchor was moved to 2 January. Worth noting that this is a real property
of the rule and not just a test bug. The number of fortnightly payments in a year
depends on where the anchor falls.

**A build-breaking unused import.** `ItemForm.tsx` imported the `WeekendPolicy` type
without using it. This project has `noUnusedLocals: true`, so `tsc -b` rejected it.
Caught by running the build rather than only the dev server: `vite dev` tolerates
things the production build does not.

**Rejected an automated "best practices" suggestion.** A tooling hook proposed
restructuring `App.tsx` while it was being written. I declined it as the file was being
written to a specification I'd set and accepting an unrequested refactor mid-step
would have meant shipping code I hadn't reasoned about.

## What I'd do differently (A decent bit after this experience)

The main thing is verification breadth rather than the depth. The pure logic is well
covered because it's easy to test; the components aren't covered at all and I
checked those by hand. With more time the form validation would get real tests since
it's the layer where a user can actually put bad data in.