const API = window.location.hostname === 'localhost' ? 'http://localhost:3000/api' : '/api';

const ROLES = ['TOP', 'JUNGLE', 'MID', 'ADC', 'Support'];
const RANKS = ['IRON I', 'BRONZE I', 'SILVER I', 'GOLD I', 'PLATINUM I', 'EMERALD I', 'DIAMOND I'];

async function spawnBots() {
    console.log("--- Démarrage du spawn des bots avec rôles et MMR variés ---");
    
    for(let i=1; i<=9; i++) {
        const username = `Player${i}`;
        const randomRole = ROLES[Math.floor(Math.random() * ROLES.length)];
        // On donne des rangs différents pour tester le matchmaking
        const randomRank = RANKS[i % RANKS.length]; 

        const user = { 
            username, 
            password: '123', 
            riotId: `Bot${i}`, 
            tagLine: 'TEST' 
        };
        
        // 1. Inscription
        await fetch(`${API}/signup`, { 
            method: 'POST', 
            headers: {'Content-Type': 'application/json'}, 
            body: JSON.stringify(user) 
        }).catch(() => {});

        // 2. Mise à jour du profil (Rôle et Rang Manuel)
        await fetch(`${API}/profile/update`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                username,
                manualRank: randomRank,
                preferredRole1: randomRole
            })
        });

        // 3. Rejoindre la file
        const res = await fetch(`${API}/queue/join`, { 
            method: 'POST', 
            headers: {'Content-Type': 'application/json'}, 
            body: JSON.stringify({ username }) 
        });
        
        const data = await res.json();
        console.log(`[Bot ${i}] ${randomRank} | ${randomRole} | File: ${data.count || '?'}/10`);
    }
    console.log("--- Bots prêts et variés ! ---");
}

spawnBots();
