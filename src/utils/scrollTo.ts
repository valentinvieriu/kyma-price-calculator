// In-page navigation without touching the URL hash, which holds the shared
// configuration. Inputs also get focus so the user can type right away.
export default function scrollToElement(
  id: string,
  {
    focus = false,
    block = 'center' as ScrollLogicalPosition,
    behavior = 'smooth' as ScrollBehavior,
  } = {},
) {
  const element = document.getElementById(id);
  if (!element) return;
  element.scrollIntoView({ behavior, block });
  if (focus) element.focus({ preventScroll: true });
}
