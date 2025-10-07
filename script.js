document.addEventListener('DOMContentLoaded', function() {
    let username = document.getElementById('username');     
    let labelUsername = document.getElementById('labelUsername');

        let email = document.getElementById('email');
    let labelEmail = document.getElementById('labelEmail');

    let password = document.getElementById('password');
    let labelPassword = document.getElementById('labelPassword');

    // Validação do nome de usuário
    if (username && labelUsername) {
        username.addEventListener('keyup', () => {
            if(username.value.length < 10) {
                labelUsername.setAttribute('style', 'color: red');
                labelUsername.innerHTML = 'Nome de Usuário *Insira no mínimo 10 caracteres';
                username.setAttribute('style', 'border-color: red');
            } else {
                labelUsername.setAttribute('style', 'color: green');
                labelUsername.innerHTML = 'Nome de Usuário';
                username.setAttribute('style', 'border-color: green');
            }
        });
    }

    // Validação do email
    if (email && labelEmail) {
        email.addEventListener('keyup', () => {
            if(!email.value.includes('@') || !isValidEmail(email.value)) {
                labelEmail.setAttribute('style', 'color: red');
                labelEmail.innerHTML = 'Email *Deve conter @ e ser válido';
                email.setAttribute('style', 'border-color: red');
            } else {
                labelEmail.setAttribute('style', 'color: green');
                labelEmail.innerHTML = 'Email';
                email.setAttribute('style', 'border-color: green');
            }
        });
    }

    // Validação da senha
    if (password && labelPassword) {
        password.addEventListener('keyup', () => {
            if(password.value.length < 8) {
                labelPassword.setAttribute('style', 'color: red');
                labelPassword.innerHTML = 'Senha *Insira no mínimo 8 caracteres';
                password.setAttribute('style', 'border-color: red');
            } else {
                labelPassword.setAttribute('style', 'color: green');
                labelPassword.innerHTML = 'Senha';
                password.setAttribute('style', 'border-color: green');
            }
        });
    }

    // Função para validar formato de email
    function isValidEmail(email) {
        // Verifica se tem @, se tem texto antes e depois do @, e se tem ponto no domínio
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Função de cadastro
    function cadastrar() {
        if (username && email && password) {
            // Verifica se todos os campos são válidos
            if (username.value.length >= 10 && 
                isValidEmail(email.value) && 
                password.value.length >= 8) {
                
                let ListaUser = JSON.parse(localStorage.getItem('ListaUser') || '[]');
                
                ListaUser.push({
                    usernameCad: username.value,
                    emailCad: email.value,
                    passwordCad: password.value
                });
                
                localStorage.setItem('ListaUser', JSON.stringify(ListaUser));
                alert('Usuário cadastrado com sucesso!');
            } else {
                alert('Por favor, preencha todos os campos corretamente.');
            }
        }
    }

    // Event listener para o formulário
    const form = document.querySelector('.form');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            cadastrar();
        });
    }
});