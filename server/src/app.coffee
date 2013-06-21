sio = require('socket.io')
express = require 'express'
http = require 'http'
app = express()
server = http.createServer(app)
fs = require('fs')

static_dir = "https://dl.dropboxusercontent.com/u/391374/sharepad/"

app.configure( () ->
  app.use(express.favicon())
  app.use(express.logger('dev'))
)
io = sio.listen(server)

app.use('/js',express.static("#{static_dir}js"))
app.use('/css',express.static("#{static_dir}css"))
app.use('/assets',express.static("#{staic_dir}assets"))

app.get('/chat.html', (req, res) ->
  fs.readFile("#{static_dir}chat.html", (err, data) ->
    return res.end(404) if err?
    res.writeHead(200, {'Content-Type': 'text/html'})
    res.end(data)
  )
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
    socket.broadcast.emit 'updatechat', 'SERVER', "#{socket.username}
      has disconnected"

#Heroku
port = process.env.PORT || 3000
server.listen(port, () ->
  console.log("Listening on #{port}")
)
