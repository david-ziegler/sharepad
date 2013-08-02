coffee -o pub/js/ coffee/client.coffee
git commit pub/js/client.js -m 'compile coffee client'
git push heroku master
