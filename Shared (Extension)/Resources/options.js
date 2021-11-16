(function () {
  const NULL = "NULL";

  const message = document.getElementById("message");
  const clearButton = document.getElementById("clear");
  const authenticateButton = document.getElementById("authenticate");
  const formContent = document.getElementById("formcontent");
  const form = document.getElementById("form");

  function handleSubmit(e) {
    e.preventDefault();

    authenticateButton.disabled = true;

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    fetch("https://linksort.com/api/users/sessions", {
      headers: new Headers({
        "Content-Type": "application/json",
      }),
      method: "POST",
      mode: "cors",
      body: JSON.stringify({
        email: email,
        password: password,
      }),
    }).then((response) => {
      response
        .json()
        .then((decoded) => {
          if (response.status == 201) {
            chrome.storage.local.set({ token: decoded.user.token }, () => {
              showLogout();
            });
          } else {
            authenticateButton.disabled = false;
            document.getElementById("errorcontainer").innerText =
              decoded.message || "That didn't work. Please try again.";
          }
        })
        .catch(() => {
          authenticateButton.disabled = false;
          document.getElementById("errorcontainer").innerText =
            "Something went wrong.";
        });
    });
  }

  function showLogin() {
    clearButton.style.display = "none";
    message.innerText =
      "Before you can use this extension, you'll have to sign in.";
    authenticateButton.style.display = "inline-block";
    formContent.innerHTML = `
        <div>
          <p class="error" id="errorcontainer"></p>
        </div>
        <label>
          <span>Email</span>
          <input type="email" name="email" id="email" required autofocus>
        </label>
        <label>
          <span>Password</span>
          <input type="password" name="password" id="password" required>
        </label>
      `;

    form.addEventListener("submit", handleSubmit);
  }

  function showLogout() {
    message.innerHTML =
      "You are signed into Linksort. &#x1f60a <br /><br /> You can now close this window and save links as you browse by choosing the Linksort icon in the upper toolbar on desktop or the extensions menu on mobile.";
    clearButton.style.display = "inline-block";
    authenticateButton.style.display = "none";
    formContent.innerHTML = "";
    form.removeEventListener("submit", handleSubmit);

    clearButton.addEventListener("click", (e) => {
      e.preventDefault();

      chrome.storage.local.set({ token: NULL }, () => {
        window.location.reload();
      });
    });
  }

  chrome.storage.local.get(["token"], (values) => {
    if (values.token && values.token !== NULL) {
      showLogout();
    } else {
      showLogin();
    }
  });
})();
