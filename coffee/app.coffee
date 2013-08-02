sio = require('socket.io')
express = require 'express'
http = require 'http'
app = express()
server = http.createServer(app)
fs = require('fs')

static_dir = __dirname + "/../pub/"

app.configure( () ->
  app.use(express.favicon())
  app.use(express.logger('dev'))
  app.use("/css", express.static(static_dir + "css"))
  app.use("/js", express.static(static_dir + "js"))
  app.use("/asset", express.static(static_dir + "asset"))
)
io = sio.listen(server)

app.use('/js',express.static("#{static_dir}js"))
app.use('/css',express.static("#{static_dir}css"))
app.use('/assets',express.static("#{static_dir}assets"))

#todo load different sharepads
app.get('/sharepad', (req, res) ->
  fs.readFile("#{static_dir}sharepad.html", (err, data) ->
    return res.end(404) if err?
    res.writeHead(200, {'Content-Type': 'text/html'})
    res.end(data)
  )
)

#logged in users
usernames = {}
nextUserID = 0
#accept incoming sockets
io.sockets.on 'connection', (socket) ->
  socket.userid = nextUserID++

  #broadcast chats to all users
  socket.on 'chat', (data) ->
    console.log "get chat #{data}"
    io.sockets.emit 'updatechat', socket.username, data

  #accept incoming user messages
  socket.on 'join', (username) ->
    console.log "new user #{username}"
    socket.username = username

    #message all users and send user-update
    socket.broadcast.emit 'newUser', username, 0

  socket.on 'disconnect', () ->
    console.log "user disconnect"
    socket.broadcast.emit 'userDisconnect', socket.userid

  socket.on 'drawUpdate', (drawObject) ->
    socket.broadcast.emit 'receiveDrawing', socket.userid, drawObject

  socket.on 'deleteDrawing', (md5) ->
    socket.broadcast.emit 'deleteDrawing', md5

  socket.on 'renameUser', (newName) ->
    socket.username = newName

#Heroku
port = process.env.PORT || 3000
server.listen(port, () ->
  console.log("Listening on #{port}")
)
