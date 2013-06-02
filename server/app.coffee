app = require('express')()
server = require('http').createServer(app)
io = require('socket.io').listen(server)

server.listen(8080)

app.get('/', (req, res) -> 
  res.sendfile(__dirname + '/index.html')
)

app.get('/client.js', (req, res) ->
    res.sendfile(__dirname + '/client.js')
)


#logged in users
usernames = {}

#accept incoming sockets
io.sockets.on 'connection', (socket) ->

    #broadcast chats to all users
    socket.on 'chat', (data) ->
            console.log "get chat #{data}"
            io.sockets.emit 'updatechat', socket.username, data

    #accept incoming user messages
    socket.on 'adduser', (username) ->
        console.log "new user #{username}"
        socket.username = username
        usernames[username] = username

        #echo connecting user
        socket.emit 'updatechat', 'SERVER', 'you have connected'

        #message all users and send user-update
        console.log("The useername is " + username)
        socket.broadcast.emit 'updatechat', 'SERVER', "#{username} has connected"
        io.sockets.emit 'updateusers', usernames
        
    socket.on 'disconnect', () ->
        console.log "user disconnect"
        delete usernames[socket.username]
        io.sockets.emit 'updateusers', usernames
        socket.broadcast.emit 'updatechat', 'SERVER', "#{socket.username} has disconnected"

