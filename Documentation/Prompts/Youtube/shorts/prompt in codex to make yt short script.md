make me a complete script follow by what i should display on the screen during the script and the timing in second 180 words per minute

day number 4 of game dev
we've got some big news
but before that, let me take a step back give you some context why i choose this project
1. my grand father showed me this game and it reminds me of him
2. it's the first videogame i played
3. it stands the test of time and is still a major hit

so the big news i wanted to share with you is that we are now online and multiplayer, at playfree.dev

Day 4 dev vlog. Quick context: SMB3 was the first game I ever played—my grandfather showed it to me—so I’m building a web homage. Big news: we’re live and multiplayer at playfree.dev. No installs, no pay-to-win—just click and play.

Today’s wins:

Multiplayer polish: chat with /name, live name updates, crisp DOM name tags, defaulting to ws.playfree.dev.
Full state sync: player stats (lives, coins, score, timer, form), blocks/coins/labels, inventory, enemies, powerups, projectiles, hazards, timers, and editor changes all mirror between players.
Viewport/HUD: 19×17 view with a 3-tile HUD rendered inside the canvas.
Scaling: smooth CSS scaling to fit the viewport—no jumpy steps—plus anchored canvas layout.
Relay hardening: added an HTTP health endpoint for the Render relay.
Best moment: playing with my fiancée, building levels live, laughing at the chaos. Next up: push visuals closer to SMB3—study sprite sheets and make custom tiles now that the feel and launch are solid. Jump in at playfree.dev and try it.”

day number 4 actually started at 8pm after I posted day 3. My goal was to buy a url, host the web app, securely route the game traffic, allow users to join sandbox easely, and to push updates to the live url in a simple fashion.

We used namescheap to buy the domain playfree.dev.
Vercel to host the web app which we can push updates quickly through github
Render to host the multiplayer relay server
Cloudflare for routing game traffic securely
and to make the game simple to join we did some extra dns work to allow the web app to live on playfree.dev
You would assume that's easier to host the web app on the root domain but it's extra steps.
All of this stuff seems confusing because you don't do it often and there are a lot of steps but it's simpler than you think, especially with ai guiding you.

I felt like I should do this off stream because I thought I might data leak on accident. So that's why I started last night instead of today and stayed up until 2am.

Than Day 4 began with wiring up so content will be served to everyone in the room instead of locally.
It was extremely satisfying when my fiance was able to connect and her and I were exploring and making memes.

Than created name tags, a chat box where you can change your name with /name, fixed some bugs, noticed our game canvas was not proprtional smb3, reworked the hud as part of the game canvas, and began researching for visual updates.

So naturally for tomorrow we will begin focusing on creating smb3 styled inspired blocks and bg art. The game is in a very good place mechanically and with good enough features for now. It's been a wild 4 days and I can't even imagine what day 365 will be like but maybe i shouldnt think that far haha, anyways much love and I hope you have a good work week.