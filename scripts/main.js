$(function () {
    var host = location.origin.replace(/^http/, 'ws');
    var socket;

    $('form.nickname').submit(function () {

        socket = io(host, { query:  "user=" + $('#nickname').val() });

        $('.modal-wrap').hide();
        return false;
    });

    $('form.message').submit(function () {
        socket.emit('chat message', $('#m').val());
        $('#m').val('');
        return false;
    });
    
    /*socket.on('chat message', function (msg) {
        $('#messages').append($('<li>').text(msg));
    });*/

    
    function guid() {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
        }
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
            s4() + '-' + s4() + s4() + s4();
    }
});