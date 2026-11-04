(() => {
  const main = document.querySelector("main");
  if (!main) return;

  main.addEventListener("copy", event => {
    if (event.defaultPrevented || !event.clipboardData ||
        event.target.closest("input, textarea, [contenteditable]")) return;

    const selection = document.getSelection();
    if (!selection || selection.isCollapsed ||
        !main.contains(selection.anchorNode) || !main.contains(selection.focusNode)) return;

    const text = selection.toString();
    if (!text.trim()) return;

    const source = location.origin + location.pathname;
    event.clipboardData.setData("text/plain", text + "\n\nSource: " + document.title + "\n" + source);
    event.preventDefault();
  });
})();
