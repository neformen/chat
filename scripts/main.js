
    let nickname,
        socket,
        user = {},
        targetUserId,
        host = location.origin.replace(/^http/, 'ws'),
        $nicknameForm = $('form.nickname'),
        $messageForm = $('form.message'),
        $modalWindow = $('.modal-wrap'),
        $usersList = $('#users-list'),
        $typingHint = $('.hint-typing'),
        $messageText = $('#m'),
        $messages = $('#messages');

    if (sessionStorage.getItem('nickname')) {
        user.name = sessionStorage.getItem('nickname');
        socket = io(host, { query: `user=${user.name}` });
        initChat(socket, user);
    } else {
        $modalWindow.show();
    }

    $nicknameForm.submit(function () {
        user.name = $('#nickname').val();
        if (user.name) {
            socket = io(host, { query: `user=${user.name}` });
            $modalWindow.hide();
            initChat(socket, user);
            sessionStorage.setItem('nickname', user.name);
        } else {
            $('#nickname').addClass('error');
        }
        
        return false;
    });

    function initChat(socket, user) {

        $messageForm.submit(() => {
            let file = $("#file").prop('files')[0];

            if(file) {
                socket.emit('chat message', {
                    file: $("#file").prop('files')[0],
                    user: user.name ,
                    type: $("#file").prop('files')[0].type
                });
                $("#file").val('');
            } else {
                let message = `${user.name}: ${$messageText.val()}`;
                let messageObj = {
                    message,
                    idTo: targetUserId
                };
                socket.emit('chat message', messageObj);
                $messages.append($('<li>').text(message));
                $messageText.val('');
                debugger
                $typingHint.find(`#${socket.id}`).remove();
            }
            return false;
        });

        socket.on('chat message', (msgs) => {
            if ($.isArray(msgs)) {
                msgs.forEach((msg) => {
                    $messages.append($('<li>').text(msg));
                })
            } else {
                $messages.append($('<li>').text(msgs));
            }
        });

        socket.on('chat file', (msg) => {
           var blob = new Blob([msg.file], {type: msg.type});
           var objectUrl = window.URL.createObjectURL(blob);
           $messages.append($('<li>').text(`${msg.user}: `).append($('<a>').attr('href', objectUrl).text('download file')));
           

        });

        socket.on('new user', (user) => {
            $usersList.append($('<li>').addClass('online-user').text(user.name).attr('data-id', user.id));
        });

        socket.on('delete user', (user) => {
            $(`*[data-id=${user.id}]`).remove();
        });

        socket.on('init all users', (users) => {
            $usersList.append($('<li>').addClass('online-user selected send-all').text('Send to all').attr('data-id', ''));
            users.forEach((user) => {
                $usersList.append($('<li>').addClass('online-user').text(user.name).attr('data-id', user.id));
            });
        });

        socket.on('start typing', (user) => {
            if (!$typingHint.find(`#${user.id}`).length) {
                $typingHint.append($('<span>').attr('id', user.id).html(`${user.name} is typing... <br>`));
            }
        });

        socket.on('stop typing', (user) => {
            $typingHint.find(`#${user.id}`).remove();
        });

        let stopTyping = debounce(() => {
            socket.emit('stop typing', {
                name: user.name,
                id: socket.id
            });
        }, 500);

        $messageText.on('keydown', (event) => {
            if (event.keyCode !== 13) {
                socket.emit('start typing', {
                    name: user.name,
                    id: socket.id
                });

                stopTyping();
            }
        });

        $usersList.on('click', '.online-user', (event) => {
            let $el = $(event.target);
            targetUserId = $el.data('id');

            if (targetUserId == socket.id) {
                return true;
            }

            $('.selected').removeClass('selected');
            $el.addClass('selected');
        });
    }

    function debounce(func, timeToWait) {

        var timeout;

        return function () {

            var context = this;
            var args = arguments;

            clearTimeout(timeout);

            timeout = setTimeout(function () {

                func.apply(context, args);

            }, timeToWait);
        };
    }
