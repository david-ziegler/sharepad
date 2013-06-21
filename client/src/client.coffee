appsocket = () ->

  console.log 'connecting to server'
  socket = io.connect('http://localhost:5000')

  socket.on 'connect', () ->
    console.log 'connected'
    socket.emit 'adduser', prompt "tell me your name"

  socket.on 'updatechat', (username, data) ->
    console.log 'got chat update from #{username} with data #{data}'
    $('#conversation').append("<b>#{username}:</b>#{data}<br />")

  socket.on 'updateusers', (data) ->
    console.log 'user update'
    $('#users').empty()
    $.each data, (key, value) ->
      $('#users').append("<div>#{key}</div>")

  $ () ->
    console.log 'register UI callbacks'
    $('#datasend').click () ->
      message = $('#data').val()
      $('#data').val ''
      socket.emit 'chat', message

    $('#data').keypress (e) ->
      $('#datasend').focus().click() if e.which == 13

@App or= {}
@App.socket = appsocket()
