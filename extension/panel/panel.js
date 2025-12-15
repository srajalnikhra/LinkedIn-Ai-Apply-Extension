chrome.storage.local.get("applyData", (result) => {
  const data = result.applyData;

  if (!data) return;

  document.getElementById("emails").innerText =
    data.emails.join(", ");

  document.getElementById("postText").innerText =
    data.postText.slice(0, 500) + "...";
});

document.getElementById("closePanel").onclick = () => {
  window.close();
};
