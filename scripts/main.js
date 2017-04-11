
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

    $nicknameForm.submit(function () {
        user.name = $('#nickname').val()
        socket = io(host, { query: `user=${user.name}` });
        $modalWindow.hide();
        initChat(socket, user);

        return false;
    });

    function initChat(socket, user) {
        let stopTyping = debounce(() => {
            socket.emit('stop typing', user.name);
        }, 500);

        $messageForm.submit(() => {
            let file = $("#file").prop('files')[0];

            if(file) {
                let reader = new FileReader();

                reader.onload = function(evt) {
                    socket.emit('chat message', {
                        user: user.name,
                        img: evt.target.result
                    });
                };

                reader.readAsDataURL(file);
            } else {
                let message = `${user.name}: ${$messageText.val()}`;
                let messageObj = {
                    message,
                    idTo: targetUserId
                };
                socket.emit('chat message', messageObj);
                $messages.append($('<li>').text(message));
                $messageText.val('');
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

        socket.on('chat image', (msg) => {
            $messages.append($('<li>').text(msg.user).append($('<img>').attr('src', msg.img)));
        });

        socket.on('new user', (users) => {
            $usersList.empty();
            users.forEach((user) => {
                $usersList.append($('<li>').addClass('online-user').text(user.name).attr('data-id', user.id));
            });

            $usersList.append($('<li>').addClass('online-user selected').text('Send to all').attr('data-id', ''));
        });

        socket.on('start typing', (nickname) => {
            $typingHint.text(`${nickname} start typing`);
        });

        socket.on('stop typing', (nickname) => {
            $typingHint.text('');
        });


        $messageText.on('keydown', () => {
            socket.emit('start typing', user.name);

            stopTyping();
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
