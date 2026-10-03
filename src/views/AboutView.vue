<script setup lang="ts">
import { useClimateController } from '../composables/useClimateController'
import { CONTROLLER_BASE_URL } from '../config'

const { connectionState } = useClimateController()

const isDemoMode = import.meta.env.VITE_USE_MOCK === 'true'
const usingCustomBaseUrl = CONTROLLER_BASE_URL !== ''
</script>

<template>
  <div class="about">
    <section class="card">
      <h2 class="card-title">What is the Climate Controller?</h2>
      <p class="lead">
        The Climate Controller is a temperature regulation system that monitors the
        surrounding temperature and controls a thermoelectric Peltier system to provide
        cooling or heating around a selected target temperature.
      </p>
      <p class="body">
        The controller itself — an ESP8266 microcontroller — reads the sensor, drives the
        Peltier and fans, and runs all control and safety logic. This website is only its
        interface: it shows you what the controller is doing and sends it your requests.
      </p>
    </section>

    <section class="card">
      <h2 class="card-title">How It Works</h2>
      <div class="flow" aria-hidden="true">
        <div class="flow-node">Temperature Sensor</div>
        <div class="flow-arrow">↓</div>
        <div class="flow-node">ESP8266</div>
        <div class="flow-arrow">↓</div>
        <div class="flow-node">Control Driver</div>
        <div class="flow-arrow">↓</div>
        <div class="flow-node">Peltier</div>
        <div class="flow-split">
          <span>Cooling</span>
          <span>Heating</span>
        </div>
        <div class="flow-arrow">＋</div>
        <div class="flow-node">Fans</div>
      </div>
      <p class="note">
        All control decisions and hardware safety logic run on the ESP8266 — the dashboard
        only displays and requests.
      </p>
    </section>

    <section class="card">
      <h2 class="card-title">How To Connect</h2>
      <ol class="steps">
        <li>Turn on the Climate Controller.</li>
        <li>Connect your phone or laptop to its Wi-Fi network.</li>
        <li>Open this dashboard.</li>
        <li>The dashboard connects to the controller automatically.</li>
      </ol>
      <p v-if="usingCustomBaseUrl" class="note">
        This copy of the dashboard is configured to reach the controller at
        <code>{{ CONTROLLER_BASE_URL }}</code>.
      </p>
      <p v-else class="note">
        The dashboard expects to be served by the controller itself (same origin). Current
        status: <strong>{{ connectionState }}</strong>.
      </p>
      <p v-if="isDemoMode" class="note demo-note">
        Demo mode is active — all data on this device is simulated. Run without
        <code>VITE_USE_MOCK=true</code> to talk to real hardware.
      </p>
    </section>

    <section class="card">
      <h2 class="card-title">Project Limitations</h2>
      <ul class="limitations">
        <li>
          Designed for a localized climate-control zone rather than controlling the
          temperature of an entire room.
        </li>
        <li>The OFF button is a software command, not a physical emergency stop.</li>
        <li>The temperature chart shows browser-collected history only; the controller
          does not store past readings.</li>
      </ul>
    </section>

    <section class="card">
      <h2 class="card-title">Credits</h2>
      <!-- TODO(project team): fill in real names before the exhibition. -->
      <dl class="credits">
        <div>
          <dt>Team</dt>
          <dd>Climate Controller Project Team</dd>
        </div>
        <div>
          <dt>Hardware</dt>
          <dd>—</dd>
        </div>
        <div>
          <dt>Software</dt>
          <dd>—</dd>
        </div>
        <div>
          <dt>Course</dt>
          <dd>—</dd>
        </div>
      </dl>
    </section>
  </div>
</template>

<style scoped>
.about {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 640px;
  margin: 0 auto;
}

.lead {
  margin: 0;
  font-size: 1rem;
}

.body,
.note {
  margin: 10px 0 0;
  font-size: 0.9rem;
  color: var(--text-muted);
}

.demo-note {
  color: var(--warn);
}

code {
  background: var(--surface-alt);
  border-radius: 4px;
  padding: 1px 5px;
  font-size: 0.85em;
}

/* --- flow diagram --------------------------------------------------------- */

.flow {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 0;
}

.flow-node {
  background: var(--surface-alt);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 8px 18px;
  font-size: 0.9rem;
  font-weight: 500;
}

.flow-arrow {
  color: var(--text-muted);
  font-size: 0.95rem;
  line-height: 1;
}

.flow-split {
  display: flex;
  gap: 16px;
  font-size: 0.85rem;
  color: var(--text-muted);
  margin-top: 2px;
}

/* --- lists ---------------------------------------------------------------- */

.steps,
.limitations {
  margin: 0;
  padding-left: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 0.92rem;
}

.limitations {
  list-style: disc;
}

/* --- credits --------------------------------------------------------------- */

.credits {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.credits dt {
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
}

.credits dd {
  margin: 2px 0 0;
  font-size: 0.92rem;
}
</style>
