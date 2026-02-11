const axios = require('axios');
require('dotenv').config();

const RIOT_API_KEY = process.env.RIOT_API_KEY;

class RiotApiService {
    constructor() {
        this.apiKey = RIOT_API_KEY;
        this.regions = {
            'euw1': 'europe',
            'eun1': 'europe',
            'na1': 'americas',
            'kr': 'asia'
        };
    }

    getHeaders() {
        return {
            "X-Riot-Token": this.apiKey
        };
    }

    async getAccountByRiotId(gameName, tagLine, regionPlatformId = 'euw1') {
        const routingRegion = this.regions[regionPlatformId.toLowerCase()] || 'europe';
        const url = `https://${routingRegion}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;
        try {
            const response = await axios.get(url, { headers: this.getHeaders() });
            return response.data;
        } catch (error) {
            console.error(`Error fetching account: ${error.message}`);
            throw error;
        }
    }

    async getSummonerByPuuid(puuid, platformId = 'euw1') {
        const url = `https://${platformId.toLowerCase()}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`;
        try {
            const response = await axios.get(url, { headers: this.getHeaders() });
            return response.data;
        } catch (error) {
            console.error(`Error fetching summoner: ${error.message}`);
            return null;
        }
    }

    async getLeagueEntriesByPuuid(puuid, platformId = 'euw1') {
        const url = `https://${platformId.toLowerCase()}.api.riotgames.com/lol/league/v4/entries/by-puuid/${puuid}`;
        try {
            const response = await axios.get(url, { headers: this.getHeaders() });
            return response.data;
        } catch (error) {
            console.error(`Error fetching league entries by PUUID: ${error.message}`);
            return [];
        }
    }

    async getMatchIds(puuid, platformId = 'euw1', count = 10) {
        const routingRegion = this.regions[platformId.toLowerCase()] || 'europe';
        const url = `https://${routingRegion}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?type=ranked&start=0&count=${count}`;
        try {
            const response = await axios.get(url, { headers: this.getHeaders() });
            return response.data;
        } catch (error) {
            console.error(`Error fetching match IDs: ${error.message}`);
            return [];
        }
    }

    async getMatchDetails(matchId, platformId = 'euw1') {
        const routingRegion = this.regions[platformId.toLowerCase()] || 'europe';
        const url = `https://${routingRegion}.api.riotgames.com/lol/match/v5/matches/${matchId}`;
        try {
            const response = await axios.get(url, { headers: this.getHeaders() });
            return response.data;
        } catch (error) {
            console.error(`Error fetching match details: ${error.message}`);
            return null;
        }
    }

    async deduceRole(puuid, platformId = 'euw1') {
        try {
            const matchIds = await this.getMatchIds(puuid, platformId, 10);
            if (!matchIds || matchIds.length === 0) return null;

            const recentMatches = matchIds.slice(0, 5);
            const roleCounts = { 'TOP': 0, 'JUNGLE': 0, 'MIDDLE': 0, 'BOTTOM': 0, 'UTILITY': 0 };
            
            const positionMap = {
                'TOP': 'TOP',
                'JUNGLE': 'JUNGLE',
                'MIDDLE': 'MIDDLE',
                'BOTTOM': 'BOTTOM',
                'UTILITY': 'UTILITY'
            };

            const promises = recentMatches.map(id => this.getMatchDetails(id, platformId));
            const results = await Promise.all(promises);

            results.forEach(match => {
                if (!match || !match.info || !match.info.participants) return;
                const participant = match.info.participants.find(p => p.puuid === puuid);
                if (participant && participant.teamPosition) {
                    const mappedRole = positionMap[participant.teamPosition];
                    if (mappedRole) {
                        roleCounts[mappedRole]++;
                    }
                }
            });

            let maxCount = -1;
            let deducedRole = null;
            for (const [role, count] of Object.entries(roleCounts)) {
                if (count > maxCount) {
                    maxCount = count;
                    deducedRole = role;
                }
            }
            return maxCount > 0 ? deducedRole : null;
        } catch (error) {
            console.error("Error deducing role:", error.message);
            return null;
        }
    }
}

module.exports = new RiotApiService();
