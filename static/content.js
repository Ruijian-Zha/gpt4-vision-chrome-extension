// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("content.js", { request });

  switch (request.action) {
    case "addUniqueTags":
      handleAddUniqueTags(sendResponse);
      return true;
    case "captureTab":
      handleCaptureTab(sendResponse);
      return true;
    case "clickElementByTag":
      handleClickElementByTag(request.uniqueTag, sendResponse);
      return true;
    case "inputElementByTag":
      handleInputElementByTag(request.uniqueTag, request.text, sendResponse);
      return true;
    case "scrollDown":
      handleScrollDown(sendResponse);
      break;
    case "openUrlInCurrentTab":
      handleOpenUrlInCurrentTab(request.url, sendResponse);
      return true;
    default:
      console.error("Invalid action: ", request.action);
  }
});

/* Message handlers */

async function handleAddUniqueTags(sendResponse) {
  try {
    await addUniqueTags();
    sendResponse({ status: "Success", message: "Tags added" });
  } catch (error) {
    console.error("Error adding unique tags: ", error);
    sendResponse({ status: "Error", message: error });
  }
}

async function handleCaptureTab(sendResponse) {
  try {
    const dataUrl = await captureTab();
    sendResponse({
      status: "Success",
      message: "Tab captured",
      image: dataUrl,
    });
  } catch (error) {
    console.error("Error capturing tab: ", error);
    sendResponse({ status: "Error", message: error.message });
  }
}

async function handleClickElementByTag(uniqueTag, sendResponse) {
  try {
    const clicked = await clickElementByTag(uniqueTag);
    sendResponse({
      status: clicked ? "Success" : "Error",
      message: clicked ? "Element clicked" : "Element not found",
    });
  } catch (error) {
    console.error("Error clicking element by tag: ", error);
    sendResponse({ status: "Error", message: error.message });
  }
}

async function handleInputElementByTag(uniqueTag, text, sendResponse) {
  try {
    const inputted = await inputElementByTag(uniqueTag, text);
    sendResponse({
      status: inputted ? "Success" : "Error",
      message: inputted ? "Element inputted" : "Element not found",
    });
  } catch (error) {
    console.error("Error inputting element by tag: ", error);
    sendResponse({ status: "Error", message: error.message });
  }
}

function handleScrollDown(sendResponse) {
  try {
    scrollDown();
    sendResponse({ status: "Success", message: "Scrolled down" });
  } catch (error) {
    console.error("Error scrolling down: ", error);
    sendResponse({ status: "Error", message: error.message });
  }
}

async function handleOpenUrlInCurrentTab(url, sendResponse) {
  try {
    await openUrlInCurrentTab(url);
    sendResponse({ status: "Success", message: "URL opened in current tab" });
  } catch (error) {
    console.error("Error opening URL in current tab: ", error);
    sendResponse({ status: "Error", message: error.message });
  }
}

/* Core functions */


function getRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

async function addUniqueTags() {
  await wait(1000); // Make sure this `wait` function is defined in your code.

  const elements = Array.from(document.querySelectorAll("a, button, input, textarea, [role='button'], [role='textbox']"))
  .filter(element => {
    const tagName = element.tagName.toUpperCase();
    return element.getClientRects().length > 0 && ["TEXTAREA", "SELECT", "BUTTON", "A", "IFRAME", "VIDEO"].includes(tagName);
  });

  elements.forEach((element, index) => {
    const rect = element.getBoundingClientRect();
    const isVisible = rect.top < window.innerHeight && rect.bottom >= 0 && rect.left < window.innerWidth && rect.right >= 0;

    if (isVisible && !element.hasAttribute("data-ai-tag")) {
      const uniqueTag = (index + 1).toString(); // Convert "index+1" to string
      const borderColor = getRandomColor(); // Ensure this function is defined to get a random border color

      element.setAttribute("data-ai-tag", uniqueTag);
      element.style.border = `2px dashed ${borderColor}`;
      element.style.position = 'relative';

      // Create and position the label.
      const labelElement = createLabelElement(index + 1, borderColor, element);
      document.body.appendChild(labelElement); // Append to the body to avoid positioning conflicts.
    }
  });
}

function createLabelElement(index, borderColor, element) {
  const labelElement = document.createElement("span");
  labelElement.textContent = `${index}`;
  labelElement.style.backgroundColor = borderColor;
  labelElement.style.color = "white";
  labelElement.style.padding = '2px';
  labelElement.style.fontSize = '12px';
  labelElement.style.border = `1px solid ${borderColor}`;
  labelElement.style.zIndex = '1000';
  labelElement.style.position = "absolute";
  labelElement.style.pointerEvents = 'none';  // Prevent the label from capturing mouse events

  // Append to body to calculate dimensions
  document.body.appendChild(labelElement); 

  // Calculate positions
  const rect = element.getBoundingClientRect();
  const verticalCenter = window.innerHeight / 2;
  const elementCenter = rect.top + rect.height / 2;
  
  if (elementCenter < verticalCenter) {
    // For elements above the vertical center, place label just below the bounding box
    labelElement.style.top = `${rect.bottom + window.scrollY}px`;
  } else {
    // For elements below the vertical center, place label just above the bounding box
    labelElement.style.top = `${rect.top + window.scrollY - labelElement.offsetHeight}px`;
  }

  // Center the label horizontally with respect to the element's width
  // labelElement.style.left = `${rect.left + window.scrollX + (rect.width - labelElement.offsetWidth) / 2}px`;
  labelElement.style.left = `${rect.left + window.scrollX}px`;

  return labelElement;
}


async function captureTab() {
  await wait(1000);
  return new Promise((resolve, reject) => {
    // Delegate the capture to the background script. Todo: is there a better way to do this?
    chrome.runtime.sendMessage({ action: "createImageFromTab" }, (response) => {
      if (response) {
        resolve(response.dataUrl);
      } else {
        reject("Failed to capture tab");
      }
    });
  });
}

async function clickElementByTag(uniqueTag) {
  const element = document.querySelector(
    `[data-ai-tag="${cleanTag(uniqueTag)}"]`
  );
  let elementFound = false;

  if (element) {
    element.style.border = "5px solid red";
    await wait(500);
    element.click();
    element.style.border = "";
    elementFound = true;
  }

  return elementFound;
}

async function inputElementByTag(uniqueTag, text) {
  const element = document.querySelector(
    `[data-ai-tag="${cleanTag(uniqueTag)}"]`
  );
  let elementFound = false;

  if (element) {
    if (element.hasAttribute('contenteditable')) {
      // Handle contenteditable divs
      for (let i = 0; i < text.length; i++) {
        element.textContent += text[i];
        await wait(100);
      }
    } else {
      // Handle input elements
      for (let i = 0; i < text.length; i++) {
        element.value += text[i];
        await wait(100);
      }
    }

    // Simulate hitting Enter
    const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
    element.dispatchEvent(enterEvent);

    elementFound = true;
  }

  return elementFound;
}

function scrollDown() {
  const scrollAmount = window.innerHeight * 0.8;
  window.scrollBy(0, scrollAmount);
}

function openUrlInCurrentTab(url) {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      var currTab = tabs[0];
      if (currTab) {
        chrome.tabs.update(currTab.id, { url: url }, function () {
          resolve();
        });
      } else {
        reject("No active tab found");
      }
    });
  });
}

/* Utility functions */

function createTagElement(uniqueTag, styles) {
  const tagElement = document.createElement("span");

  Object.keys(styles).forEach((styleKey) => {
    tagElement.style[styleKey] = styles[styleKey];
  });

  tagElement.textContent = `${uniqueTag}`;

  return tagElement;
}

function generateUID(digits = 4) {
  let string = "";
  for (let i = 0; i < digits; i++) {
    string += Math.floor(Math.random() * 10);
  }
  return string;
}

function cleanTag(tag) {
  return tag.replace(/\[|\]/g, "");
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

var sidebar = document.createElement('div');
sidebar.id = 'my-extension-sidebar';
document.body.appendChild(sidebar);

// Load the popup HTML as sidebar
fetch(chrome.runtime.getURL('index.html'))
  .then(response => response.text())
  .then(data => {
    sidebar.innerHTML = data;
  });
