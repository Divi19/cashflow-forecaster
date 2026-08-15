# Decisions

## Recurrence semantics

1. **Month-end.** A monthly rule on day 31 clamps to the last day of short
   months (28 Feb, 29 Feb in a leap year). Rejected: skipping the month
   entirely. Billing should be done and February should absolutely not be 
   skipped.

2. **Pipeline order.** Generate over a padded window -> clip to the item's own
   start/end dates -> apply the weekend shift -> clip to the forecast window ->
   sort. Shifting before the window clip means an occurrence is judged on where
   it actually lands and not where it was nominally scheduled.

3. **Cross-month shifts allowed.** A bill scheduled Sunday 31 Aug lands Monday
   1 Sep, so it appears in September, not August. That's Accepted because that 
   is how the money actually moves. Consequence: an item can appear twice in one
   calendar month and not at all in another.

4. **Window bounds are inclusive on both ends.** Consistently, everywhere.

5. **Weekend direction differs by flow.** Income shifts backward (salary due
   Saturday arrives Friday), expenses shift forward (a bill due Saturday clears
   Monday). Same weekend, opposite shift.