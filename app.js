const express = require('express')
const app = express()
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
const dbPath = path.join(__dirname, 'cricketMatchDetails.db')
let db = null
app.use(express.json())

const initializeServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })

    app.listen(3000, () => {
      console.log('server is running')
    })
  } catch (e) {
    console.log(`DB ERROR IS : ${e.message}`)
    process.exit(1)
  }
}

initializeServer()

const convertPlayerDetails = dbObject => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  }
}

const convertMatchDetails = dbObject => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  }
}

const convertPlayerMatch = dbObject => {
  return {
    playerMatchId: dbObject.player_match_id,
    playerId: dbObject.player_id,
    matchId: dbObject.match_id,
    score: dbObject.score,
    fours: dbObject.fours,
    sixes: dbObject.sixes,
  }
}

app.get('/players/', async (request, response) => {
  const getplayer = `
    SELECT * FROM player_details;`
  const resultPlayer = await db.all(getplayer)
  response.send(resultPlayer.map(each => convertPlayerDetails(each)))
})

app.get('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const singlePlayer = `
  SELECT * FROM player_details
  WHERE player_id = '${playerId}';`
  const getSinglePlayer = await db.get(singlePlayer)
  response.send(convertPlayerDetails(getSinglePlayer))
})

app.put('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const {playerName} = request.body
  const updatePlayer = `
  UPDATE player_details
  SET player_name = '${playerName}'
  WHERE player_id = '${playerId}';`
  await db.run(updatePlayer)
  response.send('Player Details Updated')
})

app.get('/matches/:matchId/', async (request, response) => {
  const {matchId} = request.params
  const getSinglePlayer = `
  SELECT * FROM match_details
  WHERE match_id = '${matchId}';`
  const getSingle = await db.get(getSinglePlayer)
  response.send(convertMatchDetails(getSingle))
})

app.get('/players/:playerId/matches', async (request, response) => {
  const {playerId} = request.params
  const getPlayerMatch = `
  SELECT match_id AS matchId,
  match, year
  FROM player_match_score NATURAL JOIN match_details
  WHERE player_id = '${playerId}';`
  const playerMatch = await db.all(getPlayerMatch)
  response.send(playerMatch)
})

app.get('/matches/:matchId/players', async (request, response) => {
  const {matchId} = request.params
  const getMatchPlayer = `
  SELECT 
  player_match_score.player_id AS playerId,
  player_name AS playerName
  FROM player_details NATURAL JOIN player_match_score
  WHERE match_id = '${matchId}';`
  const matchPlayer = await db.get(getMatchPlayer)
  response.send(matchPlayer)
})

app.get('/players/:playerId/playerScores', async (request, response) => {
  const {playerId} = request.params
  const getMatchscore = `
  SELECT player_id AS playerId,
  player_name AS playerName,
  SUM(score) AS totalScore,
  SUM(fours) AS totalFours,
  SUM(sixes) AS totalSixes
  FROM player_match_score
  NATURAL JOIN player_details
  WHERE player_id = '${playerId}';`
  const player = await db.get(getMatchscore)
  response.send(player)
})

module.exports = app
