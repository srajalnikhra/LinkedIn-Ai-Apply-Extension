console.log("LinkedIn AI Apply Extension: content script loaded");

const pageText = document.body.innerText;

console.log("LinkedIn AI Apply Extension: page text captured");

// show text length instead of full text
console.log("LinkedIn AI Apply Extension: page text length =", pageText.length);

// show first 200 chars clearly
console.log("LinkedIn AI Apply Extension: page text preview:");
console.log(pageText.substring(0, 200));
