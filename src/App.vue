<template>
  <div id="matchmaking-app">
    <h1>LoL Matchmaking</h1>
    
    <!-- Zone de connexion Riot -->
    <div v-if="!isLoggedIn" class="login-section">
      <!-- 
        TODO: Implémenter la connexion avec l'API Riot (OAuth2 / Riot Sign-On)
        On affichera un bouton "Se connecter avec Riot Games"
      -->
      <p>Veuillez vous connecter pour rejoindre la file d'attente.</p>
      <button @click="login">Se connecter (Simulation)</button>
    </div>

    <!-- Zone de Matchmaking -->
    <div v-else class="queue-section">
      <p>Bienvenue, {{ playerName }} !</p>
      
      <!-- 
        TODO: Gérer l'état de la file d'attente
        - Bouton pour rejoindre/quitter la file
        - Affichage du nombre de joueurs (X / 10)
        - Utilisation de WebSockets (ex: Socket.io) pour le temps réel
      -->
      <div v-if="!inQueue">
        <button @click="joinQueue">Rejoindre la file d'attente</button>
      </div>
      <div v-else>
        <p>Recherche de joueurs en cours... ({{ playersCount }} / 10)</p>
        <button @click="leaveQueue">Quitter la file</button>
      </div>

      <!-- 
        TODO: Affichage des équipes une fois que 10 joueurs sont trouvés
        - Répartition des joueurs en deux équipes (Bleue / Rouge)
        - Assignation potentielle des rôles
      -->
      <div v-if="matchFound" class="match-results">
        <h2>Match Trouvé !</h2>
        <div class="teams">
          <div class="team blue">
            <h3>Équipe Bleue</h3>
            <!-- Liste des 5 joueurs -->
          </div>
          <div class="team red">
            <h3>Équipe Rouge</h3>
            <!-- Liste des 5 joueurs -->
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

// États de l'application
const isLoggedIn = ref(false)
const playerName = ref('')
const inQueue = ref(false)
const playersCount = ref(0)
const matchFound = ref(false)

// Fonctions placeholder
const login = () => {
  // Logique de simulation de connexion
  isLoggedIn.value = true
  playerName.value = 'Invocateur'
}

const joinQueue = () => {
  // Logique pour rejoindre la file sur le serveur
  inQueue.value = true
}

const leaveQueue = () => {
  // Logique pour quitter la file
  inQueue.value = false
}
</script>

<style scoped>
/* Styles de base pour l'interface */
#matchmaking-app {
  font-family: Arial, sans-serif;
  text-align: center;
  margin-top: 50px;
}

.login-section, .queue-section {
  border: 1px solid #ccc;
  padding: 20px;
  border-radius: 8px;
  display: inline-block;
}

.match-results {
  margin-top: 20px;
  color: green;
}

.teams {
  display: flex;
  justify-content: space-around;
  margin-top: 10px;
}
</style>
