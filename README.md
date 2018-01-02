# my-voting-app
FCC Voting App Project see this [link](https://www.freecodecamp.org/challenges/build-a-voting-app) for full description. This is my first full-stack dynamic web app project.  It utilizes Twitter oauth for user authentication. Sharing is also enabled for Twitter. 

This app is running at https://my-voting-app.now.sh/.

The project used @iaincollins [Next.js Starter Project](https://github.com/iaincollins/nextjs-starter). Specifically the the project utilizes:

- Nextjs
- React
- Express
- MongoDB

There is an issue list for more enhancements.

## User Stories

- [x] As an authenticated user, I can keep my polls and come back later to access them.
- [x] As an authenticated user, I can share my polls with my friends.
- [x] As an authenticated user, I can see the aggregate results of my polls.
- [x] As an authenticated user, I can delete polls that I decide I don't want anymore.
- [x] As an authenticated user, I can create a poll with any number of possible items.
- [x] As an unauthenticated or authenticated user, I can see and vote on everyone's polls.
- [x] As an authenticated user, if I don't like the options on a poll, I can create a new option.

## To Run Locally
-  Clone repo
-  Configure app. Can use a .env file. There is a sample one [here](https://github.com/iaincollins/nextjs-starter/blob/master/.env.default).

``` 
npm install
npm run dev
```

## Deploy
I used the [Now](https://zeit.co/now) platform from [Zeit](https://zeit.co) to have a now.sh URL. Of course Heroku or other platforms can be used. 

```
npm install -g now
now -E
now alias <generated-url> <your-alias>
```
I used the -E option for ```now``` because it takes your .env file. You may want to use various .env files depending on your environment. i.e. DEV vs. Production.
