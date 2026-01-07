Day 5 

Today we built a sprite uploader which was more work than anticipated.
-since the game is live, we needed it to be secure.
-we created an author mode that can be accessed through chat with an encrypted password.
-this took up a lot of time as ive never done this before.
-codex had me hashing my own password, enable encryption and pushing the encryption
-now there was an alternative way that had vulnerability and only hackers would know how to get it.
-but rule one of cyber security is zero trust
-and i will sleep soundly tonight knowing someone did upload some freaky sprites to our game
-so what we did today was built an secure tunnel for me to upload sprites to our multiplayer online game
-I know I said today was art day but that's tomorrow. Insomnia + life owned me today but I gave it an honest fight
and can honestly say im happy i pushed through. it's 11:15pm and I want to turn this in by 12am so byeeeee
and also if you want to mess around with the game it's playfree.dev




We started off with a sprite uploader

, this allows the author to add any square shaped art to our game. When the art is uploaded it is resized to our game tile format and added to the pallete.

First we created an author mode, only the author will be able to upload sprites.



background uploader
-how is our current background handled
-how should it be handled
-should we make a background editor where you can paint your own? (not today though)


-Ability to editPallete Uploader
-HQ terrain to make the level look nice

current task lisk:
Add author gate: simple toggle/flag that shows upload UI only to you; everyone else sees palette only.
Define data shapes: tile registry entry, saved custom tiles list, and “golden” level payload (map + baked-in customs).
Implement upload pipeline: file input, validate (PNG/JPEG, square, size/dimension caps), resize to 16×16, strip metadata, store in registry.
Add palette category picker for upload and inject new tile previews into the right grid; wire selectEditorTile to support custom IDs.
Update renderer: check registry first; draw custom tile bitmaps; keep existing procedural tiles unchanged.
Draft vs published: save your new uploads to localStorage (draft) and add a “publish” action that bakes them into the shipped payload.
Reset control: button to clear localStorage overrides and reload the golden level + published customs.
Export/import: JSON export of map + custom tiles; JSON import that validates and rebuilds registry.
Limits/guardrails: cap custom tile count, enforce size limits, reject invalid imports with friendly errors.
Test flow: manual checklist (upload → palette → paint → save/reload → reset → export/import).

d