<template>
  <div class="profile-page">
    <div class="row justify-content-center">
      <div class="col-md-8">
        <div class="card profile-card">
          <div class="card-header text-center py-4">
            <h2 class="title-gradient">Profil de l'Invocateur</h2>
          </div>
          <div class="card-body p-4">
            <div v-if="profile" class="mb-5 text-center">
              <div class="icon-container mb-4">
                <img v-if="profile.profileIconId !== null && profile.profileIconId !== undefined" 
                     :src="`https://ddragon.leagueoflegends.com/cdn/14.24.1/img/profileicon/${profile.profileIconId}.png`" 
                     alt="Profile Icon" 
                     class="profile-icon"
                     @error="(e) => e.target.src = 'https://ddragon.leagueoflegends.com/cdn/14.24.1/img/profileicon/0.png'">
                <div class="level-badge" v-if="profile.summonerLevel">{{ profile.summonerLevel }}</div>
              </div>
              
              <h3 class="username-display">{{ profile.username }}</h3>
              <p class="riot-id text-secondary">{{ profile.riotId }}<span class="tag">#{{ profile.tagLine }}</span></p>
              
              <div class="stats-grid mt-4">
                <div class="stat-item">
                  <span class="stat-label">Région</span>
                  <span class="stat-value">{{ profile.region.toUpperCase() }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">MMR Interne</span>
                  <span class="stat-value text-warning">{{ profile.internalMMR || 1200 }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Rang SoloQ</span>
                  <span class="stat-value highlight">{{ profile.rank || 'Non classé' }}</span>
                </div>
                <div class="stat-item" v-if="profile.winrate">
                  <span class="stat-label">Winrate</span>
                  <span class="stat-value text-success">{{ profile.winrate }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Rôle suggéré</span>
                  <span class="stat-value text-info" v-if="profile.inferredRole && profile.inferredRole !== 'NONE'">{{ profile.inferredRole }}</span>
                  <span class="stat-value text-muted" v-else>Indisponible</span>
                </div>
              </div>
            </div>

            <div class="roles-section mt-5">
              <h4 class="section-title mb-4">Configuration Avancée</h4>
              <form @submit.prevent="saveProfile">
                <div class="row g-3 mb-4">
                  <div class="col-md-12">
                    <label for="manualRank" class="form-label custom-label">Rang Manuel (Écrase le rang Riot pour le matchmaking)</label>
                    <select class="form-select custom-select" id="manualRank" v-model="profileData.manualRank">
                      <option :value="null">Utiliser le rang Riot automatique</option>
                      <option v-for="t in ['IRON', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'EMERALD', 'DIAMOND', 'MASTER', 'GRANDMASTER', 'CHALLENGER']" :key="t" :value="t + ' I'">{{ t }}</option>
                    </select>
                  </div>
                </div>

                <h4 class="section-title mb-4">Mes Rôles</h4>
                <div class="row g-3">
                  <div class="col-md-4">
                    <label for="preferredRole1" class="form-label custom-label">Principal</label>
                    <select class="form-select custom-select" id="preferredRole1" v-model="profileData.role1">
                      <option value="NONE">Aucun</option>
                      <option value="TOP">Top</option>
                      <option value="JUNGLE">Jungle</option>
                      <option value="MID">Mid</option>
                      <option value="ADC">ADC</option>
                      <option value="Support">Support</option>
                    </select>
                  </div>
                  <div class="col-md-4">
                    <label for="preferredRole2" class="form-label custom-label">Secondaire</label>
                    <select class="form-select custom-select" id="preferredRole2" v-model="profileData.role2">
                      <option value="NONE">Aucun</option>
                      <option value="TOP">Top</option>
                      <option value="JUNGLE">Jungle</option>
                      <option value="MID">Mid</option>
                      <option value="ADC">ADC</option>
                      <option value="Support">Support</option>
                    </select>
                  </div>
                  <div class="col-md-4">
                    <label for="preferredRole3" class="form-label custom-label">Remplaçant</label>
                    <select class="form-select custom-select" id="preferredRole3" v-model="profileData.role3">
                      <option value="NONE">Aucun</option>
                      <option value="TOP">Top</option>
                      <option value="JUNGLE">Jungle</option>
                      <option value="MID">Mid</option>
                      <option value="ADC">ADC</option>
                      <option value="Support">Support</option>
                    </select>
                  </div>
                </div>
                <div class="text-center mt-4">
                  <button type="submit" class="btn btn-primary px-5">Enregistrer mon profil</button>
                  <p class="mt-3 feedback-msg" v-if="rolesMessage" :class="rolesMessageColor">{{ rolesMessage }}</p>
                </div>
              </form>
            </div>

          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.profile-page {
  padding-bottom: 50px;
}

.title-gradient {
  background: linear-gradient(to right, #fff, #94a3b8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-weight: 800;
}

.icon-container {
  position: relative;
  display: inline-block;
}

.profile-icon {
  width: 120px;
  height: 120px;
  border-radius: 24px;
  border: 2px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
}

.level-badge {
  position: absolute;
  bottom: -10px;
  left: 50%;
  transform: translateX(-50%);
  background: #1e293b;
  border: 1px solid #3b82f6;
  color: #fff;
  padding: 2px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 700;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.5);
}

.username-display {
  font-size: 2rem;
  font-weight: 800;
  margin-top: 20px;
  margin-bottom: 0;
  color: #ffffff;
}

.riot-id {
  font-size: 1.1rem;
  letter-spacing: 0.5px;
  color: #cbd5e1; /* Gris très clair */
}

.riot-id .tag {
  opacity: 0.8;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 20px;
  background: rgba(255, 255, 255, 0.05);
  padding: 25px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.stat-item {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  color: #94a3b8; /* Gardé en gris pour la hiérarchie, mais contrasté */
  letter-spacing: 1px;
  margin-bottom: 5px;
  font-weight: 600;
}

.stat-value {
  font-size: 1.1rem;
  font-weight: 700;
  color: #ffffff; /* Valeurs en blanc pur */
}

.stat-value.highlight {
  color: #3b82f6;
}

.section-title {
  font-weight: 700;
  border-left: 4px solid #3b82f6;
  padding-left: 15px;
  color: #fff;
}

.custom-label {
  color: #94a3b8;
  font-weight: 600;
  font-size: 0.9rem;
}

.feedback-msg {
  font-weight: 600;
  font-size: 0.9rem;
}

.green { color: #10b981; }
.red { color: #ef4444; }
</style>


<script setup>
import { ref, reactive, onMounted, watch } from 'vue';
import axios from 'axios';

const props = defineProps({
  currentUser: Object,
});

const profile = ref(null);
const profileData = reactive({
  manualRank: null,
  role1: 'NONE',
  role2: 'NONE',
  role3: 'NONE',
});
const rolesMessage = ref('');
const rolesMessageColor = ref('black');

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const fetchProfile = async () => {
  if (!props.currentUser || !props.currentUser.username) {
    return;
  }
  try {
    const response = await axios.get(`${API_BASE_URL}/profile/${props.currentUser.username}`);
    profile.value = response.data;
    profileData.manualRank = profile.value.manualRank || null;
    profileData.role1 = profile.value.preferredRole1 || 'NONE';
    profileData.role2 = profile.value.preferredRole2 || 'NONE';
    profileData.role3 = profile.value.preferredRole3 || 'NONE';
  } catch (error) {
    console.error('Error fetching profile:', error);
  }
};

const saveProfile = async () => {
  rolesMessage.value = '';
  try {
    const response = await axios.post(`${API_BASE_URL}/profile/update`, {
      username: props.currentUser.username,
      manualRank: profileData.manualRank,
      preferredRole1: profileData.role1,
      preferredRole2: profileData.role2,
      preferredRole3: profileData.role3,
    });
    rolesMessage.value = "Profil mis à jour !";
    rolesMessageColor.value = 'green';
    profile.value = response.data.user;
  } catch (error) {
    rolesMessage.value = 'Erreur lors de la mise à jour.';
    rolesMessageColor.value = 'red';
  }
};

// Fetch profile data when component is mounted or currentUser changes
onMounted(fetchProfile);
watch(() => props.currentUser, fetchProfile, { deep: true });
</script>

<style scoped>
.custom-select {
  background-color: #1a1b2e !important;
  color: #ffffff !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  border-radius: 12px;
  padding: 12px;
  font-weight: 500;
}

.custom-select:focus {
  border-color: #3b82f6 !important;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1) !important;
}
.profile-page {
  margin-top: 20px;
}
</style>
