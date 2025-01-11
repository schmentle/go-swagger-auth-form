window.onload = async function () {
  let config = {};

  const initializeSwaggerUI = async () => {
    try {
      const response = await fetch("/config");
      if (!response.ok) {
        throw new Error("Failed to load Swagger configuration.");
      }

      config = await response.json();
      const docUrl = config.swaggerDocURL || "/swagger/doc.json";

      const ui = SwaggerUIBundle({
        url: docUrl,
        dom_id: "#swagger-ui",
        deepLinking: true,
        presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
        layout: "StandaloneLayout",
      });

      window.ui = ui;

      attachAuthorizeButtonListener();
    } catch (err) {
      console.error("Error initializing Swagger UI:", err);
      alert("Unable to load Swagger configuration.");
    }
  };

  const attachAuthorizeButtonListener = () => {
    document.body.addEventListener("click", (event) => {
      if (event.target.closest(".authorize")) {
        setTimeout(addLoginForm, 500);
      }
    });
  };

  const addLoginForm = () => {
    const modalContent = document.querySelector(".modal-ux .modal-ux-content .auth-container");

    if (!modalContent) {
      console.error("Swagger Authorize modal not found!");
      return;
    }

    if (!document.querySelector(".custom-auth-container")) {
      const authContainer = createAuthContainer();
      modalContent.prepend(authContainer);
      console.log("Custom login form successfully added!");
    }
  };

  const createAuthContainer = () => {
    const authContainer = document.createElement("div");
    authContainer.className = "custom-auth-container";
    authContainer.style.marginTop = "20px";

    authContainer.innerHTML = `
      <h4>Login</h4>
      <p>Returns a <code>token</code> for using in <code>BearerAuth</code></p>
      <div style="margin: 10px 0;">
        <input id="swagger-username" type="text" placeholder="Username" class="auth-input swagger-ui-input" />
      </div>
      <div style="margin: 10px 0;">
        <input id="swagger-password" type="password" placeholder="Password" class="auth-input swagger-ui-input" />
      </div>
      <button id="swagger-login" class="swagger-ui-button btn authorize unlocked">Login</button>
    `;

    attachLoginFunctionality(authContainer);
    return authContainer;
  };

  const attachLoginFunctionality = (container) => {
    container.querySelector("#swagger-login").onclick = async function () {
      const username = document.getElementById("swagger-username").value;
      const password = document.getElementById("swagger-password").value;

      if (!username || !password) {
        alert("Username and password are required.");
        return;
      }

      try {
        const authUrl = config.authUrl || "/auth";
        const response = await fetch(authUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });

        const data = await response.json();

        if (response.ok) {
          const token = "Bearer " + data.access_token;
          if (window.ui) {
            window.ui.preauthorizeApiKey("BearerAuth", token);
          }
          alert("Login successful!");
        } else {
          alert("Login failed: " + (data.error || "Unknown error"));
        }
      } catch (err) {
        console.error("Login error:", err);
        alert("An error occurred during login.");
      }
    };
  };

  initializeSwaggerUI();
};