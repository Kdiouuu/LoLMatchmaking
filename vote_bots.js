const API = window.location.hostname === 'localhost' ? 'http://localhost:3000/api' : '/api';

async function voteBots(team = 'blue') {
    console.log(`--- Les bots votent pour l'équipe : ${team.toUpperCase()} ---`);
    
    for(let i=1; i<=9; i++) {
        const username = `Player${i}`;
        
        // 1. Récupérer le matchId actuel du bot
        const statusRes = await fetch(`${API}/queue/status/${username}`);
        const status = await statusRes.json();
        
        if (status.match) {
            const matchId = status.match.id;
            
            // 2. Voter
            const voteRes = await fetch(`${API}/match/vote`, { 
                method: 'POST', 
                headers: {'Content-Type': 'application/json'}, 
                body: JSON.stringify({ 
                    matchId, 
                    username, 
                    winnerTeam: team 
                }) 
            });
            
            const data = await voteRes.json();
            console.log(`[Bot ${i}] A voté. Status match: ${data.match.status}`);
            
            if (data.match.status === 'finished') {
                console.log("--- Match terminé avec succès ! ---");
                break; // Pas besoin de faire voter les autres si le seuil de 6 est atteint
            }
        } else {
            console.log(`[Bot ${i}] n'est pas dans un match actif.`);
        }
    }
}

// Par défaut vote pour blue. Tu peux appeler voteBots('red') pour l'autre équipe.
voteBots('blue');
