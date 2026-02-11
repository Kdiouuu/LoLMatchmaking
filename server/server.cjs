const express = require('express');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const riotApiService = require('./riotApiService.cjs');

const app = express();
const PORT = process.env.PORT || 3000;
const USERS_FILE = './users.json';

// Middleware
app.use(cors());
app.use(express.json());

// Helper functions
const readUsers = () => {
    if (!fs.existsSync(USERS_FILE)) { writeUsers([]); return []; }
    try {
        const data = fs.readFileSync(USERS_FILE, 'utf8');
        return data.trim() === '' ? [] : JSON.parse(data);
    } catch (error) { return []; }
};

const writeUsers = (users) => {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
};

const RANK_VALUES = {
    'IRON': 400, 'BRONZE': 600, 'SILVER': 800, 'GOLD': 1000,
    'PLATINUM': 1200, 'EMERALD': 1400, 'DIAMOND': 1600,
    'MASTER': 1800, 'GRANDMASTER': 2000, 'CHALLENGER': 2200
};
const TIER_VALUES = { 'IV': 0, 'III': 50, 'II': 100, 'I': 150 };

const calculateMMRFromRank = (rankString) => {
    if (!rankString || rankString === 'Non classé') return 700;
    try {
        const parts = rankString.split(' ');
        const tier = parts[0];
        const rank = parts[1];
        return (RANK_VALUES[tier] || 700) + (TIER_VALUES[rank] || 0);
    } catch (e) { return 700; }
};

// Fonction pour synchroniser les données Riot et le MMR
const syncUserProfile = async (user) => {
    if (user.puuid && !user.puuid.startsWith('test-')) {
        try {
            const info = await riotApiService.getSummonerByPuuid(user.puuid, user.region);
            if (info) {
                user.profileIconId = info.profileIconId;
                user.summonerLevel = info.summonerLevel;
                const entries = await riotApiService.getLeagueEntriesByPuuid(user.puuid, user.region);
                const solo = entries.find(e => e.queueType === 'RANKED_SOLO_5x5');
                if (solo) {
                    user.rank = `${solo.tier} ${solo.rank} - ${solo.leaguePoints} LP`;
                    user.winrate = ((solo.wins / (solo.wins + solo.losses)) * 100).toFixed(2) + '%';
                }
            }
        } catch (e) { console.error("Riot Sync Error:", e.message); }
    }

    if (user.internalMMR === null || user.internalMMR === undefined) {
        user.internalMMR = calculateMMRFromRank(user.manualRank || user.rank);
    }
    return user;
};

// --- MATCHMAKING LOGIC ---
let matchmakingQueue = [];
let activeMatches = [];

const processMatch = () => {
    if (matchmakingQueue.length < 10) return;
    const players = matchmakingQueue.splice(0, 10);
    players.sort((a, b) => b.mmr - a.mmr);
    const paires = [];
    for(let i=0; i<10; i+=2) { paires.push([players[i], players[i+1]]); }
    const blue = [];
    const red = [];
    paires.forEach((paire, index) => {
        if (index % 2 === 0) { blue.push(paire[0]); red.push(paire[1]); } 
        else { blue.push(paire[1]); red.push(paire[0]); }
    });
    const roles = ['TOP', 'JUNGLE', 'MID', 'ADC', 'Support'];
    const assignBalancedRoles = (teamA, teamB) => {
        teamA.sort((a, b) => b.mmr - a.mmr);
        teamB.sort((a, b) => b.mmr - a.mmr);
        const setRoleInfo = (p, role) => {
            p.assignedRole = role;
            const users = readUsers();
            const u = users.find(usr => usr.username === p.username);
            if (role === u.preferredRole1) p.roleChoice = "1";
            else if (role === u.preferredRole2) p.roleChoice = "2";
            else if (role === u.preferredRole3) p.roleChoice = "3";
            else p.roleChoice = "fill";
        };
        teamA.forEach((p, i) => setRoleInfo(p, roles[i]));
        teamB.forEach((p, i) => setRoleInfo(p, roles[i]));
    };
    assignBalancedRoles(blue, red);
    activeMatches.push({
        id: Date.now().toString(), blue, red,
        blueAvgMmr: Math.round(blue.reduce((a, b) => a + b.mmr, 0) / 5),
        redAvgMmr: Math.round(red.reduce((a, b) => a + b.mmr, 0) / 5),
        votes: { blue: 0, red: 0, voters: [] }, status: 'playing'
    });
};

// --- ROUTES ---

app.post('/api/signup', async (req, res) => {
    const { username, password, riotId, tagLine } = req.body;
    let users = readUsers();
    if (users.some(u => u.username === username)) return res.status(409).json({ message: "Exists" });
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        let puuid = tagLine === 'TEST' ? `test-${username}` : (await riotApiService.getAccountByRiotId(riotId, tagLine)).puuid;
        let newUser = {
            username, password: hashedPassword, riotId, tagLine, puuid,
            region: 'euw1', rank: null, manualRank: null, internalMMR: null, 
            preferredRole1: 'NONE', preferredRole2: 'NONE', preferredRole3: 'NONE'
        };
        newUser = await syncUserProfile(newUser);
        users.push(newUser); writeUsers(users);
        const { password: _, ...userWithoutPassword } = newUser;
        res.status(201).json({ user: userWithoutPassword });
    } catch (e) { res.status(500).json({ message: "Error" }); }
});

app.post('/api/login', async (req, res) => {
    let users = readUsers();
    const user = users.find(u => u.username === req.body.username);
    if (user && await bcrypt.compare(req.body.password, user.password)) {
        const updatedUser = await syncUserProfile(user);
        writeUsers(users);
        const { password: _, ...userWithoutPassword } = updatedUser;
        res.json({ user: userWithoutPassword });
    } else res.status(401).json({ message: "Invalid credentials" });
});

app.get('/api/profile/:username', async (req, res) => {
    let users = readUsers();
    const idx = users.findIndex(u => u.username === req.params.username);
    if (idx === -1) return res.status(404).send();
    users[idx] = await syncUserProfile(users[idx]);
    writeUsers(users);
    const { password: _, ...userWithoutPassword } = users[idx];
    res.json(userWithoutPassword);
});

app.post('/api/profile/update', (req, res) => {
    const { username, manualRank, preferredRole1, preferredRole2, preferredRole3 } = req.body;
    let users = readUsers();
    const idx = users.findIndex(u => u.username === username);
    if (idx === -1) return res.status(404).send();
    const oldManualRank = users[idx].manualRank;
    if (manualRank !== undefined) {
        users[idx].manualRank = manualRank;
        if (manualRank !== oldManualRank) {
            users[idx].internalMMR = calculateMMRFromRank(manualRank || users[idx].rank);
        }
    }
    if (preferredRole1 !== undefined) users[idx].preferredRole1 = preferredRole1;
    if (preferredRole2 !== undefined) users[idx].preferredRole2 = preferredRole2;
    if (preferredRole3 !== undefined) users[idx].preferredRole3 = preferredRole3;
    writeUsers(users);
    const { password: _, ...userWithoutPassword } = users[idx];
    res.json({ user: userWithoutPassword });
});

app.post('/api/queue/join', (req, res) => {
    const { username } = req.body;
    const users = readUsers();
    const user = users.find(u => u.username === username);
    if (!user) return res.status(404).json({ message: "User not found" });

    const inActiveMatch = activeMatches.some(m => m.status === 'playing' && [...m.blue, ...m.red].some(p => p.username === username));
    if (inActiveMatch) return res.status(403).json({ message: "Match in progress" });

    if (matchmakingQueue.some(p => p.username === username)) {
        return res.status(400).json({ message: "Already in queue" });
    }

    matchmakingQueue.push({
        username: user.username,
        mmr: user.internalMMR || 700,
        preferredRole1: user.preferredRole1,
        preferredRole2: user.preferredRole2,
        preferredRole3: user.preferredRole3
    });
    if (matchmakingQueue.length >= 10) processMatch();
    res.json({ count: matchmakingQueue.length });
});

app.get('/api/queue/status/:username', (req, res) => {
    const { username } = req.params;
    const match = activeMatches.find(m => [...m.blue, ...m.red].some(p => p.username === username));
    const isInQueue = matchmakingQueue.some(p => p.username === username);
    
    res.json({ 
        count: matchmakingQueue.length, 
        match: match || null,
        isInQueue: isInQueue
    });
});

app.post('/api/match/swap-team', (req, res) => {
    const { matchId, username } = req.body;
    const match = activeMatches.find(m => m.id === matchId);
    if (!match || match.status !== 'playing') return res.status(404).send();
    let fromTeam = match.blue.some(p => p.username === username) ? match.blue : match.red;
    let toTeam = fromTeam === match.blue ? match.red : match.blue;
    if (toTeam.length >= 6) return res.status(400).send();
    toTeam.push(fromTeam.splice(fromTeam.findIndex(p => p.username === username), 1)[0]);
    match.blueAvgMmr = Math.round(match.blue.reduce((a, b) => a + b.mmr, 0) / match.blue.length);
    match.redAvgMmr = Math.round(match.red.reduce((a, b) => a + b.mmr, 0) / match.red.length);
    res.json({ match });
});

app.post('/api/match/change-role', (req, res) => {
    const { matchId, username, newRole } = req.body;
    const match = activeMatches.find(m => m.id === matchId);
    if (!match) return res.status(404).send();
    const p = [...match.blue, ...match.red].find(p => p.username === username);
    if (p) {
        p.assignedRole = newRole;
        const u = readUsers().find(usr => usr.username === username);
        if (newRole === u.preferredRole1) p.roleChoice = "1";
        else if (newRole === u.preferredRole2) p.roleChoice = "2";
        else if (newRole === u.preferredRole3) p.roleChoice = "3";
        else p.roleChoice = "fill";
    }
    res.json({ match });
});

app.post('/api/match/vote', (req, res) => {
    const { matchId, username, winnerTeam } = req.body;
    const match = activeMatches.find(m => m.id === matchId);
    if (!match || match.status === 'finished') return res.status(404).send();
    if (match.votes.voters.includes(username)) return res.status(400).send();
    match.votes.voters.push(username);
    match.votes[winnerTeam]++;
    if (match.votes.blue >= 6 || match.votes.red >= 6) {
        const winTeam = match.votes.blue >= 6 ? 'blue' : 'red';
        match.status = 'finished';
        let users = readUsers();
        const winners = winTeam === 'blue' ? match.blue : match.red;
        const losers = winTeam === 'blue' ? match.red : match.blue;
        users.forEach(u => {
            if (winners.some(w => w.username === u.username)) u.internalMMR = (u.internalMMR || 1200) + 25;
            if (losers.some(l => l.username === u.username)) u.internalMMR = (u.internalMMR || 1200) - 25;
        });
        writeUsers(users);
        setTimeout(() => { activeMatches = activeMatches.filter(m => m.id !== matchId); }, 10000);
    }
    res.json({ match });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
