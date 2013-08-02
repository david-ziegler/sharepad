root = exports ? this

class Appsocket
  socket = null
  drawCallback = deleteCallback = userJoinCallback = null

  constructor: (host, draw, del, userJoin) ->
    console.log "connecting to socket server #{host}"
    socket = io.connect(host)
    drawCallback = draw
    deleteCallback = del
    userJoinCallback = userJoin

    #register listening methods
    socket.on 'connect', () ->
      console.log 'connected to server'
      socket.emit 'join', prompt "tell me your name"

    socket.on 'receiveDrawing', (userID, drawObject) ->
      console.log 'got draw update from #{userID} with data #{data}'
      drawObject.md5 = buildChecksum(drawObject)
      console.log 'checksum is #{drawobject.md5}'
      drawCallback drawObject

    socket.on 'deleteDrawing', (md5)->
      console.log 'got delete drawing notification for #{md5}'
      deleteCallback(md5)

    socket.on 'newUser',  (username, userID) ->
      console.log 'some user logged in named #{username}'

    socket.on 'userDisconnect', (userID) ->
      console.log 'user #{userID} disconnected'

  @sendDrawing: (drawObject) ->
    console.log 'send draw update'
    socket.emit 'drawUpdate', drawObject
    buildChecksum drawObject

  @deleteDrawing: (md5) ->
    console.log 'send delete drawing'
    socket.emit 'deleteDrawing', md5

  renameUser = (newName) ->
    console.log 'rename myself'
    socket.emit 'renameUser', newName

unless root.socketFactory
    root.socketFactory = (host) ->
      new Appsocket(host)

buildChecksum = (drawObject)->
  crypto = require('crypto')
  serializedObject = "#{color}.#{thicknes}"
  for coordinate in drawObject.points
    serializedObject += ".#{coordinate.x}.#{coordinate.y}"
  crypto.createHash('md5').update(serializedObject).digest("hex")
