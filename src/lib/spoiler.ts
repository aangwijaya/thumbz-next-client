// The preference lives in a cookie (not localStorage) so the server renders the
// right state on first paint and a hidden score never flashes before hydration.
export const SPOILER_COOKIE = "thumbz-hide-scores";
