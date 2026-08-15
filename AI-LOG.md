# AI Log

- The recurrence engine and test suite were AI-generated based on
  my spec. I verified everything by running the suite and caught
  one bad assertion: a bi-weekly schedule starting Jan 1st yields
  27 occurences a year instead of 26. I shifted the anchor date
  to Jan 2nd to correct the math.