function injectButton(post) {
  if (post.querySelector(".ai-apply-btn")) return;

  const emailMatch = post.innerText.match(
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/
  );
  if (!emailMatch) return;

  const email = emailMatch[0];

  const btn = document.createElement("button");
  btn.className = "ai-apply-btn";
  btn.innerText = "Apply (AI) · 1 email";
  btn.style.cssText = `
    width: 100%;
    margin-top: 8px;
    padding: 10px;
    background: #0a66c2;
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 14px;
    cursor: pointer;
  `;

  btn.onclick = () => {
    chrome.runtime.sendMessage({
      type: "POST_SELECTED",
      payload: { email }
    });

    chrome.runtime.sendMessage({ type: "OPEN_PANEL" });
  };

  post.appendChild(btn);
}

function scan() {
  document
    .querySelectorAll("div.feed-shared-update-v2")
    .forEach(injectButton);
}

scan();

new MutationObserver(scan).observe(document.body, {
  childList: true,
  subtree: true
});
