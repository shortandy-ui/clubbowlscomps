# Bowls Club Competitions

One website for several bowls clubs. Each club runs its own set of knockout
competitions (6 to 12 of them, chosen by the club admin) with random draws,
automatic byes, a two-sided bracket showing the route to the final, and
players entering their own scores.

## Who can do what

| Who | How they sign in | What they can do |
|---|---|---|
| **Anyone** | no password | View brackets, enter match scores |
| **Club admin** | club password (on that club's page, "Admin") | Choose how many competitions (6-12) and name them, add entrants, make the draw, set play-by dates and contacts, clear a competition or the whole club for a new season, change the club password |
| **Master admin** | "Master login" on the home page | Add / rename / remove clubs, set any club's password, change the master password |

Every club has its own link, e.g. `https://your-site/#/c/alpha-bowls-club`.
The master admin page shows each club's link.

## Putting it online (Azure + GitHub)

### Step 1 - Put the files on GitHub
1. Make a new empty repository on GitHub (e.g. `club-comps`, branch `main`).
2. Upload everything from this folder. **Use Firefox** - it keeps folders
   (`src`, `api`) intact when you drag them in. Chrome can flatten them.
3. Check on GitHub that you can see `index.html`, `package.json`, and the
   `src` and `api` folders, each with files inside.

### Step 2 - Create the Static Web App in Azure
Azure portal -> Create a resource -> **Static Web App**
- Plan: **Free**
- Deployment source: **GitHub** -> choose your organisation, repository, branch `main`
- Build preset: **Custom**
- App location: `/`
- Api location: `api`
- Output location: `dist`

Azure adds its own workflow file to your repository and starts the first
build. (This zip deliberately has no workflow file, so there is nothing to
clash with it.)

### Step 3 - Add two settings
Static Web App -> **Environment variables** -> Add:
1. `AZURE_STORAGE_CONNECTION_STRING` = the connection string of your storage
   account (Storage account -> Access keys -> key1 -> Connection string).
   You can reuse the same account as your other apps - this site keeps its
   data in its own container, `club-comps-data`.
2. `MASTER_PASSWORD` = a starter password of your choice for the master admin.
   (If you skip this, the starter password is `masteradmin`.)

### Step 4 - First use
1. Open the site -> **Master login** -> sign in.
2. Change the master password straight away.
3. Add your clubs (name + a password for that club's admin).
4. Give each club its link. The club admin opens it, clicks **Admin**, signs
   in, then chooses the number of competitions and names them.

## Things worth knowing
- Passwords are checked on the server and stored hashed - they can't be read
  back through the website.
- By design, anyone with a club's link can enter scores (that is how the
  tournament moves on automatically). Entering or removing players, making
  draws and setting dates are protected in the screens by the club admin
  sign-in, but the data for a competition itself is open to anyone who knows
  how to talk to the site's API directly. That is fine for club use; it is not
  designed to stop a determined person.
- The range of 6-12 competitions is set at the top of `src/helpers.js`
  (`MIN_COMPS`, `MAX_COMPS`) if you ever want to change it.

## Testing on your own computer (optional)
```
npm install
npm test          # checks the draw works for every size from 2 to 64
npm run build
```
