$(function() {
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
            let $file = $("#file").prop('files')[0],
                messageText = $messageText.val(),
                messageObj = {};
            if (!$file && !messageText) return false;

            messageObj = {
                user: user.name,
                messageText,
                idTo: targetUserId,
                idFrom: socket.id
            }

            if ($file) {
                messageObj.attachedFile = {
                    file: $file,
                    type: $file.type,
                    name: $file.name
                }
            }

            socket.emit("chat message", messageObj);

            $("#file").val('');
            $messageText.val('');
            $typingHint.find(`#${socket.id}`).remove();

            return false;
        });

        socket.on('chat message', (msgObj) => {
            let $li = $('<li>').text(`${msgObj.user}: ${msgObj.messageText} `), 
                $link;

            if (msgObj.attachedFile) {
                let blob = new Blob([msgObj.attachedFile.file], {type: msgObj.attachedFile.type});
                let objectUrl = window.URL.createObjectURL(blob);
                $link = $("<a>").attr('href', objectUrl).attr('download', msgObj.attachedFile.name).text(msgObj.attachedFile.name);
                $li.append($link);
            }
             $messages.append($li);
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
});
