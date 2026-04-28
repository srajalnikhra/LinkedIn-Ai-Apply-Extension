// Inject the "Apply (AI)" button into a specific LinkedIn post
function injectButton(post) {
  // 1. Avoid duplicates
  if (post.querySelector(".ai-apply-btn")) return;

  // 2. Extract the text content from the post
  const text = post.innerText || "";

  // 3. Extract the first email address found in the post text
  const emailMatch = text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);

  // 4. IF NO EMAIL, STOP IMMEDIATELY
  if (!emailMatch) {
    return;
  }

  // Debugging: Check console to see what email triggered the button
  console.log("LinkedIn AI: Found email:", emailMatch[0]);

  // 5. Create Button
  const btn = document.createElement("button");
  btn.className = "ai-apply-btn";
  btn.innerText = "Apply (AI) 🚀";
  btn.style.cssText = `
    width: 100%;
    margin-top: 8px;
    padding: 8px 16px;
    background-color: #0a66c2;
    color: white;
    border: none;
    border-radius: 0 0 8px 8px;
    cursor: pointer;
    font-weight: 600;
    font-size: 14px;
    text-align: center;
    z-index: 9999;
  `;

  btn.onclick = (e) => {
    e.stopPropagation();
    e.preventDefault();

    // Send extracted email and post data to the background script
    chrome.runtime.sendMessage({
      type: "SET_PANEL_DATA",
      payload: {
        email: emailMatch[0], // Send the found email
        postText: text
      }
    });

    // Open the side panel for the user to proceed
    chrome.runtime.sendMessage({ type: "OPEN_PANEL" });
  };

  // 6. Append the button to the post's action container
  const actionContainer = post.querySelector(".feed-shared-update-v2__description-wrapper")
    || post.querySelector(".feed-shared-update-v2__actions")
    || post;

  actionContainer.appendChild(btn);
}

// Continuously scan the LinkedIn feed for new posts
function scan() {
  const posts = document.querySelectorAll("div.feed-shared-update-v2");
  posts.forEach(injectButton);
}

// Initialize scanning loop to handle dynamically loaded posts
scan();
setInterval(scan, 2000);