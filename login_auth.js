function handleLogin(event) {
    event.preventDefault();

    const usernameInput = document.getElementById("username").value;
    const passwordInput = document.getElementById("password").value;

    const users = JSON.parse(localStorage.getItem("users")) || [];
    const user = users.find(u => u.username === usernameInput && u.password === passwordInput);

    if (user) {
        // Create a dummy token for session management
        const token = btoa(usernameInput + Date.now());
        sessionStorage.setItem("user", usernameInput);
        sessionStorage.setItem("auth_token", token);
        window.location.href = "home.html";
    } else {
        alert("Invalid username or password");
    }
}

function handleRegister(event) {
    event.preventDefault();

    const usernameInput = document.getElementById("username").value;
    const emailInput = document.getElementById("email").value;
    const passwordInput = document.getElementById("password").value;

    const users = JSON.parse(localStorage.getItem("users")) || [];
    const existingUser = users.find(u => u.username === usernameInput);

    if (existingUser) {
        alert("Username already exists");
        return;
    }

    const newUser = {
        username: usernameInput,
        email: emailInput,
        password: passwordInput
    };

    users.push(newUser);
    localStorage.setItem("users", JSON.stringify(users));

    alert("Registration successful! Please login.");
    window.location.href = "login.html";
}

function checkSession() {
    const user = sessionStorage.getItem("user");
    const token = sessionStorage.getItem("auth_token");
    const path = window.location.pathname;
    const onAuthPage = path.endsWith("login.html") || path.endsWith("register.html");

    // If logged in and on login/register page, go to home
    if (user && token && onAuthPage) {
        window.location.href = "home.html";
        return;
    }

    // If NOT logged in and on a protected page, go to login
    if ((!user || !token) && !onAuthPage) {
        window.location.href = "login.html";
        return;
    }

    // Update header UI if user is logged in
    if (user && token) {
        const userInfo = document.getElementById("user-info");
        const userDisplay = document.getElementById("user-display");
        const loginLink = document.getElementById("login-link");
        const registerLink = document.getElementById("register-link");

        if (userInfo && userDisplay) {
            userDisplay.textContent = `Welcome, ${user}!`;
            userInfo.style.display = "flex"; // Changed to flex for better layout
            userInfo.style.alignItems = "center";
            userInfo.style.gap = "10px";
        }

        if (loginLink) loginLink.style.display = "none";
        if (registerLink) registerLink.style.display = "none";

        const logoutBtn = document.getElementById("logout-btn");
        if (logoutBtn) {
            logoutBtn.addEventListener("click", handleLogout);
        }
    }
}

function handleLogout() {
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("auth_token");
    window.location.href = "login.html";
}

//Loads both header and footer and then checks the session
function loadSharedComponents() {
    const headerContainer = document.getElementById('header-container');
    const footerContainer = document.getElementById('footer-container');

    const loadHeader = headerContainer ?
        fetch('header.html').then(r => r.text()).then(html => headerContainer.innerHTML = html) :
        Promise.resolve();

    const loadFooter = footerContainer ?
        fetch('footer.html').then(r => r.text()).then(html => footerContainer.innerHTML = html) :
        Promise.resolve();

    Promise.all([loadHeader, loadFooter]).then(() => {
        checkSession();
    });
}

document.addEventListener("DOMContentLoaded", () => {
    const path = window.location.pathname;

    if (path.endsWith("login.html")) {
        const loginForm = document.querySelector("form");
        if (loginForm) loginForm.addEventListener("submit", handleLogin);
        checkSession();
    } else if (path.endsWith("register.html")) {
        const registerForm = document.querySelector("form");
        if (registerForm) registerForm.addEventListener("submit", handleRegister);
        checkSession();
    } else {
        // inner pages
        loadSharedComponents();
    }
});