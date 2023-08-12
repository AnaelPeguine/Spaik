var signInModal = document.getElementById('signInModal');
// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
    if (event.target == signInModal) {
      signInModal.style.display = "none";
    }
}
async function submitForm(event) {
    event.preventDefault();
    const formData = {
      username: document.getElementById('usernameSignIn').value,
      password: document.getElementById('passwordSignIn').value
    };
    const response = await fetch('/signup', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
    });
    const result = await response.json();
    const passwordError = document.getElementById('passwordErrorSignIn');

    if (result.error) {

      passwordError.textContent = result.error;
      console.log(result.error)

    } else {

        document.getElementById('signInButton').innerHTML = `<a href="#user">${formData.username}</a>`;
        window.loggedInUsername = formData.username;
        localStorage.setItem('loggedInUsername', formData.username);
        signInButton.removeAttribute('onclick');
        signInButton.style.cursor = 'default';
        signInButton.style.backgroundColor = 'inherit'; 
        signInButton.style.color = 'inherit'; 
        signInButton.style.pointerEvents = 'none';
        logInButton.innerHTML = `<a href="/static/history.html">History</a>`;
        signInModal.style.display = "none";
        window.isLoggedIn = true;
        
    }

} 