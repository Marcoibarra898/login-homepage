function handleLogin(event) {
    event.preventDefault(); 
    
    const usernameInput = document.getElementById("username").value;
    const passwordInput = document.getElementById("password").value;

    const users = JSON.parse(localStorage.getItem("users")) || [];
    const user = users.find(u => u.username === usernameInput && u.password === passwordInput);

    if (user) {
        sessionStorage.setItem("user", usernameInput);
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
    if (!user) {
        window.location.href = "login.html";
    } else {
        const userInfoDisplay = document.getElementById("user-info");
        if (userInfoDisplay) {
            userInfoDisplay.textContent = `Welcome, ${user}!`;
        }
    }
}

function handleLogout() {
    sessionStorage.removeItem("user");
    window.location.href = "login.html";
}

document.addEventListener("DOMContentLoaded", () => {
    if (window.location.pathname.endsWith("login.html")) {
        const loginForm = document.querySelector("form");
        loginForm.addEventListener("submit", handleLogin);
    } else if (window.location.pathname.endsWith("register.html")) {
        const registerForm = document.querySelector("form");
        registerForm.addEventListener("submit", handleRegister);
    } else {
        checkSession();
        
        const logoutBtn = document.getElementById("logout-btn");
        if (logoutBtn) {
            logoutBtn.addEventListener("click", handleLogout);
        }
    }
});