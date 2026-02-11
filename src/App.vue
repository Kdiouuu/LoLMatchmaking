<template>
  <div id="app">
    <nav class="navbar navbar-expand-lg navbar-dark">
      <div class="container-fluid">
        <a class="navbar-brand" href="#" @click="currentView = 'landing'">LoL Matchmaking</a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarNav">
          <ul class="navbar-nav ms-auto">
            <li class="nav-item">
              <a class="nav-link" :class="{ active: currentView === 'landing' }" aria-current="page" href="#" @click="currentView = 'landing'">Accueil</a>
            </li>
            <li class="nav-item" v-if="isLoggedIn">
              <a class="nav-link" :class="{ active: currentView === 'profile' }" href="#" @click="currentView = 'profile'">Mon Profil</a>
            </li>
            <li class="nav-item" v-if="!isLoggedIn">
              <a class="nav-link" :class="{ active: currentView === 'login' }" href="#" @click="currentView = 'login'">Connexion</a>
            </li>
            <li class="nav-item" v-if="!isLoggedIn">
              <a class="nav-link" :class="{ active: currentView === 'signup' }" href="#" @click="currentView = 'signup'">Créer un compte</a>
            </li>
            <li class="nav-item" v-if="isLoggedIn">
              <a class="nav-link" href="#" @click="logout">Déconnexion</a>
            </li>
          </ul>

        </div>
      </div>
    </nav>

    <div class="container mt-5">
      <!-- Landing Page -->
      <div v-if="currentView === 'landing'" class="text-center">
        <h1 class="display-4 mb-4">Bienvenue sur LoL Matchmaking</h1>
        <p class="lead">Trouvez des coéquipiers et rejoignez des parties de League of Legends plus facilement.</p>
        <div v-if="!isLoggedIn">
          <p>
            <button class="btn btn-primary btn-lg mx-2" @click="currentView = 'login'">Se connecter</button>
            <button class="btn btn-success btn-lg mx-2" @click="currentView = 'signup'">Créer un compte</button>
          </p>
        </div>
        <div v-else class="queue-section mt-5 p-4 border rounded bg-light">
          <p class="h4">Vous êtes connecté en tant que {{ currentUser.username }}</p>
          
          <div v-if="!isInQueue" class="mt-4">
            <div class="alert alert-info">
              Prêt à jouer ? Rejoignez la file d'attente pour être matché avec 9 autres joueurs.
            </div>
            <button class="btn btn-primary btn-xl" @click="joinQueue" :disabled="isJoining">
              {{ isJoining ? 'Connexion à la file...' : 'REJOINDRE LA FILE' }}
            </button>
          </div>
          
          <div v-else class="mt-4">
            <div class="spinner-border text-primary mb-3" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
            <p class="h5">En attente de joueurs... ({{ queueCount }}/10)</p>
            <button class="btn btn-danger mt-3" @click="leaveQueue">Quitter la file</button>
          </div>

          <!-- Display Match Result if found -->
          <div v-if="matchFound" class="mt-4">
            <div class="match-lobby p-4 border rounded">
              <h3 class="mb-4 title-gradient">{{ matchStatus === 'finished' ? 'Match Terminé' : 'Partie trouvée !' }}</h3>
              
              <div class="row mt-4">
                <!-- Team Blue -->
                <div class="col-md-6 border-end border-secondary border-opacity-25">
                  <h5 class="text-info d-flex justify-content-between align-items-center fw-bold mb-4">
                    <span>ÉQUIPE BLEUE <small class="text-white ms-2 opacity-75">(Avg: {{ blueAvgMmr }})</small></span>
                    <button v-if="matchStatus === 'playing' && !isOnTeam('blue')" class="btn btn-sm btn-outline-info" @click="swapTeam">Rejoindre</button>
                  </h5>
                  <ul class="list-group list-group-flush bg-transparent">
                    <li v-for="player in blueTeam" :key="player.username" class="list-group-item d-flex justify-content-between align-items-center bg-transparent border-secondary border-opacity-10 py-3">
                      <div>
                        <span class="player-name text-white fw-bold">{{ player.username }}</span>
                        <small class="text-secondary ms-2">({{ player.mmr }})</small>
                      </div>
                      <div class="d-flex align-items-center">
                        <select v-if="matchStatus === 'playing' && player.username === currentUser.username" 
                                class="form-select form-select-sm lobby-select" 
                                @change="changeRole($event.target.value)">
                          <option v-for="role in ['TOP', 'JUNGLE', 'MID', 'ADC', 'Support']" :key="role" :value="role" :selected="player.assignedRole === role">{{ role }}</option>
                        </select>
                        <span v-else class="role-badge role-blue">
                          {{ player.assignedRole }} <small v-if="player.roleChoice" class="ms-1">({{ player.roleChoice }})</small>
                        </span>
                      </div>
                    </li>
                  </ul>
                  <button v-if="matchStatus === 'playing'" class="btn btn-primary mt-4 w-100 py-3 fw-bold" @click="voteWinner('blue')" :disabled="hasVoted">
                    VOTER VICTOIRE BLEUE ({{ matchVotes.blue }})
                  </button>
                </div>

                <!-- Team Red -->
                <div class="col-md-6">
                  <h5 class="text-danger d-flex justify-content-between align-items-center fw-bold mb-4 ms-md-2">
                    <span>ÉQUIPE ROUGE <small class="text-white ms-2 opacity-75">(Avg: {{ redAvgMmr }})</small></span>
                    <button v-if="matchStatus === 'playing' && !isOnTeam('red')" class="btn btn-sm btn-outline-danger" @click="swapTeam">Rejoindre</button>
                  </h5>
                  <ul class="list-group list-group-flush bg-transparent ms-md-2">
                    <li v-for="player in redTeam" :key="player.username" class="list-group-item d-flex justify-content-between align-items-center bg-transparent border-secondary border-opacity-10 py-3">
                      <div>
                        <span class="player-name text-white fw-bold">{{ player.username }}</span>
                        <small class="text-secondary ms-2">({{ player.mmr }})</small>
                      </div>
                      <div class="d-flex align-items-center">
                        <select v-if="matchStatus === 'playing' && player.username === currentUser.username" 
                                class="form-select form-select-sm lobby-select" 
                                @change="changeRole($event.target.value)">
                          <option v-for="role in ['TOP', 'JUNGLE', 'MID', 'ADC', 'Support']" :key="role" :value="role" :selected="player.assignedRole === role">{{ role }}</option>
                        </select>
                        <span v-else class="role-badge role-red">
                          {{ player.assignedRole }} <small v-if="player.roleChoice" class="ms-1">({{ player.roleChoice }})</small>
                        </span>
                      </div>
                    </li>
                  </ul>
                  <button v-if="matchStatus === 'playing'" class="btn btn-danger mt-4 w-100 py-3 fw-bold ms-md-2" @click="voteWinner('red')" :disabled="hasVoted">
                    VOTER VICTOIRE ROUGE ({{ matchVotes.red }})
                  </button>
                </div>

              </div>


              <div v-if="matchStatus === 'playing'" class="mt-4 p-2 bg-dark bg-opacity-50 rounded text-secondary small text-center border border-secondary border-opacity-10">
                6 votes requis pour confirmer le résultat. Votes totaux : <span class="text-white fw-bold">{{ matchVotes.blue + matchVotes.red }}</span>
              </div>
              
              <div v-if="matchStatus === 'finished'" class="mt-4 p-3 bg-info bg-opacity-10 border border-info border-opacity-25 rounded text-center">
                <h4 class="text-info fw-bold mb-0">MATCH TERMINÉ - MMR MIS À JOUR</h4>
              </div>
            </div>
            <button v-if="matchStatus === 'finished'" class="btn btn-secondary mt-3 w-100 py-2" @click="closeMatch">Quitter le lobby</button>
          </div>

        </div>
      </div>


      <!-- Login Form -->
      <div v-if="currentView === 'login'" class="row justify-content-center">
        <div class="col-md-6">
          <div class="card">
            <div class="card-header text-center">
              <h2>Connexion</h2>
            </div>
            <div class="card-body">
              <form @submit.prevent="handleLogin">
                <div class="mb-3">
                  <label for="loginUsername" class="form-label text-white fw-bold">Nom d'utilisateur</label>
                  <input type="text" class="form-control" id="loginUsername" v-model="loginForm.username" required>
                </div>
                <div class="mb-3">
                  <label for="loginPassword" class="form-label text-white fw-bold">Mot de passe</label>
                  <input type="password" class="form-control" id="loginPassword" v-model="loginForm.password" required>
                </div>

                <button type="submit" class="btn btn-primary w-100">Se connecter</button>
                <p class="text-center mt-3" v-if="loginError" style="color: red;">{{ loginError }}</p>
              </form>
            </div>
          </div>
        </div>
      </div>

      <!-- Signup Form -->
      <div v-if="currentView === 'signup'" class="row justify-content-center">
        <div class="col-md-6">
          <div class="card">
            <div class="card-header text-center">
              <h2>Créer un compte</h2>
            </div>
            <div class="card-body">
              <form @submit.prevent="handleSignup">
                <div class="mb-3">
                  <label for="signupUsername" class="form-label text-white fw-bold">Nom d'utilisateur</label>
                  <input type="text" class="form-control" id="signupUsername" v-model="signupForm.username" required>
                </div>
                <div class="mb-3">
                  <label for="signupPassword" class="form-label text-white fw-bold">Mot de passe</label>
                  <input type="password" class="form-control" id="signupPassword" v-model="signupForm.password" required>
                </div>
                <div class="mb-3">
                  <label for="signupRiotId" class="form-label text-white fw-bold">Riot ID (Nom du joueur)</label>
                  <input type="text" class="form-control" id="signupRiotId" v-model="signupForm.riotId" placeholder="Ex: NomdInvocation" required>
                </div>
                <div class="mb-3">
                  <label for="signupTagLine" class="form-label text-white fw-bold">Tag Line (après le #)</label>
                  <input type="text" class="form-control" id="signupTagLine" v-model="signupForm.tagLine" placeholder="Ex: EUW" required>
                </div>

                <button type="submit" class="btn btn-success w-100">Créer le compte</button>
                <p class="text-center mt-3" v-if="signupError" style="color: red;">{{ signupError }}</p>
                <p class="text-center mt-3" v-if="signupSuccess" style="color: green;">{{ signupSuccess }}</p>
              </form>
            </div>
          </div>
        </div>
      </div>

      <!-- Profile Page -->
      <ProfilePage v-if="currentView === 'profile' && isLoggedIn" :currentUser="currentUser" />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue';
import axios from 'axios';
import ProfilePage from './components/ProfilePage.vue';

const currentView = ref('landing');
const isLoggedIn = ref(false);
const currentUser = ref(null);

const isInQueue = ref(false);
const isJoining = ref(false);
const queueCount = ref(0);
const matchFound = ref(false);
const matchId = ref(null);
const matchStatus = ref('playing');
const matchVotes = ref({ blue: 0, red: 0 });
const blueAvgMmr = ref(0);
const redAvgMmr = ref(0);
const hasVoted = ref(false);
const blueTeam = ref([]);
const redTeam = ref([]);
let queueInterval = null;

const loginForm = reactive({ username: '', password: '' });
const loginError = ref('');

const signupForm = reactive({ username: '', password: '', riotId: '', tagLine: '' });
const signupError = ref('');
const signupSuccess = ref('');

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

onMounted(() => {
  const savedUser = localStorage.getItem('user');
  if (savedUser) {
    currentUser.value = JSON.parse(savedUser);
    isLoggedIn.value = true;
    // Vérifier immédiatement si on est en file ou en match
    startQueuePolling();
  }
});

onUnmounted(() => {
  if (queueInterval) clearInterval(queueInterval);
});

const handleLogin = async () => {
  loginError.value = '';
  try {
    const response = await axios.post(`${API_BASE_URL}/login`, loginForm);
    if (response.data.user) {
      isLoggedIn.value = true;
      currentUser.value = response.data.user;
      localStorage.setItem('user', JSON.stringify(currentUser.value));
      currentView.value = 'landing';
      loginForm.username = '';
      loginForm.password = '';
    }
  } catch (error) {
    loginError.value = error.response ? error.response.data.message : 'Login failed';
  }
};

const handleSignup = async () => {
  signupError.value = '';
  signupSuccess.value = '';
  try {
    const response = await axios.post(`${API_BASE_URL}/signup`, signupForm);
    if (response.data.user) {
      signupSuccess.value = 'Compte créé avec succès ! Vous pouvez maintenant vous connecter.';
      signupForm.username = '';
      signupForm.password = '';
      signupForm.riotId = '';
      signupForm.tagLine = '';
      currentView.value = 'login';
    }
  } catch (error) {
    signupError.value = error.response ? error.response.data.message : 'Signup failed';
  }
};

const logout = () => {
  if (isInQueue.value) leaveQueue();
  isLoggedIn.value = false;
  currentUser.value = null;
  localStorage.removeItem('user');
  currentView.value = 'landing';
};

const joinQueue = async () => {
  isJoining.value = true;
  try {
    await axios.post(`${API_BASE_URL}/queue/join`, { username: currentUser.value.username });
    isInQueue.value = true;
    startQueuePolling();
  } catch (error) {
    alert(error.response?.data?.message || "Failed to join queue");
  } finally {
    isJoining.value = false;
  }
};

const leaveQueue = async () => {
  try {
    await axios.post(`${API_BASE_URL}/queue/leave`, { username: currentUser.value.username });
    isInQueue.value = false;
    matchFound.value = false;
    if (queueInterval) clearInterval(queueInterval);
  } catch (error) {
    console.error("Error leaving queue", error);
  }
};

const startQueuePolling = () => {
  if (queueInterval) clearInterval(queueInterval);
  queueInterval = setInterval(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/queue/status/${currentUser.value.username}`);
      queueCount.value = response.data.count;
      isInQueue.value = response.data.isInQueue; // Mise à jour de l'état local depuis le serveur
      
      if (response.data.match) {
        matchFound.value = true;
        isInQueue.value = false;
        matchId.value = response.data.match.id;
        matchStatus.value = response.data.match.status;
        matchVotes.value = response.data.match.votes;
        blueAvgMmr.value = response.data.match.blueAvgMmr;
        redAvgMmr.value = response.data.match.redAvgMmr;
        blueTeam.value = response.data.match.blue;
        redTeam.value = response.data.match.red;
      } else {
        matchFound.value = false;
        matchId.value = null;
      }
    } catch (error) {
      console.error("Queue polling error", error);
    }
  }, 2000);
};

const voteWinner = async (team) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/match/vote`, {
      matchId: matchId.value,
      username: currentUser.value.username,
      winnerTeam: team
    });
    // On reçoit le match complet en retour
    const m = response.data.match;
    matchVotes.value = m.votes;
    matchStatus.value = m.status;
    hasVoted.value = true;
  } catch (error) {
    alert(error.response?.data?.message || "Erreur lors du vote");
  }
};

const isOnTeam = (teamName) => {
  const team = teamName === 'blue' ? blueTeam.value : redTeam.value;
  return team.some(p => p.username === currentUser.value.username);
};

const swapTeam = async () => {
  try {
    const response = await axios.post(`${API_BASE_URL}/match/swap-team`, {
      matchId: matchId.value,
      username: currentUser.value.username
    });
    const m = response.data.match;
    blueTeam.value = m.blue;
    redTeam.value = m.red;
    blueAvgMmr.value = m.blueAvgMmr;
    redAvgMmr.value = m.redAvgMmr;
  } catch (error) {
    alert(error.response?.data?.message || "Impossible de changer d'équipe");
  }
};

const changeRole = async (newRole) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/match/change-role`, {
      matchId: matchId.value,
      username: currentUser.value.username,
      newRole: newRole
    });
    const m = response.data.match;
    blueTeam.value = m.blue;
    redTeam.value = m.red;
  } catch (error) {
    console.error("Error changing role", error);
  }
};

const closeMatch = () => {
  if (queueInterval) clearInterval(queueInterval);
  matchFound.value = false;
  matchId.value = null;
  matchStatus.value = 'playing';
  hasVoted.value = false;
  blueTeam.value = [];
  redTeam.value = [];
  // On laisse l'utilisateur revenir à l'écran d'accueil
};
</script>

<style scoped>
.queue-section {
  max-width: 800px;
  margin: 0 auto;
}
.btn-xl {
  padding: 1.5rem 3rem;
  font-size: 1.5rem;
  font-weight: bold;
}
</style>
