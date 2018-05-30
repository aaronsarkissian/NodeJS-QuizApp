$(function () {
	const address = 'http://localhost:3000';
    const socket = io(address);
    console.log('SOCKET Connected!');

    let $user = $('#users');
    let $email = $('#email');
    let $password = $('#password');
    let $getUsersTxt = $('#getUsersTxt');
    let $getUsers = $('#getUsers');
    const quizContainer = document.getElementById("quiz"); // let $quiz = $('quiz');
    let $logout = $('#logout');
    let $submitBtn = $('#submitBtn');
    let $timerTxt = $('#timerTxt');
    let $timerVal = $('#timerVal');
    let TOKEN = '';
    let globalAnsObject = {}; // For answers

    $logout.hide();
    $submitBtn.hide();
    $getUsersTxt.hide();
    $getUsers.hide();
    $timerTxt.hide();
    $timerVal.hide();

    // Signup
    $('#signup').click(function () {

        const userData = {
            email: $email.val(),
            password: $password.val()
        };

        $.ajax({
            type: 'POST',
            url: `${address}/user/signup`,
            // contentType: 'application/json',
            data: userData,
            success: function (data) {
                alert(data.message);
            },
            error: function (data) {
                // console.log(data);
                alert(data.responseJSON.message);
            }
        });
    });

    // Login
    $('#login').click(function () {

        const userData = {
            email: $email.val(),
            password: $password.val()
        };

        $.ajax({
            type: 'POST',
            url: `${address}/user/login`,
            // contentType: 'application/json',
            data: userData,
            success: function (data) {
                // console.log(data);
                alert(data.message);
                TOKEN = data.token;
                $getUsersTxt.show();
                $getUsers.show();
                $logout.show();
            },
            error: function (data) {
                alert(data.responseJSON.message);
            }
        });
    });


    // Logout
    $('#logout').click(function () {

        const userData = {
            email: $email.val(),
            password: $password.val()
        };

        $.ajax({
            type: 'POST',
            url: `${address}/user/logout`,
            // contentType: 'application/json',
            headers: {
                "Authorization": "Bearer " + TOKEN
            },
            data: userData,
            success: function (data) {
                TOKEN = null;
                $user.empty();
                $email.empty();
                $password.empty();
                $getUsersTxt.hide();
                $getUsers.hide();
                quizContainer.innerHTML = "";
                $submitBtn.hide();
                $logout.hide();
                $timerTxt.hide();
                $timerVal.hide();
                alert(data.message);
            },
            error: function (data) {
                alert(data.responseJSON.message);
            }
        });
    });

    // Get users
    $('#getUsers').on('click', function () {
        $.ajax({
            type: 'GET',
            url: `${address}/user/`,
            contentType: 'application/json',
            headers: {
                "Authorization": "Bearer " + TOKEN
            },
            success: function (data) {
                $user.empty();
                $.each(data.users, function (i, item) {
                    if ($email.val() !== item.email) {
                        $user.append('<div><li>' + item.email + '</li><button data-id="' + item.email + '" ' + 'class="select">Challenge</button></div>')
                    }
                });
            },
            error: function (data) {
                alert(data.responseJSON.message);
            }
        });
    });

    // Challenge users
    $user.delegate('.select', 'click', function () {
        const user2 = $(this).attr('data-id');

        $.ajax({
            type: 'GET',
            url: `${address}/challenge/request/` + $email.val() + '&' + user2,
            contentType: 'application/json',
            headers: {
                "Authorization": "Bearer " + TOKEN
            },
            success: function (data) {
                alert(data.message);
                // user1 send data
                socket.emit('CHALLENGE_REQ', $email.val());

            },
            error: function (data) {
                alert(data.responseJSON.message);
            }
        });
    });

    socket.on('CHALLENGE_REQ_BACK', (data) => {
        if (data.user == $email.val()) {
            let status;
            if (confirm(data.text)) {
                status = 1;
            } else {
                status = 0;
            }
            socket.emit('CHALLENGE_STATUS', {
                user: $email.val(),
                stat: status
            });
        }
    });

    socket.on('CHALLENGE_STATUS_BACK', (data) => {
        if (data.user1 == $email.val() || data.user2 == $email.val()) {
            alert(data.msg);
        }
        if ((data.stat === 1) && (data.user1 == $email.val())) {
            socket.emit('QUIZ_REQ');
        } else if ((data.stat === 0) && (data.user1 == $email.val())) {
            alert("Challenge another user!");
        }
    });

    let t;

    // Timer
    const timeHandler = (timeLeft) => {
        const globalTimeLeft = timeLeft;
        let counter = 0;
        document.getElementById("timerVal").innerHTML = (globalTimeLeft - counter);
        const timer = () => {
            if (globalTimeLeft - counter == 0) {
                $timerTxt.hide();
                $timerVal.hide();
                $submitBtn.hide();
                alert('Timeout! But don\'t worry your progress will be submitted automatically');
                $('#submitBtn').trigger("click");
                counter = 0;
                clearInterval(t);
                return;
            }
            counter++;
            document.getElementById("timerVal").innerHTML = (globalTimeLeft - counter);
        }
        t = setInterval(timer, 1000);
    }

    const quizBuilder = (data, timeLimit) => {
        // store the HTML output
        const output = [];
        // console.log(data); // The question data from server
        // for each question...
        data.forEach(item => {
            const option = [];

            for (opt of item.choices) {

                // Create the structure of the globalAnsObject
                if (globalAnsObject[`ID_${item.id}`] === undefined) {
                    globalAnsObject[`ID_${item.id}`] = {};
                    globalAnsObject[`ID_${item.id}`][`${opt.option}`] = 0;
                } else {
                    globalAnsObject[`ID_${item.id}`][`${opt.option}`] = 0;
                }

                option.push(
                    `<div id='ans'>
                    <input type="checkbox" id="${item.id}" value="${opt.option}" class="options">
                    <label for="${opt.option}">${opt.option}</label>
                    </div>`
                );
            }

            output.push(
                `<div id='question'>
                <p id='quiz-txt' class='quizTxt'>${item.question}</p>
                <ul id="quiz-opt" class='quizOpt'>
                    ${option.join("")}
                </ul>
                </div>`
            );
        });
        globalAnsObject[`user`] = `${$email.val()}`; // assigning who is answering the quiz
        // console.log(globalAnsObject); // Question OBJ structure, all with value 0

        // Put all the questions inside HTML
        quizContainer.innerHTML = output.join("");
        $timerTxt.show();
        $timerVal.show();
        $submitBtn.show();
        timeHandler(timeLimit);
    }



    // Listen to get all the quiz questions
    socket.on('QUIZ_PUSH', (data) => {
        if (data.user1 == $email.val() || data.user2 == $email.val()) {
            quizBuilder(data.fullData, data.timeLimit);
        }
    });

    // Submit the answers
    $('#submitBtn').click(function () {

        $('.options:checkbox:checked').each(function () {
            // Putting 1 for keys that user answered
            globalAnsObject[`ID_${this.id}`][`${this.value}`] = 1;
        });

        socket.emit('QUIZ_ANS', globalAnsObject);
        globalAnsObject = {}; // Removing the obj after sending
        quizContainer.innerHTML = "";
        $timerTxt.hide();
        $timerVal.hide();
        $submitBtn.hide();
        clearInterval(t);
        alert('Submitted successfully!\n Please wait for the other opponent to finish the game.');
    });

    socket.on('QUIZ_RESULTS', (data) => {
        if ($email.val() == data.user1 && (data.user1Score > data.user2Score)) {
            alert('You Won!\n' + 'Your score: ' + data.user1Score + '\nOpponent score:' + data.user2Score);
        }
        if ($email.val() == data.user1 && (data.user1Score < data.user2Score)) {
            alert('You Lost!\n' + 'Your score: ' + data.user1Score + '\nOpponent score:' + data.user2Score);
        }
        if ($email.val() == data.user1 && (data.user1Score == data.user2Score)) {
            alert('Draw!\n' + 'Your score: ' + data.user1Score + '\nOpponent score:' + data.user2Score);
        }
        if ($email.val() == data.user2 && (data.user1Score > data.user2Score)) {
            alert('You Lost!\n' + 'Your score: ' + data.user2Score + '\nOpponent score:' + data.user1Score);
        }
        if ($email.val() == data.user2 && (data.user1Score < data.user2Score)) {
            alert('You Won!\n' + 'Your score: ' + data.user2Score + '\nOpponent score:' + data.user1Score);
        }
        if ($email.val() == data.user2 && (data.user1Score == data.user2Score)) {
            alert('Draw!\n' + 'Your score: ' + data.user2Score + '\nOpponent score:' + data.user1Score);
        }
    });

});
