function handleSubmit(event) {
    //Connect to c# backend
    event.preventDefault();

    const formData = new FormData(event.target);
    const data = {
        email: formData.get('email'),
        password: formData.get('password')
    };
    fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        if (response.ok) {
            return response.json();
        } else {
            throw new Error('Network response was not ok');
        }
    })

    .then(data => {
        localStorage.setItem('token', data.token); // store the token in localStorage
        alert('Login successful');
    })
    .catch(error => {
        alert('Login failed');
    });


}
