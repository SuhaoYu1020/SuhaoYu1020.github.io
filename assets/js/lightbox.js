// Open a publication figure full size in a modal. Esc, a click anywhere or the close button closes it.
(function () {
  var thumbs = document.querySelectorAll("a.pub-thumb");
  if (!thumbs.length || typeof HTMLDialogElement !== "function") return;

  var dialog = document.createElement("dialog");
  dialog.className = "lightbox";
  dialog.innerHTML =
    '<figure><img alt=""><figcaption></figcaption></figure>' +
    '<button class="lightbox-close" type="button" aria-label="Close">&times;</button>';
  document.body.appendChild(dialog);
  var img = dialog.querySelector("img");
  var caption = dialog.querySelector("figcaption");

  thumbs.forEach(function (thumb) {
    thumb.addEventListener("click", function (event) {
      // Let modified clicks open the image file in a new tab as usual.
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      img.src = thumb.getAttribute("href");
      img.alt = "Figure: " + (thumb.dataset.caption || "");
      caption.textContent = thumb.dataset.caption || "";
      dialog.showModal();
    });
  });

  dialog.addEventListener("click", function () { dialog.close(); });
  dialog.addEventListener("close", function () { img.removeAttribute("src"); });
})();
